// Money on an order, as saved by the server. Orders placed before coupons were stored
// don't have subtotal/discount, so those fall back to adding up the items.
type OrderLike = {
  items?: Array<{ price: number; quantity?: number; lens?: { price?: number } | null }>
  subtotal?: number
  discount?: number
  shippingCharge?: number
  total?: number
  couponCode?: string
}

export function orderItemsTotal(order: OrderLike): number {
  if (typeof order.subtotal === 'number' && order.subtotal > 0) return order.subtotal
  return (order.items || []).reduce((sum, item) => sum + ((item.price + (item.lens?.price || 0)) * (item.quantity || 1)), 0)
}

export function orderDiscount(order: OrderLike): number {
  return Math.max(0, Number(order.discount) || 0)
}

/** Amount the customer pays: items − coupon discount + shipping */
export function orderPaidTotal(order: OrderLike): number {
  if (typeof order.total === 'number' && order.total > 0) return order.total
  return Math.max(0, orderItemsTotal(order) - orderDiscount(order)) + (Number(order.shippingCharge) || 0)
}
