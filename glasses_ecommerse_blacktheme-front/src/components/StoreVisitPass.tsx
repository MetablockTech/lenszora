import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { MapPin, Calendar, Tag } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

const VISIT_STATUS: Record<string, { label: string; className: string }> = {
  booked: { label: "Upcoming", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  verified: { label: "Checked in at store", className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  sold: { label: "Purchased", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  not_purchased: { label: "Not purchased", className: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  expired: { label: "Expired", className: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  cancelled: { label: "Cancelled", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

// The QR opens the vendor panel with the code pre-filled, so any phone camera can scan it
const visitPassUrl = (code: string) => `${window.location.origin}/vendor/store-visits?code=${encodeURIComponent(code)}`;

interface StoreVisitPassProps {
  visit: {
    code: string;
    status: string;
    productTitle: string;
    productImage?: string;
    color?: string;
    visitDate: string;
    priceAtBooking: number;
    storeId?: { name?: string; addressLine?: string; city?: string } | null;
  };
  showQr?: boolean;
}

const StoreVisitPass = ({ visit, showQr = true }: StoreVisitPassProps) => {
  const status = VISIT_STATUS[visit.status] || VISIT_STATUS.booked;
  const usable = visit.status === "booked" || visit.status === "verified";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <img src={getImageUrl(visit.productImage)} alt={visit.productTitle} className="w-14 h-14 rounded-lg object-cover bg-black shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white line-clamp-2">{visit.productTitle}</p>
          <p className="text-xs text-white/50 mt-0.5">
            {visit.color ? `${visit.color} · ` : ""}Locked price <span className="text-[#DAAB34] font-bold">₹{visit.priceAtBooking.toLocaleString()}</span>
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${status.className}`}>{status.label}</span>
      </div>

      {showQr && usable && (
        <div className="flex flex-col items-center gap-2 p-5 bg-white/[0.02]">
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG value={visitPassUrl(visit.code)} size={168} level="M" />
          </div>
          <p className="font-mono text-xl font-black tracking-[0.2em] text-white">{visit.code}</p>
          <p className="text-[11px] text-white/50 text-center max-w-[260px]">
            Show this pass at the store. The store scans it to give you this price.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 text-xs">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-[#DAAB34] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-white font-semibold">{visit.storeId?.name || "Store"}</p>
            <p className="text-white/50 truncate">{[visit.storeId?.addressLine, visit.storeId?.city].filter(Boolean).join(", ")}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-[#DAAB34] shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold">{format(new Date(`${visit.visitDate}T00:00:00`), "EEE, d MMM yyyy")}</p>
            <p className="text-white/50">Planned visit</p>
          </div>
        </div>
        {!showQr && usable && (
          <div className="flex items-start gap-2 sm:col-span-2">
            <Tag className="w-4 h-4 text-[#DAAB34] shrink-0 mt-0.5" />
            <p className="font-mono text-white font-bold tracking-widest">{visit.code}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreVisitPass;
