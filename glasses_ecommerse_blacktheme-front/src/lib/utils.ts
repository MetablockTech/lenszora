import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_URL } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(path?: string | null | any) {
  if (!path || path === 'undefined' || path === 'null') return '/placeholder.svg'
  
  if (Array.isArray(path)) {
    path = path.find((p: any) => p && typeof p === 'string')
    if (!path) return '/placeholder.svg'
  }

  if (typeof path !== 'string') return '/placeholder.svg'

  // Normalize Windows backslashes to forward slashes
  const normalizedPath = path.replace(/\\/g, '/')

  // Directly return if it's already a full URL or a local preview (blob)
  if (/^https?:\/\//i.test(normalizedPath) || normalizedPath.startsWith('blob:') || normalizedPath.startsWith('data:')) {
    return normalizedPath
  }

  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
  return `${API_URL}${cleanPath}`
}

export function getProductImage(product: any): string {
  if (!product) return getImageUrl(null)
  const img = (Array.isArray(product.images) && product.images.length > 0 && product.images.find((i: any) => i && typeof i === 'string'))
    || product.thumbnail
    || product.image
    || (typeof product.images === 'string' ? product.images : null)
  return getImageUrl(img)
}

export { getToken } from "./api"

export function formatPrice(price: number | undefined | null) {
  if (price === undefined || price === null) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price)
}

export function formatDate(date: string | Date | undefined) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function calculateProductDiscount(product: any, selectedVariant?: any) {
  if (!product) {
    return { sellingPrice: 0, mrpPrice: 0, hasDiscount: false, discountPercentage: 0, discountLabel: '' }
  }

  const rawPrice = Number(selectedVariant ? selectedVariant.price : (product.price || 0))
  let sellingPrice = rawPrice
  let mrpPrice = 0

  const origPrice = Number(product.originalPrice || 0)
  const discPrice = Number(product.discountPrice || product.salePrice || 0)
  const discAmount = Number(product.discountAmount || 0)
  const discType = String(product.discountType || 'percent').toLowerCase()

  if (origPrice > 0 && origPrice > rawPrice) {
    mrpPrice = origPrice
    sellingPrice = rawPrice
  } else if (discPrice > 0 && discPrice < rawPrice) {
    mrpPrice = rawPrice
    sellingPrice = discPrice
  } else if (discAmount > 0) {
    if (discType === 'percent' || discType === 'percentage') {
      mrpPrice = rawPrice
      sellingPrice = Math.round(rawPrice * (1 - Math.min(99, discAmount) / 100))
    } else if (discType === 'flat') {
      mrpPrice = rawPrice
      sellingPrice = Math.max(0, rawPrice - discAmount)
    }
  }

  const hasDiscount = mrpPrice > sellingPrice && sellingPrice > 0
  const discountPercentage = hasDiscount ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0
  const discountLabel = discAmount > 0 && discType === 'flat' 
    ? `₹${discAmount} OFF` 
    : `${discountPercentage || discAmount}% OFF`

  return {
    sellingPrice,
    mrpPrice,
    hasDiscount,
    discountPercentage: discountPercentage || (discType !== 'flat' ? discAmount : 0),
    discountLabel
  }
}


// "Frame Only" means no lens at all, so it should never be treated as a lens on the cart/order.
// Accepts either a lens type ({ name, key }) or a cart lens ({ type, typeName, name }).
type LensLike = { key?: string; _id?: string; name?: string; typeName?: string; type?: { key?: string; _id?: string; name?: string } | null }
export function isFrameOnlyLens(lens?: LensLike | null): boolean {
  if (!lens) return false
  const type = lens.type || lens
  if (type?.key === 'frame' || type?._id === 'frame') return true
  const name = String(type?.name || lens.typeName || lens.name || '').toLowerCase()
  return name.includes('frame only')
}

// ---- Frame colour swatches -------------------------------------------------
// Colours are stored as names ("Red", "Red/Blue"). A product may also store exact
// hex values per name in `colorSwatches`; otherwise we derive them from the name.
const NAMED_COLORS: Record<string, string> = {
  red: '#e53935', blue: '#1e63d6', green: '#2e7d32', black: '#111111', white: '#f5f5f5',
  yellow: '#fbc02d', purple: '#7b1fa2', pink: '#e91e63', orange: '#fb8c00', brown: '#6d4c41',
  grey: '#9e9e9e', gray: '#9e9e9e', silver: '#c0c0c0', gold: '#d4af37', 'rose gold': '#b76e79',
  navy: '#1a237e', maroon: '#800000', beige: '#d9c8a9', tortoise: '#8b5a2b', havana: '#7b4a2d',
  wine: '#722f37', teal: '#00897b', gunmetal: '#53565b', transparent: 'rgba(255,255,255,0.25)',
  crystal: 'rgba(255,255,255,0.25)', clear: 'rgba(255,255,255,0.25)',
  // contact-lens shades
  hazel: '#8e7618', honey: '#c68e17', amber: '#ffbf00', aqua: '#00bcd4', turquoise: '#40e0d0',
  violet: '#8f00ff', amethyst: '#9966cc', sapphire: '#0f52ba', emerald: '#2e8b57', jade: '#00a86b',
  'ocean blue': '#1e88e5', 'sky blue': '#87ceeb', 'true sapphire': '#0f52ba', 'pure hazel': '#8e7618',
  'gemstone green': '#2e8b57', 'brilliant blue': '#1565c0', mist: '#b0bec5', sterling: '#9ea7ad',
}

// "Red/Blue", "Red - Blue", "Red & Blue", "Red + Blue" -> ["Red", "Blue"]
export function splitColorName(name: string): string[] {
  return name.split(/\s*(?:\/|\s-\s|-|&|\+|\band\b)\s*/i).map((p) => p.trim()).filter(Boolean)
}

function resolveColor(part: string): string {
  const key = part.trim().toLowerCase()
  if (NAMED_COLORS[key]) return NAMED_COLORS[key]
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(key)) return key
  if (typeof CSS !== 'undefined' && CSS.supports?.('color', key)) return key
  return '#777777'
}

export function getColorHexes(name: string, swatches?: Record<string, string[]> | null): string[] {
  const saved = swatches?.[name]?.filter(Boolean)
  if (saved && saved.length > 0) return saved
  const whole = name.trim().toLowerCase()
  if (NAMED_COLORS[whole]) return [NAMED_COLORS[whole]]
  return splitColorName(name).map(resolveColor)
}

// CSS background for a swatch circle: solid for one colour, split diagonally for two-tone
export function colorSwatchBackground(name: string, swatches?: Record<string, string[]> | null): string {
  const hexes = getColorHexes(name, swatches)
  if (hexes.length <= 1) return hexes[0] || '#777777'
  const step = 100 / hexes.length
  const stops = hexes.map((h, i) => `${h} ${i * step}% ${(i + 1) * step}%`).join(', ')
  return `linear-gradient(135deg, ${stops})`
}

// Display label: "Red/Blue" -> "Red / Blue"
export function formatColorName(name: string): string {
  const parts = splitColorName(name)
  return parts.length > 1 ? parts.join(' / ') : name
}
