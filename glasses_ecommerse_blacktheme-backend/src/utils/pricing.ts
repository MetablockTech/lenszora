// Server-side selling price, mirroring calculateProductDiscount() in the frontend (src/lib/utils.ts)
export function getSellingPrice(product: any, variant?: { price?: number } | null): number {
  const rawPrice = Number(variant?.price ?? product?.price ?? 0)
  const origPrice = Number(product?.originalPrice || 0)
  const discPrice = Number(product?.discountPrice || product?.salePrice || 0)
  const discAmount = Number(product?.discountAmount || 0)
  const discType = String(product?.discountType || 'percent').toLowerCase()

  if (origPrice > 0 && origPrice > rawPrice) return rawPrice
  if (discPrice > 0 && discPrice < rawPrice) return discPrice
  if (discAmount > 0) {
    if (discType === 'percent' || discType === 'percentage') {
      return Math.round(rawPrice * (1 - Math.min(99, discAmount) / 100))
    }
    if (discType === 'flat') return Math.max(0, rawPrice - discAmount)
  }
  return rawPrice
}
