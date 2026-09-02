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
