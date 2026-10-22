import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ScanLine, Search, CheckCircle2, XCircle, Loader2, User, Phone, MapPin, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  color?: string
  visitDate: string
  priceAtBooking: number
  commissionRate: number
  saleAmount?: number
  commissionAmount?: number
  notPurchasedReason?: string
  storeId?: { name?: string; city?: string } | null
}

const STATUS: Record<string, { label: string; className: string }> = {
  booked: { label: 'Upcoming', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  verified: { label: 'At store', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  sold: { label: 'Sold', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  not_purchased: { label: 'Not purchased', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  expired: { label: 'Expired', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600 border-red-200' },
}

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS[status] || STATUS.booked
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.className}`}>{s.label}</span>
}

export default function VendorStoreVisits() {
  const [searchParams, setSearchParams] = useSearchParams()
  const token = getToken()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [current, setCurrent] = useState<Visit | null>(null)
  const [looking, setLooking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saleAmount, setSaleAmount] = useState('')
  const [billNumber, setBillNumber] = useState('')
  const [reason, setReason] = useState('')
  const [list, setList] = useState<Visit[]>([])
  const [tab, setTab] = useState<'upcoming' | 'all'>('upcoming')

  const loadList = useCallback(async () => {
    try {
      setList(await storeVisits.vendorList(token))
    } catch {
      toast.error('Failed to load store visits')
    }
  }, [token])

  const lookup = useCallback(async (value: string) => {
    if (!value.trim()) return
    setLooking(true)
    try {
      const visit: Visit = await storeVisits.vendorLookup(value, token)
      setCurrent(visit)
      setSaleAmount(String(visit.priceAtBooking))
      setBillNumber('')
      setReason('')
      loadList()
    } catch (error) {
      setCurrent(null)
      toast.error(error instanceof Error ? error.message : 'Pass not found')
    } finally {
      setLooking(false)
    }
  }, [token, loadList])

  useEffect(() => {
    loadList()
    const fromQr = searchParams.get('code')
    if (fromQr) lookup(fromQr)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const recordOutcome = async (outcome: 'sold' | 'not_purchased') => {
    if (!current) return
    if (outcome === 'sold' && !(Number(saleAmount) > 0)) {
      toast.error('Enter the sale amount')
      return
    }
    setSaving(true)
    try {
      const updated: Visit = await storeVisits.vendorOutcome(current.code, outcome === 'sold'
        ? { outcome, saleAmount: Number(saleAmount), billNumber }
        : { outcome, reason }, token)
      setCurrent(updated)
      toast.success(outcome === 'sold' ? 'Sale recorded' : 'Marked as not purchased')
      loadList()
      if (searchParams.get('code')) setSearchParams({}, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const shown = tab === 'upcoming' ? list.filter((v) => v.status === 'booked' || v.status === 'verified') : list
  const open = current && (current.status === 'booked' || current.status === 'verified')

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Store Visits</h1>
        <p className="text-slate-500 text-sm mt-1">Customers who reserved a product online to buy at your store. Scan their pass when they arrive.</p>
      </div>

      {/* Verify a pass */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ScanLine className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900">Verify Visit Pass</h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">Scan the customer's QR with your phone camera, or type the code from their pass.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); lookup(code) }}
          className="flex gap-2"
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="LZV-XXXXXXXX"
            className="h-11 bg-white border-slate-200 font-mono tracking-widest text-slate-900 uppercase"
          />
          <Button type="submit" disabled={looking || !code.trim()} className="h-11 bg-blue-600 hover:bg-blue-500 text-white">
            {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-1.5" /> Verify</>}
          </Button>
        </form>

        {current && (
          <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-200">
              <img src={getImageUrl(current.productImage)} alt="" className="w-14 h-14 rounded-lg object-cover bg-white border border-slate-200 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 line-clamp-2">{current.productTitle}</p>
                <p className="text-xs text-slate-500">{current.color ? `${current.color} · ` : ''}Locked price <b className="text-slate-900">₹{current.priceAtBooking.toLocaleString()}</b></p>
              </div>
              <StatusBadge status={current.status} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 text-sm">
              <p className="flex items-center gap-2 text-slate-700"><User className="w-4 h-4 text-slate-400" /> {current.customerName || 'Customer'}</p>
              <p className="flex items-center gap-2 text-slate-700"><Phone className="w-4 h-4 text-slate-400" /> {current.customerPhone}</p>
              <p className="flex items-center gap-2 text-slate-700"><MapPin className="w-4 h-4 text-slate-400" /> {current.storeId?.name}</p>
              <p className="flex items-center gap-2 text-slate-700"><Calendar className="w-4 h-4 text-slate-400" /> {format(new Date(`${current.visitDate}T00:00:00`), 'd MMM yyyy')}</p>
            </div>

            {open ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-t border-slate-200">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Customer bought it</p>
                  <Input type="number" min={1} value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} placeholder="Sale amount (₹)" className="h-10 bg-white border-slate-200 text-slate-900" />
                  <Input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="Bill / invoice no. (optional)" className="h-10 bg-white border-slate-200 text-slate-900" />
                  <p className="text-[11px] text-slate-500">Platform commission: {current.commissionRate}% of the sale amount.</p>
                  <Button onClick={() => recordOutcome('sold')} disabled={saving} className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Record Sale
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Didn't buy</p>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (e.g. didn't like the fit)" className="h-10 bg-white border-slate-200 text-slate-900" />
                  <Button onClick={() => recordOutcome('not_purchased')} disabled={saving} variant="outline" className="w-full h-10 bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                    <XCircle className="w-4 h-4 mr-1.5" /> Mark Not Purchased
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-200 text-sm text-slate-600">
                {current.status === 'sold' && <>Sale of <b>₹{current.saleAmount?.toLocaleString()}</b> recorded. Commission: <b>₹{current.commissionAmount?.toLocaleString()}</b>.</>}
                {current.status === 'not_purchased' && <>Marked as not purchased{current.notPurchasedReason ? `: ${current.notPurchasedReason}` : ''}.</>}
                {(current.status === 'expired' || current.status === 'cancelled') && <>This pass is {current.status} and can't be used.</>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visits list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-slate-200">
          {(['upcoming', 'all'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${tab === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {t === 'upcoming' ? 'Upcoming' : 'All'}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400">{shown.length} visit(s)</span>
        </div>
        {shown.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No store visits here yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {shown.map((v) => (
              <button
                key={v._id}
                type="button"
                onClick={() => { setCode(v.code); lookup(v.code) }}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50"
              >
                <img src={getImageUrl(v.productImage)} alt="" className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{v.productTitle}</p>
                  <p className="text-xs text-slate-500 truncate">{v.customerName || 'Customer'} · {v.customerPhone} · {v.storeId?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-slate-700">{format(new Date(`${v.visitDate}T00:00:00`), 'd MMM')}</p>
                  <StatusBadge status={v.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
