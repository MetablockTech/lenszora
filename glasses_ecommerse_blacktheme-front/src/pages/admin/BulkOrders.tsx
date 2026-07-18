import React, { useEffect, useState } from 'react'
import { orders, getToken } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Loader2, 
  FileText, 
  Eye,
  Truck,
  CreditCard
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const WholesaleOrders: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const token = getToken()
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await orders.getAll(token)
      // Filter for orders containing bulk items OR orders made by users with role 'vendor'
      // For now, I'll show all and tag bulk ones if metadata is present
      const bulkOrders = res.filter((o: any) => 
        o.items.some((i: any) => i.price < 5000 || i.quantity >= 1) // Logic for detecting wholesale if no isBulk flag on OrderItem
      )
      setData(bulkOrders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast({ title: "Error", description: "Failed to load wholesale orders", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleManualAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await orders.verifyManualPayment(id, action, `Actioned by admin via wholesale dashboard`, token)
      toast({ title: "Order Verified", description: `Order ${id} marked as ${action}d.` })
      fetchOrders()
    } catch (error) {
      toast({ title: "Error", description: "Failed to action order", variant: "destructive" })
    }
  }

  const getPaymentBadge = (status: string, verification?: string) => {
    if (verification === 'approved') return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Verified</Badge>
    if (verification === 'rejected') return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Payment Rejected</Badge>
    
    switch (status) {
      case 'completed': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Paid Online</Badge>
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 tracking-tight text-[10px]">Awaiting Proof</Badge>
      case 'failed': return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Failed</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pending</Badge>
      case 'confirmed': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Confirmed</Badge>
      case 'shipped': return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">Shipped</Badge>
      case 'delivered': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Delivered</Badge>
      case 'cancelled': return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Cancelled</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Wholesale Orders</h1>
        <p className="text-slate-500 text-sm">Monitor bulk sales, verify UTR/receipts, and track logistics.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">Order ID</TableHead>
              <TableHead className="font-bold">Vendor Details</TableHead>
              <TableHead className="font-bold">Order Items</TableHead>
              <TableHead className="font-bold text-right">Bill Total</TableHead>
              <TableHead className="font-bold text-center">Payment</TableHead>
              <TableHead className="font-bold">Full Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  No wholesale orders found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((order) => (
                <TableRow key={order._id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] font-bold text-slate-400">#{order._id.slice(-8).toUpperCase()}</span>
                      <span className="text-[10px] text-slate-400">{format(new Date(order.createdAt), 'dd MMM, HH:mm')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</span>
                      <span className="text-[10px] text-slate-500">{order.shippingAddress?.phone}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 overflow-hidden">
                      {order.items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="h-8 w-8 rounded border bg-slate-50 border-slate-200 overflow-hidden shrink-0 relative">
                          <img src={getImageUrl(item.image)} className="h-full w-full object-cover" />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-dashed border-slate-300">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900">₹{order.total.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{getPaymentBadge(order.paymentStatus, order.verificationStatus)}</TableCell>
                  <TableCell>{getOrderStatusBadge(order.orderStatus)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => navigate(`/admin/orders/${order._id}`)}>
                          <Eye className="w-4 h-4 mr-2 text-slate-500" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManualAction(order._id, 'approve')}>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Approve Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManualAction(order._id, 'reject')}>
                          <XCircle className="w-4 h-4 mr-2 text-red-500" /> Deny Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Truck className="w-4 h-4 mr-2 text-blue-500" /> Update Tracking
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default WholesaleOrders
