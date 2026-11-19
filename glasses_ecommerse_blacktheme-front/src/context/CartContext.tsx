import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { getToken, users, AUTH_CHANGE_EVENT } from '@/lib/api'

export interface CartItem {
    productId: string;
    vendorId?: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
    variant?: {
        sku: string;
        variantValues: Record<string, string>;
    };
    lens?: {
        name?: string;
        price: number;
        description?: string;
        // Keep these for backward compatibility
        typeId?: string;
        typeName?: string;
        packageId?: string;
        packageName?: string;
        type?: any; // Full type info for re-selection
        package?: any; // Full package info for re-selection
        prescription?: {
            od: { sph: string; cyl: string; axis: string };
            os: { sph: string; cyl: string; axis: string };
            pd: string;
        };
        lensSettings?: any;
    };
}

interface CartContextType {
    cart: CartItem[];
    total: number;
    itemCount: number;
    addToCart: (item: CartItem) => void;
    removeFromCart: (productId: string, variantSku?: string) => void;
    updateQuantity: (productId: string, quantity: number, variantSku?: string) => void;
    updateItem: (index: number, item: CartItem) => void;
    clearCart: () => void;
}
 
const CartContext = createContext<CartContextType | undefined>(undefined)

// The cart in this browser belongs to one account (or to a guest). Its owner is saved next to it so a
// cart left behind by one account is never shown to, or synced into, another account after logout/login.
const CART_KEY = 'cart'
const CART_OWNER_KEY = 'cart_owner'
const GUEST = 'guest'
// Initial state before the right cart is loaded; never saved or synced (it would wipe the account's cart)
const NOT_LOADED: CartItem[] = []

// The signed-in account's id, read from the session token (the API signs { userId })
function currentAccount(): string {
    const token = getToken()
    if (!token) return GUEST
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        return String(payload.userId || payload.id || payload._id || payload.sub || GUEST)
    } catch {
        return GUEST
    }
}

function readLocalCart(): CartItem[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

const sameLine = (a: CartItem, b: CartItem) =>
    a.productId === b.productId &&
    a.variant?.sku === b.variant?.sku &&
    (a.lens?.packageId || a.lens?.name || '') === (b.lens?.packageId || b.lens?.name || '')

// Account cart plus what was added as a guest before logging in (guest lines that already exist are kept once)
function mergeCarts(accountCart: CartItem[], guestCart: CartItem[]): CartItem[] {
    const merged = [...accountCart]
    guestCart.forEach((item) => {
        if (!merged.some((m) => sameLine(m, item))) merged.push(item)
    })
    return merged
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>(NOT_LOADED)
    // Account the cart in state belongs to; null while the right cart is still loading (nothing is saved or synced then)
    const ownerRef = useRef<string | null>(null)

    // Load the cart for whoever is signed in now. Runs on start and on every login / logout.
    useEffect(() => {
        let cancelled = false

        const loadForCurrentAccount = () => {
            const account = currentAccount()
            const local = readLocalCart()
            const localOwner = localStorage.getItem(CART_OWNER_KEY)
            ownerRef.current = null

            if (account === GUEST) {
                // Logged out: keep only a guest cart; a signed-in account's cart stays on its account
                const guestCart = !localOwner || localOwner === GUEST ? local : []
                ownerRef.current = GUEST
                setCart(guestCart)
                return
            }

            if (localOwner === account) {
                // Same account as before (e.g. page reload): the local copy is current
                ownerRef.current = account
                setCart(local)
                return
            }

            // Logged in to an account: its server cart, plus anything added as a guest just before.
            // A cart left by another account (or an old cart with no owner) is not carried over.
            const guestCart = localOwner === GUEST ? local : []
            users.getCart(getToken())
                .then((serverCart: CartItem[]) => mergeCarts(Array.isArray(serverCart) ? serverCart : [], guestCart))
                .catch(() => guestCart)
                .then((next) => {
                    if (cancelled || currentAccount() !== account) return
                    ownerRef.current = account
                    setCart(next)
                })
        }

        loadForCurrentAccount()
        window.addEventListener(AUTH_CHANGE_EVENT, loadForCurrentAccount)
        // Another tab logged in or out
        const onStorage = (e: StorageEvent) => { if (e.key === 'token') loadForCurrentAccount() }
        window.addEventListener('storage', onStorage)
        return () => {
            cancelled = true
            window.removeEventListener(AUTH_CHANGE_EVENT, loadForCurrentAccount)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    // Save the cart locally (with its owner) and sync it to the owner's account
    useEffect(() => {
        const owner = ownerRef.current
        if (cart === NOT_LOADED || !owner || owner !== currentAccount()) return
        localStorage.setItem(CART_KEY, JSON.stringify(cart))
        localStorage.setItem(CART_OWNER_KEY, owner)

        const token = getToken()
        if (token && owner !== GUEST) {
            users.syncCart(cart, token).catch((err) => {
                console.error('Failed to sync cart to server:', err)
            })
        }
    }, [cart])

    function addToCart(item: CartItem) {
        setCart((prev) => {
            // Find existing item - match by productId AND variant SKU AND lens
            const existing = prev.find((p) =>
                p.productId === item.productId &&
                p.variant?.sku === item.variant?.sku &&
                (item.lens ? (p.lens?.name === item.lens.name || p.lens?.packageId === item.lens.packageId) : !p.lens)
            )
            if (existing) {
                return prev.map((p) =>
                    (p.productId === item.productId &&
                        p.variant?.sku === item.variant?.sku &&
                        (item.lens ? (p.lens?.name === item.lens.name || p.lens?.packageId === item.lens.packageId) : !p.lens))
                        ? { ...p, quantity: p.quantity + item.quantity }
                        : p
                )
            }
            return [...prev, item]
        })
    }

    function removeFromCart(productId: string, variantSku?: string) {
        setCart((prev) => prev.filter((p) => {
            if (variantSku) {
                return !(p.productId === productId && p.variant?.sku === variantSku)
            }
            return p.productId !== productId
        }))
    }

    function updateQuantity(productId: string, quantity: number, variantSku?: string) {
        if (quantity <= 0) {
            removeFromCart(productId, variantSku)
            return
        }
        setCart((prev) =>
            prev.map((p) => {
                if (variantSku) {
                    return (p.productId === productId && p.variant?.sku === variantSku)
                        ? { ...p, quantity }
                        : p
                }
                return p.productId === productId ? { ...p, quantity } : p
            })
        )
    }

    function updateItem(index: number, newItem: CartItem) {
        setCart((prev) => {
            const next = [...prev]
            if (index >= 0 && index < next.length) {
                next[index] = newItem
            }
            return next
        })
    }

    function clearCart() {
        setCart([])
    }

    const total = cart.reduce((sum, item) => sum + ((item.price + (item.lens?.price || 0)) * item.quantity), 0)
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                cart,
                total,
                itemCount,
                addToCart,
                removeFromCart,
                updateQuantity,
                updateItem,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
