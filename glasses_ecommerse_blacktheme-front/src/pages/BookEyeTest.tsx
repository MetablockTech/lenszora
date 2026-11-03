import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { format, addDays, startOfToday } from "date-fns";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { appointments, stores as storesApi, getUser } from "@/lib/api";

// One page for both eye test options: at a LensZora store, or an optometrist visiting at home.
// Opened from the Eye Test button in the mobile bottom bar (/eye-test, ?mode=home for home).

type Mode = "store" | "home";

interface StoreLite {
  _id: string;
  name: string;
  addressLine?: string;
  city?: string;
}

// Same windows as the store appointment modal (30 min) and home visits (2 h)
const STORE_SLOTS = [
  "11:00 - 11:30", "11:30 - 12:00", "12:00 - 12:30", "12:30 - 13:00",
  "13:00 - 13:30", "13:30 - 14:00", "14:00 - 14:30", "14:30 - 15:00",
  "15:00 - 15:30", "15:30 - 16:00", "16:00 - 16:30", "16:30 - 17:00",
  "17:00 - 17:30", "17:30 - 18:00", "18:00 - 18:30", "18:30 - 19:00",
];
const HOME_SLOTS = ["09:00 - 11:00", "11:00 - 13:00", "13:00 - 15:00", "15:00 - 17:00", "17:00 - 19:00"];

const labelClass = "mb-1.5 block text-sm font-semibold text-slate-200";
const fieldClass = "h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[15px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#DAAB34]";

const BookEyeTest = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "home" ? "home" : "store");
  const [storeList, setStoreList] = useState<StoreLite[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);

  const user = getUser();
  const today = format(startOfToday(), "yyyy-MM-dd");
  const tomorrow = format(addDays(startOfToday(), 1), "yyyy-MM-dd");
  const [form, setForm] = useState({
    storeId: "",
    name: user?.name || "",
    phone: user?.phone || "",
    date: today,
    slot: "",
    line1: "",
    landmark: "",
    city: "",
    pincode: "",
  });
  const update = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    storesApi.list({ isActive: true })
      .then((list: StoreLite[]) => {
        const active = Array.isArray(list) ? list : [];
        setStoreList(active);
        if (active.length > 0) setForm((prev) => (prev.storeId ? prev : { ...prev, storeId: active[0]._id }));
      })
      .catch(() => setStoreList([]));
  }, []);

  // Home visits start tomorrow so a doctor can be assigned
  const minDate = mode === "home" ? tomorrow : today;
  useEffect(() => {
    setForm((prev) => ({ ...prev, slot: "", date: prev.date < minDate ? minDate : prev.date }));
  }, [mode, minDate]);

  const slots = useMemo(() => {
    const list = mode === "home" ? HOME_SLOTS : STORE_SLOTS;
    if (form.date !== today) return list;
    // Today: only slots that haven't started yet
    const now = format(new Date(), "HH:mm");
    return list.filter((s) => s.slice(0, 5) > now);
  }, [mode, form.date, today]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Please enter your full name");
    if (!/^\+?\d{10,13}$/.test(form.phone.replace(/[\s-]/g, ""))) return toast.error("Please enter a valid mobile number");
    if (mode === "store" && !form.storeId) return toast.error("Please choose a store");
    if (mode === "home") {
      if (!form.line1.trim() || !form.city.trim()) return toast.error("Please enter your address and city");
      if (!/^\d{6}$/.test(form.pincode.trim())) return toast.error("Please enter a valid 6-digit pincode");
    }
    if (!form.slot) return toast.error("Please choose a time slot");

    setSubmitting(true);
    try {
      await appointments.create({
        visitType: mode,
        ...(mode === "store" ? { storeId: form.storeId } : {}),
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        appointmentDate: form.date,
        timeSlot: form.slot,
        reason: mode === "home" ? "Eye Test at Home" : "Free Eye Test",
        ...(mode === "home"
          ? { address: { line1: form.line1.trim(), landmark: form.landmark.trim(), city: form.city.trim(), pincode: form.pincode.trim() } }
          : {}),
      });
      setBooked(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      let message = "Booking failed, please try again";
      try {
        message = JSON.parse((error as Error).message).message || message;
      } catch {
        // not JSON
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStore = storeList?.find((s) => s._id === form.storeId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-xl px-4 pb-28 pt-6 md:pb-16 md:pt-10">
        <span className="inline-block rounded-full border border-[#DAAB34]/40 bg-[#DAAB34]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#DAAB34]">
          Free Eye Check-up
        </span>
        <h1 className="mt-3 font-playfair text-3xl font-bold text-white">
          Book a <span className="text-[#DAAB34]">FREE</span> Eye Test
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-400">
          Certified optometrists · computerised eye testing · takes about 15 minutes.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#111112] p-4 sm:p-6">
          {booked ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-[#DAAB34]" />
              <h2 className="mt-4 font-playfair text-2xl font-bold text-white">Eye test booked!</h2>
              <p className="mt-2 text-sm text-slate-400">
                {format(new Date(form.date), "EEE, dd MMM yyyy")} · {form.slot}
                <br />
                {mode === "home" ? `At home: ${[form.line1, form.landmark, form.city, form.pincode].filter(Boolean).join(", ")}` : `At ${selectedStore?.name || "the store"}`}
              </p>
              <p className="mt-3 text-sm text-slate-400">We'll call you on {form.phone} to confirm.</p>
              <Link to="/" className="mt-6 inline-block rounded-xl bg-[#DAAB34] px-6 py-3 text-sm font-bold text-black">Back to Home</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Store / home toggle */}
              <div className="grid grid-cols-2 gap-1 rounded-full bg-black p-1.5 ring-1 ring-white/10">
                {([["store", "🏬 At a store"], ["home", "🏠 At home"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`rounded-full py-3 text-[15px] font-bold transition-all ${mode === key ? "bg-gradient-to-r from-[#f0cf7a] to-[#DAAB34] text-black shadow" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === "store" && (
                <div>
                  <label className={labelClass} htmlFor="et-store">Store</label>
                  <select
                    id="et-store"
                    value={form.storeId}
                    onChange={(e) => update("storeId", e.target.value)}
                    className={fieldClass}
                    disabled={!storeList}
                  >
                    {!storeList && <option>Loading stores…</option>}
                    {storeList?.length === 0 && <option value="">No stores available</option>}
                    {storeList?.map((s) => (
                      <option key={s._id} value={s._id} className="bg-[#111112]">
                        {[s.name?.trim(), s.addressLine || s.city].filter(Boolean).join(" – ")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelClass} htmlFor="et-name">Full name</label>
                <input id="et-name" value={form.name} onChange={(e) => update("name", e.target.value)} className={fieldClass} autoComplete="name" />
              </div>
              <div>
                <label className={labelClass} htmlFor="et-phone">Mobile</label>
                <input id="et-phone" type="tel" inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={fieldClass} autoComplete="tel" />
              </div>

              {mode === "home" && (
                <>
                  <div>
                    <label className={labelClass} htmlFor="et-line1">House / street address</label>
                    <input id="et-line1" value={form.line1} onChange={(e) => update("line1", e.target.value)} className={fieldClass} autoComplete="street-address" />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="et-landmark">Landmark (optional)</label>
                    <input id="et-landmark" value={form.landmark} onChange={(e) => update("landmark", e.target.value)} className={fieldClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} htmlFor="et-city">City</label>
                      <input id="et-city" value={form.city} onChange={(e) => update("city", e.target.value)} className={fieldClass} autoComplete="address-level2" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="et-pin">Pincode</label>
                      <input id="et-pin" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => update("pincode", e.target.value.replace(/\D/g, ""))} className={fieldClass} autoComplete="postal-code" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className={labelClass} htmlFor="et-date">Date</label>
                <input
                  id="et-date"
                  type="date"
                  min={minDate}
                  max={format(addDays(startOfToday(), 30), "yyyy-MM-dd")}
                  value={form.date}
                  onChange={(e) => update("date", e.target.value || minDate)}
                  className={`${fieldClass} [color-scheme:dark]`}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="et-slot">Time slot</label>
                <select id="et-slot" value={form.slot} onChange={(e) => update("slot", e.target.value)} className={fieldClass}>
                  <option value="" className="bg-[#111112]">{slots.length ? "Choose a time" : "No slots left today, pick another date"}</option>
                  {slots.map((s) => <option key={s} value={s} className="bg-[#111112]">{s.replace(" - ", " – ")}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f0cf7a] to-[#DAAB34] py-3.5 text-[15px] font-bold text-black transition-opacity disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "home" ? "Book Home Eye Test" : "Book Free Eye Test"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookEyeTest;
