import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, addDays, startOfToday } from "date-fns";
import { MapPin, Store as StoreIcon, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { storeVisits, getToken } from "@/lib/api";
import StoreVisitPass from "@/components/StoreVisitPass";

interface StoreOption {
  _id: string;
  name: string;
  addressLine?: string;
  city?: string;
  state?: string;
  phone?: string;
}

interface StoreVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  stores: StoreOption[];
  variantSku?: string;
  color?: string;
}

const StoreVisitModal = ({ isOpen, onClose, productId, productTitle, stores, variantSku, color }: StoreVisitModalProps) => {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState("");
  const [visitDate, setVisitDate] = useState(format(startOfToday(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState<any>(null);

  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(startOfToday(), i);
    return { date: format(d, "yyyy-MM-dd"), day: i === 0 ? "Today" : format(d, "EEE"), dateNum: format(d, "dd") };
  }), []);

  useEffect(() => {
    if (isOpen) {
      setPass(null);
      setStoreId(stores.length === 1 ? stores[0]._id : "");
      setVisitDate(format(startOfToday(), "yyyy-MM-dd"));
    }
  }, [isOpen, stores]);

  const handleBook = async () => {
    const token = getToken();
    if (!token) {
      toast.info("Please sign in to reserve this product");
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!storeId) {
      toast.error("Please choose a store");
      return;
    }
    setLoading(true);
    try {
      const visit = await storeVisits.book({ productId, storeId, visitDate, variantSku, color }, token);
      const store = stores.find((s) => s._id === storeId);
      setPass({ ...visit, storeId: store });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reserve");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 bg-[#111112] border border-white/10 rounded-xl text-white [&>*]:min-w-0">
        {!pass ? (
          <div className="p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-[#DAAB34]/10 border border-[#DAAB34]/20 flex items-center justify-center shrink-0">
                <StoreIcon className="w-5 h-5 text-[#DAAB34]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold font-playfair leading-tight">Buy at Store</h2>
                <p className="text-[11px] text-white/50 truncate">{productTitle}</p>
              </div>
            </div>
            <p className="text-xs text-white/50 mt-3 mb-4">
              Reserve now and get a visit pass. Show it at the store to buy at today's online price.
            </p>

            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-2">Choose Store</p>
            <div className="space-y-2 mb-5">
              {stores.map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => setStoreId(s._id)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors ${storeId === s._id ? "border-[#DAAB34] bg-[#DAAB34]/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                >
                  <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${storeId === s._id ? "text-[#DAAB34]" : "text-white/40"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{s.name}</p>
                    <p className="text-[11px] text-white/50">{[s.addressLine, s.city].filter(Boolean).join(", ")}</p>
                  </div>
                  {storeId === s._id && <CheckCircle2 className="w-4 h-4 text-[#DAAB34] ml-auto shrink-0" />}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-2">When will you visit?</p>
            <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
              {dates.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setVisitDate(d.date)}
                  className={`flex flex-col items-center justify-center min-w-[52px] h-[62px] rounded-lg border transition-colors ${visitDate === d.date ? "border-[#DAAB34] bg-[#DAAB34]/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                >
                  <span className={`text-[9px] font-bold uppercase ${visitDate === d.date ? "text-[#DAAB34]" : "text-white/40"}`}>{d.day}</span>
                  <span className="text-base font-black">{d.dateNum}</span>
                </button>
              ))}
            </div>

            <Button onClick={handleBook} disabled={loading || !storeId} className="w-full h-11 bg-[#DAAB34] hover:bg-[#C2982E] text-black font-black uppercase tracking-widest text-xs">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Visit Pass"}
            </Button>
          </div>
        ) : (
          <div className="p-5">
            <div className="text-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#DAAB34] mx-auto mb-2" />
              <h2 className="text-lg font-bold font-playfair">Your Visit Pass is Ready</h2>
              <p className="text-xs text-white/50 mt-1">Valid until 3 days after your visit date.</p>
            </div>
            <StoreVisitPass visit={pass} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button asChild variant="outline" className="h-10 border-white/15 bg-transparent text-white hover:bg-white/10 text-xs font-bold">
                <Link to="/my-visits" onClick={onClose}>My Store Visits</Link>
              </Button>
              <Button onClick={onClose} className="h-10 bg-[#DAAB34] hover:bg-[#C2982E] text-black text-xs font-black uppercase">Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoreVisitModal;
