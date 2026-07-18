import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

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

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])

    // Load cart from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('cart')
        if (saved) {
            try {
                setCart(JSON.parse(saved))
            } catch {
                setCart([])
            }
        }
    }, [])

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart))
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
