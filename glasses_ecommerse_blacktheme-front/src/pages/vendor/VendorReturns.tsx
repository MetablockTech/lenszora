import { useEffect, useState } from 'react'
import { returnRequests, getToken } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, RotateCcw } from 'lucide-react'

type ReturnRequest = {
  _id: string
  requestType: 'return' | 'refund' | 'exchange'
  reason: string
  description?: string
  images?: string[]
  status: string
  adminNotes?: string
  refundAmount?: number
  variantSku?: string
  createdAt: string
  orderId?: { _id: string; createdAt?: string; orderStatus?: string; shippingAddress?: { city?: string; state?: string } } | string
  productId?: { _id: string; title?: string; thumbnail?: string; price?: number; sku?: string }
  userId?: { name?: string }
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  cancelled: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const orderNo = (r: ReturnRequest) => {
  const id = typeof r.orderId === 'string' ? r.orderId : r.orderId?._id
  return id ? `#${id.slice(-8).toUpperCase()}` : '—'
}

// Vendors see the return / refund / exchange requests raised on their products. The admin decides them.
export default function VendorReturns() {
  const [list, setList] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<ReturnRequest | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    returnRequests.getVendorRequests(getToken() || undefined, { status })
      .then((data) => { if (!cancelled) { setList(data); setError('') } })
      .catch((e) => { if (!cancelled) setError(e.message || 'Could not load requests') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [status])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><RotateCcw className="h-6 w-6 text-amber-500" /> Returns &amp; Exchanges</h1>
          <p className="text-sm text-slate-400">Requests customers raised on your products. The LensZora team reviews and decides each one.</p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white"
        >
          {['all', 'pending', 'approved', 'completed', 'rejected', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
      ) : error ? (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">{error}</p>
      ) : list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">No return or exchange requests yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full min-w-[760px] text-sm text-left">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {list.map((r) => (
                <tr key={r._id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 font-mono font-bold text-white">{orderNo(r)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.productId?.thumbnail && <img src={getImageUrl(r.productId.thumbnail)} alt="" className="h-10 w-10 rounded object-cover border border-slate-700" />}
                      <span className="max-w-[200px] truncate text-white">{r.productId?.title || 'Product'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-200">{r.requestType}</td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-slate-300">{r.reason}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={`capitalize ${STATUS_STYLE[r.status] || ''}`}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(r)} className="font-medium text-amber-400 hover:text-amber-300">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle className="capitalize">{selected?.requestType} request</DialogTitle>
            <DialogDescription className="text-slate-400">Order {selected ? orderNo(selected) : ''}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-3 rounded-lg bg-slate-900 p-3">
                {selected.productId?.thumbnail && <img src={getImageUrl(selected.productId.thumbnail)} alt="" className="h-16 w-16 rounded object-cover" />}
                <div>
                  <p className="font-semibold">{selected.productId?.title}</p>
                  {selected.productId?.sku && <p className="text-xs text-slate-400">SKU: {selected.variantSku || selected.productId.sku}</p>}
                  {selected.productId?.price !== undefined && <p className="text-xs text-slate-400">Price: ₹{selected.productId.price}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-500">Status</p><p className="capitalize font-semibold">{selected.status}</p></div>
                <div><p className="text-xs text-slate-500">Requested on</p><p className="font-semibold">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-slate-500">Customer</p><p className="font-semibold">{selected.userId?.name || 'Customer'}</p></div>
                {selected.refundAmount ? <div><p className="text-xs text-slate-500">Refund amount</p><p className="font-semibold">₹{selected.refundAmount}</p></div> : null}
              </div>
              <div>
                <p className="text-xs text-slate-500">Reason</p>
                <p className="font-semibold">{selected.reason}</p>
                {selected.description && <p className="mt-1 text-slate-300">{selected.description}</p>}
              </div>
              {selected.images && selected.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selected.images.map((img, i) => (
                    <a key={i} href={getImageUrl(img)} target="_blank" rel="noreferrer">
                      <img src={getImageUrl(img)} alt="" className="h-20 w-20 rounded object-cover border border-slate-700" />
                    </a>
                  ))}
                </div>
              )}
              {selected.adminNotes && (
                <div className="rounded-lg border border-slate-800 p-3">
                  <p className="text-xs text-slate-500">Note from LensZora</p>
                  <p>{selected.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
