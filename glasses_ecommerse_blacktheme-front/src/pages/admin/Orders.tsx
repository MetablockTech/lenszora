import React, { useEffect, useState } from 'react'
import { orders, getToken, API_URL } from '@/lib/api'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Eye, Truck, CheckCircle, XCircle, Clock, ArrowLeft, Star, Store } from 'lucide-react'
import { formatDate, formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

const OrdersPage: React.FC = () => {
  const [orderList, setOrderList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [statusUpdate, setStatusUpdate] = useState({ status: '', note: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalPages = Math.ceil(orderList.length / itemsPerPage)
  const paginatedList = orderList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const token = getToken()

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      setLoading(true)
      const data = await orders.getAll(token)
      setOrderList(data)
      console.log('[DEBUG] Orders loaded:', data.length, 'orders')
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'partially_shipped': return 'bg-cyan-100 text-cyan-800'
      case 'partially_delivered': return 'bg-emerald-100 text-emerald-800'
      case 'confirmed': return 'bg-purple-100 text-purple-800'
      case 'cancelled':
      case 'returned':
      case 'refunded': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  async function handleStatusUpdate() {
    try {
      await orders.updateStatus(selectedOrder._id, statusUpdate.status, statusUpdate.note, token)
      setIsStatusOpen(false)
      fetchOrders()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-playfair font-bold text-slate-900 mb-2">Orders</h1>
        <p className="text-slate-500">Manage and track customer orders.</p>
      </div>

      <div className="bg-card border border-border/30 rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-secondary">
            <TableRow className="hover:bg-transparent border-border/30">
              <TableHead className="text-muted-foreground font-medium">Order ID</TableHead>
              <TableHead className="text-muted-foreground font-medium">Customer</TableHead>
              <TableHead className="text-muted-foreground font-medium">Date</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Qty</TableHead>
              <TableHead className="text-muted-foreground font-medium">Total</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Payment</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading orders...</TableCell>
              </TableRow>
            ) : orderList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No orders found.</TableCell>
              </TableRow>
            ) : (
              paginatedList.map((order) => (
                <TableRow key={order._id} className="hover:bg-secondary/50 border-border/30 transition-colors">
                  <TableCell className="font-mono text-xs text-primary">{order._id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</span>
                      <span className="text-xs text-muted-foreground">{order.userId?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{formatDate(order.createdAt)}</TableCell>
                  <TableCell className="text-foreground font-bold text-center">
                    {order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0}
                  </TableCell>
                  <TableCell className="text-foreground font-medium">
                    {formatPrice(order.items?.reduce((sum: number, item: any) => sum + ((item.price + (item.lens?.price || 0)) * (item.quantity || 1)), 0) || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(order.orderStatus)}>
                        {order.orderStatus.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {order.vendorOrders?.length > 1 && (
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                          {order.vendorOrders.filter((vo: any) => vo.status === 'delivered').length}/{order.vendorOrders.length} Vendors Ready
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'outline'} className={order.paymentStatus === 'completed' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground border-border'}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => {
                        setSelectedOrder(order)
                        setIsDetailsOpen(true)
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="hover:bg-amber-500/10 hover:text-amber-500 transition-colors disabled:opacity-30" 
                        onClick={() => {
                          setSelectedOrder(order)
                          setStatusUpdate({ status: order.orderStatus, note: '' })
                          setIsStatusOpen(true)
                        }}
                        disabled={['shipped', 'delivered', 'partially_shipped', 'partially_delivered'].includes(order.orderStatus)}
                        title={['shipped', 'delivered', 'partially_shipped', 'partially_delivered'].includes(order.orderStatus) ? "Cannot change status once fulfillment has started" : "Update Status"}
                      >
                        <Truck className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {orderList.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/30">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, orderList.length)} of {orderList.length} orders
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-border text-foreground hover:bg-secondary"
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-secondary"}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-border text-foreground hover:bg-secondary"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl bg-card border-border max-h-[85vh] overflow-y-auto overflow-x-hidden no-scrollbar">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl text-foreground">Order Details #{selectedOrder?._id.slice(-6).toUpperCase()}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 text-primary">Shipping Address</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                    <p>{selectedOrder.shippingAddress.phone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-primary">Order Summary</h3>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Subtotal</span>
                      <span className="text-foreground">{formatPrice(selectedOrder.items.reduce((acc: number, item: any) => acc + ((item.price + (item.lens?.price || 0)) * item.quantity), 0) || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Shipping</span>
                      <span className="text-foreground">{formatPrice(selectedOrder.shippingCharge || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold border-t border-border mt-2 pt-2 text-foreground">
                      <span>Total</span>
                      <span className="text-lg text-primary">{formatPrice(selectedOrder.items.reduce((acc: number, item: any) => acc + ((item.price + (item.lens?.price || 0)) * item.quantity), 0) || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Fulfillment Tracking */}
              <div className="mt-4">
                <h3 className="font-bold mb-4 text-amber-500 uppercase tracking-widest text-sm border-b border-amber-900/30 pb-2 flex items-center justify-between">
                  <span>Vendor Fulfillment Status</span>
                  {selectedOrder.vendorOrders?.length > 1 && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30 uppercase font-black tracking-widest px-2">
                       Multi-Vendor
                    </Badge>
                  )}
                </h3>
                <div className="space-y-6">
                  {(selectedOrder.vendorOrders || []).map((vo: any, idx: number) => (
                    <div key={idx} className="border border-slate-800 rounded-xl overflow-hidden bg-black/40 shadow-2xl">
                      <div className="bg-slate-900/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-amber-500" />
                          <span className="font-black text-white uppercase tracking-tight text-xs">
                            {vo.vendorId?.businessName || 'Unknown Vendor'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {vo.deliveryOtp && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/30">
                               <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">OTP:</span>
                               <span className="text-xs font-mono font-black text-amber-400 tracking-widest">{vo.deliveryOtp}</span>
                            </div>
                          )}
                          <Badge className={`${getStatusColor(vo.status)} text-[10px] font-black uppercase px-3 rounded-full border-none shadow-lg shadow-black/50`}>
                            {vo.status || 'PENDING'}
                          </Badge>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-800/50">
                        {vo.items.map((item: any, i: number) => (
                          <div key={i} className="flex gap-4 p-5 hover:bg-slate-900/50 transition-colors">
                            <img src={getImageUrl(item.image)} alt={item.title} className="w-16 h-16 object-cover rounded-xl border border-slate-800 bg-white" />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-white text-sm truncate">{item.title}</p>
                                <p className="font-black text-amber-500 text-sm shrink-0">{formatPrice((item.price + (item.lens?.price || 0)) * item.quantity)}</p>
                              </div>
                              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-400">
                                <span>Qty: <span className="text-white font-bold">{item.quantity}</span></span>
                                <span>Price: <span className="text-white font-bold">{formatPrice(item.price)}</span></span>
                                {item.productId?.sku && (
                                  <span>SKU: <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{item.productId.sku}</span></span>
                                )}
                              </div>
                                {item.lens && (
                                  <div className="mt-3 space-y-3">
                                     <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-black px-2 h-6 text-[9px] uppercase tracking-wider">
                                        LENS: {item.lens.packageName || item.lens.typeName}
                                     </Badge>
                                     {item.lens.prescription && (
                                       <div className="bg-black/60 p-3 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
                                          <table className="w-full text-[10px] border-collapse">
                                            <thead>
                                              <tr className="border-b border-slate-800 text-slate-500 uppercase font-black tracking-widest">
                                                <th className="text-left py-2 px-1">Eye</th>
                                                <th className="text-center py-2 px-1">SPH</th>
                                                <th className="text-center py-2 px-1">CYL</th>
                                                <th className="text-center py-2 px-1">AXIS</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/10">
                                              <tr className="text-slate-200">
                                                <td className="font-black py-2 px-1 text-slate-400">OD (R)</td>
                                                <td className="text-center py-2 px-1">{item.lens.prescription.od?.sph || '0.00'}</td>
                                                <td className="text-center py-2 px-1">{item.lens.prescription.od?.cyl || '0.00'}</td>
                                                <td className="text-center py-2 px-1">{item.lens.prescription.od?.axis || '0'}</td>
                                              </tr>
                                              <tr className="text-slate-200">
                                                <td className="font-black py-2 px-1 text-slate-400">OS (L)</td>
                                                <td className="text-center py-2 px-1">{item.lens.prescription.os?.sph || '0.00'}</td>
                                                <td className="text-center py-2 px-1">{item.lens.prescription.os?.cyl || '0.00'}</td>
                                                <td className="text-center py-2 px-1">{item.lens.prescription.os?.axis || '0'}</td>
                                              </tr>
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
                      <div className="bg-amber-500/5 px-5 py-3 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Vendor Order Sub-total</span>
                        <span className="text-lg font-black text-amber-500">{formatPrice(vo.subtotal || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-primary">Status History</h3>
                  <div className="space-y-3">
                    {selectedOrder.statusHistory.map((history: any, i: number) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="min-w-[140px] text-muted-foreground font-mono text-xs pt-1">
                          {formatDate(history.timestamp)}
                        </div>
                        <div>
                          <Badge variant="outline" className="mr-2 border-border text-foreground">{history.status}</Badge>
                          <span className="text-muted-foreground">{history.note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Payment Verification Section */}
              {selectedOrder.manualPaymentDetails && (
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <h3 className="font-semibold mb-4 text-primary flex items-center gap-2">
                    Manual Payment Details
                    {selectedOrder.verificationStatus === 'pending' && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Verification Pending</Badge>
                    )}
                    {selectedOrder.verificationStatus === 'approved' && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/50">Approved</Badge>
                    )}
                    {selectedOrder.verificationStatus === 'rejected' && (
                      <Badge variant="secondary" className="bg-red-500/20 text-red-500 border-red-500/50">Rejected</Badge>
                    )}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold">UTR / Transaction ID</label>
                        <p className="font-mono text-foreground font-medium select-all bg-background p-2 rounded border border-border mt-1">
                          {selectedOrder.utrNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold">Payment Proof</label>
                        {selectedOrder.paymentProof ? (
                          <div className="mt-1 border border-border rounded overflow-hidden bg-background">
                            <a href={getImageUrl(selectedOrder.paymentProof)} target="_blank" rel="noreferrer">
                              <img
                                src={getImageUrl(selectedOrder.paymentProof)}
                                alt="Payment Proof"
                                className="w-full h-48 object-contain hover:scale-105 transition-transform cursor-zoom-in"
                              />
                            </a>
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic mt-1">No proof uploaded</p>
                        )}
                      </div>
                    </div>

                    {selectedOrder.verificationStatus === 'pending' && (
                      <div className="flex flex-col justify-center gap-4 border-l border-border pl-6">
                        <p className="text-sm text-foreground">
                          Please verify the UTR number and payment proof with your bank statement before approving.
                        </p>
                        <div className="space-y-3">
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={async () => {
                              console.log('[DEBUG] Approve button clicked!')
                              console.log('[DEBUG] Selected Order:', selectedOrder)
                              console.log('[DEBUG] Token:', token ? 'Present' : 'Missing')

                              try {
                                console.log('[DEBUG] Starting approval process (Direct)')

                                const result = await orders.verifyManualPayment(selectedOrder._id, 'approve', 'Payment verified by admin', token)

                                toast.success('Payment Approved Successfully!')

                                // Manually update local state to reflect change immediately
                                const updatedOrder = {
                                  ...selectedOrder,
                                  paymentStatus: 'completed',
                                  orderStatus: 'confirmed',
                                  verificationStatus: 'approved'
                                }
                                setSelectedOrder(updatedOrder)

                                // Update the order in the list as well
                                setOrderList(prevList => prevList.map(o =>
                                  o._id === selectedOrder._id ? updatedOrder : o
                                ))

                                setIsDetailsOpen(false)

                                // Small delay to allow DB propagation then fetch fresh
                                setTimeout(async () => {
                                  await fetchOrders()
                                }, 500)

                              } catch (e: any) {
                                console.error('Approval failed:', e)
                                toast.error(e.message || 'Failed to approve payment')
                              }
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve Payment
                          </Button>

                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={async () => {
                              console.log('[DEBUG] Reject button clicked!')
                              if (confirm('Are you sure you want to REJECT this payment?')) {
                                try {
                                  console.log('[DEBUG] Rejecting payment for order:', selectedOrder._id)
                                  const result = await orders.verifyManualPayment(selectedOrder._id, 'reject', 'Payment rejected by admin', token)
                                  console.log('[DEBUG] Rejection result:', result)
                                  toast.success('Payment Rejected')
                                  setIsDetailsOpen(false)
                                  await fetchOrders()
                                } catch (e: any) {
                                  console.error('[DEBUG] Rejection failed:', e)
                                  toast.error(e.message || 'Failed to reject payment')
                                }
                              }
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Reject Payment
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-playfair text-foreground">Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select
                value={statusUpdate.status}
                onValueChange={(val) => setStatusUpdate(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="bg-secondary border-border/50 text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="pending" disabled={selectedOrder?.orderStatus === 'confirmed'}>
                    Pending {selectedOrder?.orderStatus === 'confirmed' ? '✓' : ''}
                  </SelectItem>
                  <SelectItem value="confirmed">
                    Confirmed {selectedOrder?.orderStatus === 'confirmed' ? '✓' : ''}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 text-white">
              <label className="text-sm font-medium">Note (Optional)</label>
              <Input
                placeholder="Add a note (e.g. Tracking ID)"
                value={statusUpdate.note}
                onChange={(e) => setStatusUpdate(prev => ({ ...prev, note: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
                variant="outline" 
                onClick={() => setIsStatusOpen(false)} 
                className="bg-transparent border-slate-700 text-white hover:bg-slate-800"
            >
                Cancel
            </Button>
            <Button 
                onClick={handleStatusUpdate} 
                className="bg-amber-500 hover:bg-amber-600 text-black font-black"
            >
                Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getImageUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path

  // Remove leading slash from path if it exists to prevent double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  return `${API_URL}/${cleanPath}`
}

export default OrdersPage
