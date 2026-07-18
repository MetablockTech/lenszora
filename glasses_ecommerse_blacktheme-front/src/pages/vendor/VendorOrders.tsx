import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { vendors, getToken, getUser } from '@/lib/api'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Eye, Clock, CheckCircle, Package, AlertCircle, Loader2 } from 'lucide-react'
import { formatDate, formatPrice, getImageUrl } from '@/lib/utils'
import { toast } from 'sonner'

interface Order {
  _id: string;
  items: Array<{
    title: string;
    price: number;
    quantity: number;
    image: string;
    lens?: {
      name?: string;
      typeName?: string;
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
  createdAt: string;
  vendorOrder?: {
    items: Array<{
      title: string;
      price: number;
      quantity: number;
      image: string;
      lens?: any;
    }>;
    subtotal: number;
    vendorAmount: number;
    status: string;
  };
}

const VendorOrders: React.FC = () => {
  const navigate = useNavigate()
  const token = getToken()
  const user = getUser()
  const [orderList, setOrderList] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState('')
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('')

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
      const data = await vendors.getOrders(token)
      setOrderList(data.orders || [])
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus(orderId: string, newStatus: string, otp?: string) {
    if (!token) return
    try {
      setUpdatingStatus(newStatus)
      await vendors.updateOrderStatus(orderId, newStatus, statusNote, token, otp)
      // Refresh orders
      await loadOrders()
      // Refresh current selected order
      const updatedOrder = orderList.find(o => o._id === orderId)
      if (updatedOrder) {
        // Find update status in the refreshed list
        const refreshedData = await vendors.getOrders(token)
        const newlyUpdated = refreshedData.orders.find((o: any) => o._id === orderId)
        if (newlyUpdated) setSelectedOrder(newlyUpdated)
      }
      setDeliveryOtpInput('')
      setStatusNote('')
    } catch (err: any) {
      console.error('Failed to update status:', err)
      toast.error(err.response?.data?.message || 'Failed to update status. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-amber-100 text-amber-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const itemsList = (order: Order) => order.vendorOrder?.items || order.items;
  const orderTotal = (order: Order) => order.vendorOrder?.subtotal || order.total;
  const orderStatus = (order: Order) => order.vendorOrder?.status || order.orderStatus;

  return (
    <div className="p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold text-slate-900 mb-2">Customer Orders</h1>
        <p className="text-slate-500 font-medium">Track and manage orders placed on your products.</p>
      </div>

      <div className="bg-card border border-border/30 rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-secondary">
            <TableRow className="hover:bg-transparent border-border/30">
              <TableHead className="text-muted-foreground font-medium">Order ID</TableHead>
              <TableHead className="text-muted-foreground font-medium">Date</TableHead>
              <TableHead className="text-muted-foreground font-medium">Items</TableHead>
              <TableHead className="text-muted-foreground font-medium">Total</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-medium">
                  No customer orders found yet.
                </TableCell>
              </TableRow>
            ) : (
              orderList.map((order) => (
                <TableRow key={order._id} className="hover:bg-secondary/50 border-border/30 transition-colors">
                  <TableCell className="font-mono text-xs text-primary font-bold tracking-wider">
                    #{order._id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2 overflow-hidden mb-1.5">
                      {itemsList(order).slice(0, 3).map((item, i) => (
                        <img
                          key={i}
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover border border-border/50"
                          title={item.title}
                        />
                      ))}
                      {itemsList(order).length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-background bg-secondary text-[10px] font-bold text-muted-foreground border border-border">
                          +{itemsList(order).length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      {itemsList(order).reduce((sum, i) => sum + (i.quantity || 1), 0)} Items
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground font-bold">
                    {formatPrice(orderTotal(order))}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(orderStatus(order))}>
                      {orderStatus(order).toUpperCase().replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl bg-card border-border max-h-[85vh] overflow-y-auto overflow-x-hidden no-scrollbar text-foreground">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl text-primary font-bold">Order Details #{selectedOrder?._id.slice(-8).toUpperCase()}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid gap-6 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                  <h3 className="font-bold mb-3 text-primary text-lg">Order Summary</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between">
                      <span>Vendor Items:</span>
                      <span className="font-semibold text-foreground">{itemsList(selectedOrder).reduce((sum, i) => sum + (i.quantity || 1), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Date:</span>
                      <span className="font-semibold text-foreground">
                        {formatDate(selectedOrder.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border mt-2">
                      <span className="font-bold text-foreground">Your Share Total:</span>
                      <span className="font-black text-primary text-lg">{formatPrice(orderTotal(selectedOrder))}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-500 font-bold border-t border-dotted border-border/50 pt-2 mt-1">
                      <span>Net Payout (After Commission):</span>
                      <span>{formatPrice(selectedOrder.vendorOrder?.vendorAmount || orderTotal(selectedOrder))}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                  <h3 className="font-bold mb-3 text-primary text-lg">Status Control</h3>
                  <div className="text-sm space-y-4">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-1">Current Status</span>
                      <Badge className={getStatusColor(orderStatus(selectedOrder))}>
                        {orderStatus(selectedOrder).toUpperCase().replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-1">Payment</span>
                      <Badge variant={selectedOrder.paymentStatus === 'completed' ? 'default' : 'outline'} className={selectedOrder.paymentStatus === 'completed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}>
                        {selectedOrder.paymentStatus.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="pt-3 border-t border-border mt-1">
                      <label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-2">Update Fulfillment Status</label>
                      <div className="flex flex-col gap-2">
                        <select 
                          className="text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
                          value={updatingStatus || orderStatus(selectedOrder)}
                          onChange={(e) => {
                            const newStat = e.target.value;
                            if (newStat === orderStatus(selectedOrder)) return;
                            if (newStat !== 'delivered') {
                              handleUpdateStatus(selectedOrder._id, newStat);
                            } else {
                              setUpdatingStatus('delivered');
                            }
                          }}
                          disabled={!!updatingStatus && updatingStatus !== 'delivered' || orderStatus(selectedOrder) === 'delivered'}
                        >
                          {/* Only show forward statuses */}
                          {(() => {
                            const current = orderStatus(selectedOrder);
                            const priority = { 'pending': 0, 'confirmed': 1, 'shipped': 2, 'delivered': 3, 'cancelled': -1 };
                            const currentRank = priority[current] || 0;
                            
                            const options = [
                              { val: 'pending', label: 'Pending' },
                              { val: 'confirmed', label: 'Confirmed' },
                              { val: 'shipped', label: 'Shipped' },
                              { val: 'delivered', label: 'Delivered' }
                            ];

                            return (
                              <>
                                {options.map(opt => (
                                  <option 
                                    key={opt.val} 
                                    value={opt.val} 
                                    disabled={priority[opt.val] < currentRank}
                                  >
                                    {opt.label} {(priority[opt.val] < currentRank) ? '✓' : ''}
                                  </option>
                                ))}
                                {currentRank < 2 && (
                                  <option value="cancelled">Cancelled</option>
                                )}
                              </>
                            )
                          })()}
                        </select>
                        
                        {updatingStatus === 'delivered' && orderStatus(selectedOrder) !== 'delivered' && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">Enter Customer Delivery OTP</label>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                maxLength={6}
                                placeholder="******"
                                className="flex-1 text-center font-mono font-bold tracking-[0.3em] p-2 border border-blue-200 rounded bg-white text-slate-900"
                                value={deliveryOtpInput}
                                onChange={(e) => setDeliveryOtpInput(e.target.value.replace(/\D/g, ''))}
                              />
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered', deliveryOtpInput)}
                                disabled={deliveryOtpInput.length !== 6}
                              >
                                Verify & Deliver
                              </Button>
                            </div>
                            <button 
                              onClick={() => {
                                setUpdatingStatus(null);
                                setDeliveryOtpInput('');
                              }}
                              className="mt-2 text-[10px] text-blue-400 hover:text-blue-600 font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {updatingStatus && updatingStatus !== 'delivered' && (
                          <span className="text-[10px] text-primary animate-pulse font-bold">Updating to {updatingStatus.replace('_', ' ')}...</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-primary text-lg">Items Ordered</h3>
                <div className="border border-border rounded-lg overflow-hidden divide-y divide-border/50">
                  {itemsList(selectedOrder).map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                      <img src={getImageUrl(item.image)} alt={item.title} className="w-16 h-16 object-cover rounded-md border border-border/50 bg-background" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="font-bold text-foreground line-clamp-2">{item.title}</p>
                          <p className="font-black text-primary shrink-0">{formatPrice((item.price + (item.lens?.price || 0)) * (item.quantity || 1))}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                          <span className="bg-secondary/50 text-foreground font-semibold px-2 py-1 rounded">Qty: {item.quantity || 1}</span>
                          <span>{formatPrice(item.price + (item.lens?.price || 0))} each</span>
                        </div>

                        {item.lens && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                                LENS: {item.lens.packageName || item.lens.typeName || item.lens.name}
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                +{formatPrice(item.lens.price)}
                              </span>
                            </div>

                            {item.lens.prescription && (
                              <div className="bg-secondary/20 p-3 rounded-lg border border-border/50 shadow-inner mt-2">
                                <table className="w-full text-[10px] border-collapse">
                                  <thead>
                                    <tr className="border-b border-border/30 text-muted-foreground">
                                      <th className="text-left py-1 font-bold">Eye</th>
                                      <th className="text-center py-1 font-bold">SPH</th>
                                      <th className="text-center py-1 font-bold">CYL</th>
                                      <th className="text-center py-1 font-bold">AXIS</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/10">
                                    <tr className="text-foreground">
                                      <td className="font-bold py-1.5 pr-2">OD (Right)</td>
                                      <td className="text-center font-mono">{item.lens.prescription.od?.sph || '0.00'}</td>
                                      <td className="text-center font-mono">{item.lens.prescription.od?.cyl || '0.00'}</td>
                                      <td className="text-center font-mono">{item.lens.prescription.od?.axis || '0'}</td>
                                    </tr>
                                    <tr className="text-foreground">
                                      <td className="font-bold py-1.5 pr-2">OS (Left)</td>
                                      <td className="text-center font-mono">{item.lens.prescription.os?.sph || '0.00'}</td>
                                      <td className="text-center font-mono">{item.lens.prescription.os?.cyl || '0.00'}</td>
                                      <td className="text-center font-mono">{item.lens.prescription.os?.axis || '0'}</td>
                                    </tr>
                                    {item.lens.prescription.pd && (
                                      <tr className="text-foreground border-t border-border/30">
                                        <td className="font-bold pt-2">PD</td>
                                        <td colSpan={3} className="text-right pt-2 font-black text-primary">{item.lens.prescription.pd} mm</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
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

export default VendorOrders
