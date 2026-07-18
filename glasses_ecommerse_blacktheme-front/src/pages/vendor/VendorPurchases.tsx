import React, { useEffect, useState } from 'react'
import { orders } from '@/lib/api'
import { getToken, getUser } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { Package, Clock, CheckCircle, AlertCircle, Eye, Star, Loader2 } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface Order {
  _id: string;
  items: Array<{
    title: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

const VendorPurchases: React.FC = () => {
  const navigate = useNavigate()
  const token = getToken()
  const user = getUser()
  const [orderList, setOrderList] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!token || !user) {
      navigate('/vendor/login')
      return
    }
    loadOrders()
  }, []) // Removed user and navigate to prevent infinite loop since getUser() returns a new object reference every render

  async function loadOrders() {
    try {
      setLoading(true)
      const data = await orders.listUserOrders(user.id || user._id, token)
      setOrderList(data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />
      case 'shipped':
        return <Package className="h-5 w-5 text-blue-600" />
      case 'pending':
      case 'confirmed':
        return <Clock className="h-5 w-5 text-amber-600" />
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Package className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'confirmed': return 'Confirmed'
      case 'shipped': return 'Shipped'
      case 'delivered': return 'Delivered'
      case 'cancelled': return 'Cancelled'
      default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'shipped': return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'pending':
      case 'confirmed': return 'text-amber-700 bg-amber-50 border-amber-200'
      case 'cancelled': return 'text-red-700 bg-red-50 border-red-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Bulk Purchases</h1>
        <p className="text-slate-500 text-sm">Track your bulk wholesale orders.</p>
      </div>

      {orderList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Purchases Yet</h2>
          <p className="text-slate-500 mb-6 font-medium">You haven't placed any bulk orders.</p>
          <button
            onClick={() => navigate('/vendor/bulk-marketplace')}
            className="bg-[#DAAB34] text-black font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-black hover:text-white transition-all text-xs"
          >
            Visit Bulk Marketplace
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-4 border-b border-slate-200">Order ID</th>
                  <th className="p-4 border-b border-slate-200">Date</th>
                  <th className="p-4 border-b border-slate-200">Items</th>
                  <th className="p-4 border-b border-slate-200">Total</th>
                  <th className="p-4 border-b border-slate-200">Status</th>
                  <th className="p-4 border-b border-slate-200">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderList.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs font-semibold text-slate-700">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex -space-x-2 overflow-hidden mb-1.5">
                        {order.items.slice(0, 3).map((item, i) => (
                          <img
                            key={i}
                            src={getImageUrl(item.image)}
                            alt={item.title}
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover border border-slate-200"
                            title={item.title}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {order.items.reduce((sum, i) => sum + (i.quantity || 1), 0)} Items
                      </div>
                    </td>
                    <td className="p-4 font-black tracking-tight text-slate-800">
                      ₹{order.total.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.orderStatus)}`}>
                        {getStatusLabel(order.orderStatus)}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-700 font-bold uppercase text-[10px] tracking-widest flex items-center gap-1.5 transition-colors bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl bg-white border-slate-200 max-h-[85vh] overflow-y-auto overflow-x-hidden no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900 font-bold">Order Details #{selectedOrder?._id.slice(-8).toUpperCase()}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid gap-6 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h3 className="font-bold mb-2 text-slate-800">Order Summary</h3>
                  <div className="text-sm text-slate-600 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-semibold text-slate-900">{selectedOrder.items.reduce((sum, i) => sum + (i.quantity || 1), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Date:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
                      <span className="font-bold text-slate-800">Grand Total:</span>
                      <span className="font-black text-slate-900">₹{selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h3 className="font-bold mb-2 text-slate-800">Status Check</h3>
                  <div className="text-sm space-y-3">
                    <div>
                      <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1">Order Status</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(selectedOrder.orderStatus)}`}>
                        {getStatusLabel(selectedOrder.orderStatus)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1">Payment Status</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${selectedOrder.paymentStatus === 'completed' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-slate-800">Items Ordered</h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white hover:bg-slate-50 transition-colors">
                      <img src={getImageUrl(item.image)} alt={item.title} className="w-16 h-16 object-cover rounded-md border border-slate-200 bg-slate-50" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="font-bold text-slate-900 line-clamp-2">{item.title}</p>
                          <p className="font-black text-slate-900 shrink-0">₹{(item.price * (item.quantity || 1)).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                          <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded">Qty: {item.quantity || 1}</span>
                          <span>₹{item.price.toLocaleString()} each</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VendorPurchases
