import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, RefreshCw, Store as StoreIcon, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { storeVisits, getToken } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'

interface Visit {
  _id: string
  code: string
  status: string
  customerName?: string
  customerPhone: string
  productTitle: string
  productImage?: string
  visitDate: string
  priceAtBooking: number
  saleAmount?: number
  billNumber?: string
  notPurchasedReason?: string
  commissionAmount?: number
  commissionStatus: 'none' | 'due' | 'collected'
  customerSaysPurchased?: boolean
  flagged: boolean
  createdAt: string
  storeId?: { name?: string; city?: string } | null
  vendorId?: { _id: string; businessName?: string } | null
}

interface VendorRow {
  _id: string
  vendorName: string
  total: number
  upcoming: number
  verified: number
  sold: number
  notPurchased: number
  expired: number
  flagged: number
  salesAmount: number
  commissionDue: number
  commissionCollected: number
}

const STATUS: Record<string, { label: string; className: string }> = {
  booked: { label: 'Upcoming', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  verified: { label: 'At store', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  sold: { label: 'Sold', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  not_purchased: { label: 'Not purchased', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  expired: { label: 'Expired (not scanned)', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600 border-red-200' },
}

const inr = (n?: number) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export default function AdminStoreVisits() {
  const token = getToken()
  const [visits, setVisits] = useState<Visit[]>([])
  const [summary, setSummary] = useState<VendorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [flaggedOnly, setFlaggedOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, sum] = await Promise.all([
        storeVisits.adminList({ status, vendorId, flagged: flaggedOnly }, token),
        storeVisits.adminSummary(token),
      ])
      setVisits(list)
      setSummary(sum)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load store visits')
    } finally {
      setLoading(false)
    }
  }, [status, vendorId, flaggedOnly, token])

  useEffect(() => { load() }, [load])

  const markCollected = async (id: string) => {
    try {
      await storeVisits.markCommissionCollected(id, token)
      toast.success('Commission marked as collected')
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update')
    }
  }

  const totals = summary.reduce((t, r) => ({
    total: t.total + r.total,
    sold: t.sold + r.sold,
    flagged: t.flagged + r.flagged,
    expired: t.expired + r.expired,
    due: t.due + r.commissionDue,
    collected: t.collected + r.commissionCollected,
  }), { total: 0, sold: 0, flagged: 0, expired: 0, due: 0, collected: 0 })

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-playfair">Store Visits</h1>
          <p className="text-slate-500 text-sm mt-1">Customers who reserved a product online to buy at a vendor's store, and the commission on those sales.</p>
        </div>
        <Button variant="outline" onClick={load} className="h-10 bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Visits booked', value: totals.total },
          { label: 'Sold at store', value: totals.sold },
          { label: 'Expired, never scanned', value: totals.expired, warn: totals.expired > 0 },
          { label: 'Flagged (customer says bought)', value: totals.flagged, warn: totals.flagged > 0 },
          { label: 'Commission due', value: inr(totals.due), sub: `${inr(totals.collected)} collected` },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 bg-white ${c.warn ? 'border-red-200' : 'border-slate-200'}`}>
            <p className={`text-2xl font-black ${c.warn ? 'text-red-600' : 'text-slate-900'}`}>{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
            {c.sub && <p className="text-[11px] text-emerald-600 mt-0.5">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Per-vendor funnel */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
          <StoreIcon className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900 text-sm">By vendor</h2>
          <span className="text-xs text-slate-400">Low "sold" with many "expired" or "flagged" visits needs a closer look.</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              {['Vendor', 'Booked', 'Upcoming', 'Scanned', 'Sold', 'Not bought', 'Expired', 'Flagged', 'Sales', 'Commission due'].map((h) => (
                <th key={h} className="text-left font-bold px-4 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.length === 0 ? (
              <tr><td colSpan={10} className="text-center text-slate-400 py-8">No store visits yet.</td></tr>
            ) : summary.map((r) => (
              <tr key={r._id} className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${vendorId === r._id ? 'bg-blue-50/50' : ''}`} onClick={() => setVendorId(vendorId === r._id ? '' : r._id)}>
                <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{r.vendorName}</td>
                <td className="px-4 py-2.5 text-slate-700">{r.total}</td>
                <td className="px-4 py-2.5 text-slate-700">{r.upcoming}</td>
                <td className="px-4 py-2.5 text-slate-700">{r.verified}</td>
                <td className="px-4 py-2.5 font-bold text-emerald-700">{r.sold}</td>
                <td className="px-4 py-2.5 text-slate-700">{r.notPurchased}</td>
                <td className={`px-4 py-2.5 ${r.expired ? 'text-orange-600 font-bold' : 'text-slate-700'}`}>{r.expired}</td>
                <td className={`px-4 py-2.5 ${r.flagged ? 'text-red-600 font-bold' : 'text-slate-700'}`}>{r.flagged}</td>
                <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{inr(r.salesAmount)}</td>
                <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap">{inr(r.commissionDue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
          Flagged only
        </label>
        {vendorId && (
          <button type="button" onClick={() => setVendorId('')} className="h-10 px-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
            Vendor: {summary.find((r) => r._id === vendorId)?.vendorName} ✕
          </button>
        )}
      </div>

      {/* Visits */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              {['Customer', 'Product', 'Vendor / Store', 'Visit date', 'Status', 'Sale', 'Commission'].map((h) => (
                <th key={h} className="text-left font-bold px-4 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center text-slate-400 py-12">Loading…</td></tr>
            ) : visits.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-slate-400 py-12">No visits match these filters.</td></tr>
            ) : visits.map((v) => {
              const s = STATUS[v.status] || STATUS.booked
              return (
                <tr key={v._id} className={`border-t border-slate-100 align-top ${v.flagged ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{v.customerName || 'Customer'}</p>
                    <p className="text-xs text-slate-500">{v.customerPhone}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{v.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <img src={getImageUrl(v.productImage)} alt="" className="w-9 h-9 rounded object-cover bg-slate-100 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-slate-900 font-medium line-clamp-1">{v.productTitle}</p>
                        <p className="text-xs text-slate-500">Locked {inr(v.priceAtBooking)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-slate-900 font-medium">{v.vendorId?.businessName || '—'}</p>
                    <p className="text-xs text-slate-500">{v.storeId?.name}{v.storeId?.city ? `, ${v.storeId.city}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {format(new Date(`${v.visitDate}T00:00:00`), 'd MMM yyyy')}
                    <p className="text-[11px] text-slate-400">booked {format(new Date(v.createdAt), 'd MMM')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${s.className}`}>{s.label}</span>
                    {v.flagged && (
                      <p className="flex items-center gap-1 text-[11px] font-bold text-red-600 mt-1 whitespace-nowrap">
                        <AlertTriangle className="w-3 h-3" /> Customer says bought
                      </p>
                    )}
                    {v.customerSaysPurchased === false && <p className="text-[11px] text-slate-400 mt-1">Customer: didn't buy</p>}
                    {v.notPurchasedReason && <p className="text-[11px] text-slate-500 mt-1 max-w-[180px]">{v.notPurchasedReason}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.saleAmount ? (
                      <>
                        <p className="font-semibold text-slate-900">{inr(v.saleAmount)}</p>
                        {v.billNumber && <p className="text-[11px] text-slate-400">Bill {v.billNumber}</p>}
                      </>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.commissionStatus === 'due' && (
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">{inr(v.commissionAmount)} <span className="text-[10px] font-bold uppercase text-amber-600">due</span></p>
                        <button type="button" onClick={() => markCollected(v._id)} className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline">
                          <IndianRupee className="w-3 h-3" /> Mark collected
                        </button>
                      </div>
                    )}
                    {v.commissionStatus === 'collected' && <p className="font-semibold text-emerald-700">{inr(v.commissionAmount)} collected</p>}
                    {v.commissionStatus === 'none' && <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
