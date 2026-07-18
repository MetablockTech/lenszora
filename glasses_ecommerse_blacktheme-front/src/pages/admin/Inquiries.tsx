import React, { useEffect, useState } from 'react'
import { inquiries, getToken } from '@/lib/api'
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
import { MoreHorizontal, MessageSquare, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

const ProductInquiries: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const token = getToken()

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const res = await inquiries.listAdmin(token)
      setData(res)
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
      toast({ title: "Error", description: "Failed to load inquiries", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await inquiries.updateStatus(id, status, token)
      toast({ title: "Status Updated", description: `Inquiry marked as ${status}` })
      fetchInquiries()
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pending</Badge>
      case 'reviewed': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Reviewed</Badge>
      case 'responded': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Responded</Badge>
      case 'closed': return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Closed</Badge>
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Wholesale Inquiries</h1>
        <p className="text-slate-500 text-sm">Review and respond to vendor requests for bulk pricing and quantities.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Vendor</TableHead>
              <TableHead className="font-bold">Product</TableHead>
              <TableHead className="font-bold text-center">Qty</TableHead>
              <TableHead className="font-bold">Message</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  No inquiries found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item._id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {format(new Date(item.createdAt), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{item.userId?.firstName} {item.userId?.lastName}</span>
                      <span className="text-[10px] text-slate-500 leading-none">{item.userId?.email}</span>
                      <span className="text-[10px] text-slate-400">{item.userId?.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded border bg-slate-100 overflow-hidden shrink-0">
                        {item.productId?.thumbnail && <img src={getImageUrl(item.productId.thumbnail)} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold line-clamp-1">{item.productId?.title}</span>
                        <span className="text-[10px] text-slate-400">SKU: {item.productId?.sku}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-700">{item.quantity}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-xs text-slate-600 line-clamp-2 italic italic">"{item.message}"</p>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleStatusUpdate(item._id, 'reviewed')}>
                          <Clock className="w-4 h-4 mr-2 text-blue-500" /> Mark Reviewed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(item._id, 'responded')}>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Mark Responded
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(item._id, 'closed')}>
                          <XCircle className="w-4 h-4 mr-2 text-slate-500" /> Close Inquiry
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

export default ProductInquiries
