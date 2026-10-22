import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Store as StoreIcon, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StoreVisitPass from "@/components/StoreVisitPass";
import { storeVisits, getToken } from "@/lib/api";

interface Visit {
  _id: string;
  code: string;
  status: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  color?: string;
  visitDate: string;
  priceAtBooking: number;
  customerSaysPurchased?: boolean;
  storeId?: { name?: string; addressLine?: string; city?: string } | null;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const MyStoreVisits = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/auth?redirect=/my-visits");
      return;
    }
    storeVisits.my(token)
      .then((data: Visit[]) => {
        setVisits(data);
        const firstActive = data.find((v) => v.status === "booked");
        if (firstActive) setOpenId(firstActive._id);
      })
      .catch(() => toast.error("Failed to load your store visits"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const update = (id: string, patch: Partial<Visit>) => setVisits((prev) => prev.map((v) => (v._id === id ? { ...v, ...patch } : v)));

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this store visit?")) return;
    try {
      await storeVisits.cancel(id, getToken());
      update(id, { status: "cancelled" });
      toast.success("Visit cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel");
    }
  };

  const handleFeedback = async (id: string, purchased: boolean) => {
    try {
      await storeVisits.feedback(id, purchased, getToken());
      update(id, { customerSaysPurchased: purchased });
      toast.success("Thanks for letting us know!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your answer");
    }
  };

  // Ask "Did you buy?" once the visit has happened (or the store has handled it)
  const canAskFeedback = (v: Visit) =>
    v.customerSaysPurchased === undefined && v.status !== "cancelled" &&
    (v.status !== "booked" || v.visitDate <= todayStr());

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-10 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">My Store Visits</h1>
          <p className="text-muted-foreground mb-8">Products you reserved to buy at a store. Show the pass at the store.</p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/50 rounded-2xl">
              <StoreIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-semibold">No store visits yet</p>
              <p className="text-sm text-muted-foreground mt-1">Use "Buy at Store" on any product page to reserve it.</p>
              <Link to="/shop" className="inline-block mt-4 text-sm font-bold text-primary hover:underline">Browse products →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map((v) => {
                const isOpen = openId === v._id;
                return (
                  <div key={v._id} className="space-y-2">
                    <StoreVisitPass visit={v} showQr={isOpen} />
                    <div className="flex flex-wrap items-center gap-2 px-1">
                      {(v.status === "booked" || v.status === "verified") && (
                        <button type="button" onClick={() => setOpenId(isOpen ? null : v._id)} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {isOpen ? "Hide QR" : "Show QR"}
                        </button>
                      )}
                      <Link to={`/product/${v.productId}`} className="text-xs font-bold text-muted-foreground hover:text-foreground">View product</Link>
                      {v.status === "booked" && (
                        <button type="button" onClick={() => handleCancel(v._id)} className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-red-400 hover:underline">
                          <X className="w-3.5 h-3.5" /> Cancel visit
                        </button>
                      )}
                    </div>
                    {canAskFeedback(v) && (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
                        <span className="text-xs text-foreground font-medium mr-auto">Did you buy this product at the store?</span>
                        <button type="button" onClick={() => handleFeedback(v._id, true)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">Yes</button>
                        <button type="button" onClick={() => handleFeedback(v._id, false)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border text-foreground">No</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyStoreVisits;
