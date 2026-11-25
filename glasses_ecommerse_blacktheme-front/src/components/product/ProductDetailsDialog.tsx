import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { getImageUrl } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

type Props = { product: any | null; onClose: () => void }

const LABELS: Record<string, string> = {
  frameType: 'Frame type', frameShape: 'Frame shape', frameMaterial: 'Frame material', frameSize: 'Frame size',
  frameWidth: 'Frame width', frameDimensions: 'Dimensions', frameColor: 'Frame colour', glassColor: 'Lens colour',
  weight: 'Weight', weightGroup: 'Weight group', countryOfOrigin: 'Country of origin', modelNo: 'Model no.',
  gender: 'Gender', uvProtection: 'UV protection', wearDuration: 'Wear duration',
}

const Row = ({ label, value }: { label: string; value: any }) =>
  value === undefined || value === null || value === '' ? null : (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{String(value)}</span>
    </div>
  )

// Everything saved on a product, read-only (vendor panel "View")
export default function ProductDetailsDialog({ product: p, onClose }: Props) {
  const images: string[] = p ? Array.from(new Set([p.thumbnail, ...(p.images || [])].filter(Boolean))) : []
  const eyewear = p?.eyewearDetails || {}
  const lensTypes = (p?.lensSettings?.lensTypes || []).filter((t: any) => t.active !== false)

  return (
    <Dialog open={!!p} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-slate-200">
        {p && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8 text-xl">{p.title}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-slate-500">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.status === 'active' ? 'Approved · live' : p.status === 'pending' ? 'Waiting for approval' : p.status}
                </span>
                <span>SKU {p.sku}</span>
                {p.createdAt && <span>· Added {new Date(p.createdAt).toLocaleDateString()}</span>}
              </DialogDescription>
            </DialogHeader>

            {p.status === 'rejected' && p.rejectionReason && (
              <p className="rounded-md border border-red-100 bg-red-50 p-2 text-sm text-red-700"><b>Rejected:</b> {p.rejectionReason}</p>
            )}

            {images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src) => (
                  <img key={src} src={getImageUrl(src)} alt="" className="h-28 w-28 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-contain" />
                ))}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Pricing &amp; stock</h4>
                <Row label="Price" value={`₹${p.price}`} />
                {Number(p.discountAmount) > 0 && <Row label="Discount" value={p.discountType === 'percent' ? `${p.discountAmount}%` : `₹${p.discountAmount}`} />}
                <Row label="Stock" value={p.stock ?? 0} />
                <Row label="Unit" value={p.unit} />
                <Row label="Min. order qty" value={p.minOrderQuantity} />
                <Row label="Shipping cost" value={Number(p.shippingCost) > 0 ? `₹${p.shippingCost}` : 'Free'} />
                <Row label="Category" value={p.category?.name} />
                <Row label="Brand" value={p.brand?.name} />
                {p.isBulk && <Row label="Wholesale (bulk)" value="Yes" />}
              </div>
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Eyewear details</h4>
                {Object.keys(LABELS).map((k) => <Row key={k} label={LABELS[k]} value={eyewear[k]} />)}
                {Array.isArray(eyewear.faceShape) && eyewear.faceShape.length > 0 && <Row label="Face shapes" value={eyewear.faceShape.join(', ')} />}
                {eyewear.polarized && <Row label="Polarized" value="Yes" />}
                {eyewear.prescriptionAvailable && <Row label="Prescription available" value="Yes" />}
              </div>
            </div>

            {p.description && (
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                <p className="whitespace-pre-line text-sm text-slate-700">{p.description}</p>
              </div>
            )}

            {(p.colors?.length > 0 || p.searchTags?.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {(p.colors || []).map((c: string) => <span key={`c-${c}`} className="rounded bg-slate-100 px-2 py-0.5 text-xs">{c}</span>)}
                {(p.searchTags || []).map((t: string) => <span key={`t-${t}`} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">#{t}</span>)}
              </div>
            )}

            {p.hasVariants && p.variants?.length > 0 && (
              <div className="overflow-x-auto">
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Variants</h4>
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="text-left text-slate-500"><tr><th className="py-1">Options</th><th>SKU</th><th className="text-right">Price</th><th className="text-right">Stock</th></tr></thead>
                  <tbody>
                    {p.variants.map((v: any, i: number) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-1">{Object.values(v.variantValues || {}).join(' / ') || '—'}</td>
                        <td>{v.sku}</td>
                        <td className="text-right">₹{v.price}</td>
                        <td className="text-right">{v.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {p.lensSettings?.allowLensSelection && lensTypes.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Lens options</h4>
                {lensTypes.map((t: any, i: number) => (
                  <p key={i} className="text-sm text-slate-700">
                    <b>{t.lensTypeId?.name || 'Lens type'}</b>: {(t.packages || []).map((pkg: any) => `${pkg.name} (₹${pkg.price})`).join(', ') || 'no packages'}
                  </p>
                ))}
              </div>
            )}

            {p.returnPolicy && (
              <p className="text-sm text-slate-600">
                Returns: {p.returnPolicy.allowReturns ? `allowed within ${p.returnPolicy.returnPeriodDays ?? 14} days` : 'not allowed'}
                {p.returnPolicy.policyText ? ` — ${p.returnPolicy.policyText}` : ''}
              </p>
            )}

            <a href={`/product/${p._id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
              <ExternalLink className="h-4 w-4" /> Open product page{p.status !== 'active' ? ' (only you and the admin can see it until approved)' : ''}
            </a>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
