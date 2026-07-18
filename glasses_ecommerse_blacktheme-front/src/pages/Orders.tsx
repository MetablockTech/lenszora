import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { orders } from '@/lib/api'
import { getToken } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, Clock, CheckCircle, AlertCircle, Eye, Star } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'

interface Order {
  _id: string;
  items: Array<{
    title: string;
    price: number;
    quantity: number;
    image: string;
    lens?: {
      name?: string;
      packageName?: string;
      price: number;
    };
  }>;
  total: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

const Orders = () => {
  const navigate = useNavigate()
  const token = getToken()
  const [orderList, setOrderList] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    // Get user ID and check auth
    if (!token) {
      navigate('/auth?redirect=/orders')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUserId(payload.userId || payload.id)
      setAuthChecked(true)
    } catch {
      navigate('/auth?redirect=/orders')
    }
  }, [token, navigate])

  useEffect(() => {
    if (!authChecked || !userId) return
    loadOrders()
  }, [authChecked, userId])

  async function loadOrders() {
    try {
      const data = await orders.listUserOrders(userId, token)
      setOrderList(data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-12 text-center">Loading...</div>
        <Footer />
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'shipped':
        return <Package className="h-5 w-5 text-blue-600" />
      case 'pending':
      case 'confirmed':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Package className="h-5 w-5 text-slate-400" />
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
      case 'cancelled':
        return 'Cancelled'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-400'
      case 'shipped':
        return 'text-blue-400'
      case 'pending':
      case 'confirmed':
        return 'text-yellow-400'
      case 'cancelled':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-playfair font-bold text-white mb-2">
              My Orders
            </h1>
            <p className="text-gray-400">
              Track and manage all your orders in one place
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading your orders...</p>
            </div>
          ) : orderList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/50"
            >
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-playfair font-bold text-white mb-2">
                No Orders Yet
              </h2>
              <p className="text-gray-400 mb-6">
                Start shopping to place your first order!
              </p>
              <button
                onClick={() => navigate('/shop')}
                className="bg-yellow-600 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Shop Now
              </button>
            </motion.div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left">
                <thead className="bg-zinc-900 text-yellow-500 font-playfair">
                  <tr>
                    <th className="p-4 font-semibold">Order ID</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Items</th>
                    <th className="p-4 font-semibold">Total</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {orderList.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-black hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="p-4 font-mono text-sm text-gray-300">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="p-4 text-gray-300">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-4">
                        <div className="flex -space-x-2 overflow-hidden">
                          {order.items.slice(0, 3).map((item, i) => (
                            <img
                              key={i}
                              src={getImageUrl(item.image)}
                              alt={item.title}
                              className="inline-block h-8 w-8 rounded-full ring-2 ring-black object-cover"
                              title={item.title}
                            />
                          ))}
                          {order.items.length > 3 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-black bg-zinc-800 text-xs text-gray-400">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                          {order.items.some((i: any) => i.lens) && (
                            <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900/50">Incl. Lenses</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-white">
                        ₹{(order.items.reduce((sum, item) => sum + ((item.price + (item.lens?.price || 0)) * item.quantity), 0)).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.orderStatus)} border-current bg-transparent`}>
                          {order.orderStatus === 'delivered' && <CheckCircle className="h-3 w-3" />}
                          {order.orderStatus === 'shipped' && <Package className="h-3 w-3" />}
                          {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && <Clock className="h-3 w-3" />}
                          {order.orderStatus === 'cancelled' && <AlertCircle className="h-3 w-3" />}
                          {getStatusLabel(order.orderStatus)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/orders/${order._id}`)}
                            className="text-yellow-500 hover:text-yellow-400 font-medium text-sm flex items-center gap-1 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          {order.orderStatus === 'delivered' && (
                            <button
                              onClick={() => navigate(`/orders/${order._id}`)}
                              className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1 transition-colors"
                            >
                              <Star className="h-4 w-4" />
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Orders
