import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { orders, returnRequests } from '@/lib/api'
import { getToken } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Star
} from 'lucide-react'
import ReviewForm from '@/components/product/ReviewForm'
import ReturnRequestModal from '@/components/product/ReturnRequestModal'
import { getImageUrl } from '@/lib/utils'

interface Order {
  _id: string;
  items: Array<{
    productId: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
    lens?: {
      name?: string;
      packageName?: string;
      price: number;
      prescription?: {
        od: { sph: string; cyl: string; axis: string };
        os: { sph: string; cyl: string; axis: string };
        pd: string;
      };
    };
  }>;
  total: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'partially_shipped' | 'partially_delivered';
  vendorOrders?: Array<{
    vendorId: string;
    status: string;
    items: any[];
    deliveryOtp?: string;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
}

const OrderDetail = () => {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const token = getToken()
  const [order, setOrder] = useState<Order | null>(null)
  const [returnRequestsData, setReturnRequestsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [reviewingProduct, setReviewingProduct] = useState<{ id: string, title: string } | null>(null)
  const [returningItem, setReturningItem] = useState<{ productId: string, title: string, variantSku?: string } | null>(null)

  useEffect(() => {
    if (!token) {
      navigate('/auth')
      return
    }
    setAuthChecked(true)
  }, [token, navigate])

  useEffect(() => {
    if (!authChecked || !orderId) return
    loadOrder()
  }, [authChecked, orderId])

  async function loadOrder() {
    try {
      const [orderData, requestsData] = await Promise.all([
        orders.getOrder(orderId!, token),
        returnRequests.getMyRequests(token)
      ])
      setOrder(orderData)
      setReturnRequestsData(requestsData || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="py-12 text-center">Loading order details...</div>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="py-12 text-center">Order not found</div>
        <Footer />
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'partially_delivered':
        return <CheckCircle className="h-6 w-6 text-green-400" />
      case 'shipped':
      case 'partially_shipped':
        return <Package className="h-6 w-6 text-blue-400" />
      case 'pending':
      case 'confirmed':
        return <Clock className="h-6 w-6 text-yellow-400" />
      case 'cancelled':
        return <AlertCircle className="h-6 w-6 text-red-400" />
      default:
        return <Package className="h-6 w-6 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'confirmed':
        return 'Confirmed'
      case 'shipped':
        return 'Shipped'
      case 'delivered':
        return 'Delivered'
      case 'partially_shipped':
        return 'Partially Shipped'
      case 'partially_delivered':
        return 'Partially Delivered'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const orderSteps = [
    { status: 'pending', label: 'Order Placed' },
    { status: 'confirmed', label: 'Confirmed' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'delivered', label: 'Delivered' },
  ]

  const currentStepIndex = orderSteps.findIndex((s) => s.status === order.orderStatus)

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-playfair font-bold text-white mb-2">
                  Order #{order._id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                  {getStatusIcon(order.orderStatus)}
                  <span className="font-semibold">
                    {getStatusLabel(order.orderStatus)}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${order.paymentStatus === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : order.paymentStatus === 'failed'
                      ? 'bg-red-900/20 text-red-400 border border-red-900/50'
                      : 'bg-yellow-900/20 text-yellow-400 border border-yellow-900/50'
                    }`}
                >
                  {order.paymentStatus === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  {order.paymentStatus.charAt(0).toUpperCase() +
                    order.paymentStatus.slice(1)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order Timeline */}
          {order.orderStatus !== 'cancelled' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-12 bg-zinc-900 border border-zinc-800 rounded-lg p-6"
            >
              <h2 className="text-xl font-bold text-white mb-6">Order Status</h2>
              <div className="flex justify-between items-center">
                {orderSteps.map((step, index) => (
                  <div key={step.status} className="flex flex-col items-center">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center mb-2 transition-all ${index <= currentStepIndex
                        ? 'bg-green-500 text-black'
                        : 'bg-zinc-800 text-gray-600'
                        }`}
                    >
                      {index <= currentStepIndex ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-current" />
                      )}
                    </div>
                    <p
                      className={`text-sm font-medium text-center ${index <= currentStepIndex
                        ? 'text-white'
                        : 'text-gray-500'
                        }`}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">Order Items</h2>
                <div className="space-y-6">
                  {order.items.map((item, index) => {
                    const productId = typeof item.productId === 'object' ? (item.productId as any)._id : item.productId
                    const existingRequest = returnRequestsData.find(r => {
                      const reqProductId = typeof r.productId === 'object' ? r.productId._id : r.productId
                      return r.orderId?._id === order._id && reqProductId === productId
                    })

                    // Find this item's specific status from vendorOrders
                    const vendorOrder = order.vendorOrders?.find(vo => {
                      return vo.items.some(vi => {
                        const viId = typeof vi.productId === 'object' ? (vi.productId as any)._id : vi.productId
                        return viId?.toString() === productId?.toString()
                      })
                    })

                    return (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-zinc-800 last:pb-0 last:border-0"
                      >
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          className="h-24 w-24 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-lg">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Subtotal: ₹{(item.price * item.quantity).toLocaleString()}
                          </p>

                          {vendorOrder && (
                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                vendorOrder.status === 'delivered' ? 'text-green-400 border-green-900/50 bg-green-900/10' :
                                vendorOrder.status === 'shipped' ? 'text-blue-400 border-blue-900/50 bg-blue-900/10' :
                                vendorOrder.status === 'cancelled' ? 'text-red-400 border-red-900/50 bg-red-900/10' :
                                'text-yellow-400 border-yellow-900/50 bg-yellow-900/10'
                              }`}>
                                {vendorOrder.status === 'pending' ? 'Processing' : vendorOrder.status.replace('_', ' ')}
                              </span>

                              {vendorOrder.status !== 'delivered' && vendorOrder.status !== 'cancelled' && vendorOrder.deliveryOtp && (
                                <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 px-4 py-1.5 rounded-lg shadow-lg shadow-yellow-500/10">
                                  <span className="text-[11px] font-black text-yellow-500 uppercase tracking-widest">Delivery OTP:</span>
                                  <span className="text-lg font-black text-white tracking-[0.3em]">{vendorOrder.deliveryOtp}</span>
                                </div>
                              )}

                              {vendorOrder.status === 'delivered' && (
                                <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Verified & Delivered</span>
                                </div>
                              )}
                            </div>
                          )}

                          {vendorOrder?.status !== 'delivered' && vendorOrder?.status !== 'cancelled' && vendorOrder?.deliveryOtp && (
                            <p className="text-[10px] text-gray-500 mt-2 italic">
                              Share this OTP with the delivery person only when you receive your items.
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 mt-4">
                            <p className="text-sm text-gray-400">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          {item.lens && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                                Lens: {item.lens.packageName || item.lens.name} (+₹{item.lens.price.toLocaleString()})
                              </p>
                              {item.lens.prescription && (
                                <div className="mt-2 bg-zinc-800/50 p-3 rounded-lg border border-zinc-800">
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Prescription Details</p>
                                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                                    <div>
                                      <p className="text-white font-bold mb-1 border-b border-zinc-700 pb-1">OD (Right Eye)</p>
                                      <p className="text-gray-400">SPH: <span className="text-white">{item.lens.prescription.od?.sph || '0.00'}</span></p>
                                      <p className="text-gray-400">CYL: <span className="text-white">{item.lens.prescription.od?.cyl || '0.00'}</span></p>
                                      <p className="text-gray-400">AXIS: <span className="text-white">{item.lens.prescription.od?.axis || '0'}</span></p>
                                    </div>
                                    <div>
                                      <p className="text-white font-bold mb-1 border-b border-zinc-700 pb-1">OS (Left Eye)</p>
                                      <p className="text-gray-400">SPH: <span className="text-white">{item.lens.prescription.os?.sph || '0.00'}</span></p>
                                      <p className="text-gray-400">CYL: <span className="text-white">{item.lens.prescription.os?.cyl || '0.00'}</span></p>
                                      <p className="text-gray-400">AXIS: <span className="text-white">{item.lens.prescription.os?.axis || '0'}</span></p>
                                    </div>
                                    {item.lens.prescription.pd && (
                                      <div className="col-span-2 pt-1 border-t border-zinc-800 flex justify-between">
                                        <span className="text-gray-400 font-bold">PD (Pupillary Distance)</span>
                                        <span className="text-white font-black">{item.lens.prescription.pd} mm</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="font-bold text-white mt-2">
                            Subtotal: ₹{((item.price + (item.lens?.price || 0)) * item.quantity).toLocaleString()}
                          </p>

                          {order.orderStatus === 'delivered' && (
                            <div className="flex gap-4 mt-4 items-center">
                              <button
                                onClick={() => setReviewingProduct({
                                  id: productId,
                                  title: item.title
                                })}
                                className="flex items-center gap-2 text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
                              >
                                <Star className="h-4 w-4" />
                                Write a Review
                              </button>

                              {existingRequest ? (
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${existingRequest.status === 'approved' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' :
                                  existingRequest.status === 'rejected' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                                    existingRequest.status === 'completed' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                                      'bg-yellow-900/20 text-yellow-400 border-yellow-900/50'
                                  }`}>
                                  {existingRequest.requestType === 'refund' ? 'Refund ' : 'Return '}
                                  {existingRequest.status.charAt(0).toUpperCase() + existingRequest.status.slice(1)}
                                </div>
                              ) : (
                                <button
                                  onClick={() => setReturningItem({
                                    productId: productId,
                                    title: item.title
                                  })}
                                  className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 transition-colors"
                                >
                                  <Package className="h-4 w-4" />
                                  Return / Exchange
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Review Form Overlay */}
              {reviewingProduct && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-lg"
                  >
                    <ReviewForm
                      productId={reviewingProduct.id}
                      productTitle={reviewingProduct.title}
                      onSuccess={() => {
                        setReviewingProduct(null);
                        loadOrder();
                      }}
                      onCancel={() => setReviewingProduct(null)}
                    />
                  </motion.div>
                </motion.div>
              )}

              {/* Return Request Modal */}
              {returningItem && (
                <ReturnRequestModal
                  isOpen={!!returningItem}
                  onClose={() => setReturningItem(null)}
                  orderId={orderId!}
                  productId={returningItem.productId}
                  productTitle={returningItem.title}
                  variantSku={returningItem.variantSku}
                  onSuccess={() => {
                    setReturningItem(null)
                    // Optionally reload order to show updated status if we add that later
                    loadOrder()
                  }}
                />
              )}
            </div>

            {/* Right: Summary */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </h2>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-white">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-gray-400">
                    {order.shippingAddress.address}
                  </p>
                  <p className="text-gray-400">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-400">{order.shippingAddress.country}</p>
                </div>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Contact Info</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <a
                      href={`mailto:${order.shippingAddress.email}`}
                      className="text-yellow-500 hover:text-yellow-400 hover:underline"
                    >
                      {order.shippingAddress.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <a
                      href={`tel:${order.shippingAddress.phone}`}
                      className="text-yellow-500 hover:text-yellow-400 hover:underline"
                    >
                      {order.shippingAddress.phone}
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frames ({order.items.reduce((sum, i) => sum + i.quantity, 0)})</span>
                    <span>₹{order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toLocaleString()}</span>
                  </div>
                  {order.items.some(i => i.lens) && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lens Upgrades</span>
                      <span>₹{order.items.reduce((sum, i) => sum + ((i.lens?.price || 0) * i.quantity), 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping</span>
                    <span className="text-green-400 font-medium">FREE</span>
                  </div>
                  <div className="border-t border-zinc-800 pt-3 flex justify-between font-bold text-lg">
                    <span className="text-white">Total</span>
                    <span className="text-yellow-500 underline underline-offset-8 decoration-yellow-500/30 font-black tracking-tight scale-110">
                      ₹{(order.items.reduce((sum, i) => sum + ((i.price + (i.lens?.price || 0)) * i.quantity), 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default OrderDetail
