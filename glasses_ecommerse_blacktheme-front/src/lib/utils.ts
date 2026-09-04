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

export function getToken() {
  return localStorage.getItem('token')
}

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

