import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, CheckCircle2, Home, Stethoscope } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { appointments, getUser } from "@/lib/api";
import { toast } from "sonner";
import { format, addDays, startOfToday } from "date-fns";

interface HomeEyeTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Doctor visits are booked in 2-hour windows
const HOME_SLOTS = ["09:00 - 11:00", "11:00 - 13:00", "13:00 - 15:00", "15:00 - 17:00", "17:00 - 19:00"];

const emptyForm = () => {
  const user = getUser();
  return {
    name: user?.name || "",
    phone: user?.phone || "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    date: format(addDays(startOfToday(), 1), "yyyy-MM-dd"),
    slot: "",
  };
};

const inputClass = "h-10 bg-white/5 border-white/10 rounded-lg px-3 text-[12px] text-white focus:border-[#DAAB34] transition-all placeholder:text-white/20";

const HomeEyeTestModal = ({ isOpen, onClose }: HomeEyeTestModalProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  // Next 7 days, starting tomorrow so a doctor can be assigned
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(startOfToday(), i + 1);
    return { date: format(d, "yyyy-MM-dd"), day: format(d, "EEE"), dateNum: format(d, "dd"), month: format(d, "MMM yyyy") };
  }), []);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData(emptyForm());
    }
  }, [isOpen]);

  const update = (field: keyof ReturnType<typeof emptyForm>, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }
    if (!/^\+?\d{10,13}$/.test(formData.phone.replace(/[\s-]/g, ""))) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!formData.line1.trim() || !formData.city.trim()) {
      toast.error("Please enter your house/street address and city");
      return;
    }
    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    setStep(2);
  };

  const handleBook = async () => {
    if (!formData.slot) {
      toast.error("Please select a time slot");
      return;
    }
    setLoading(true);
    try {
      await appointments.create({
        visitType: "home",
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        appointmentDate: formData.date,
        timeSlot: formData.slot,
        reason: "Eye Test at Home",
        address: {
          line1: formData.line1.trim(),
          line2: formData.line2.trim(),
          landmark: formData.landmark.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
      });
      setStep(3);
    } catch (error) {
      let message = "Booking failed";
      try {
        message = JSON.parse((error as Error).message).message || message;
      } catch {
        // not JSON
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthDisplay = dates.find((d) => d.date === formData.date)?.month || dates[0].month;
  const fullAddress = [formData.line1, formData.line2, formData.landmark, formData.city, formData.state, formData.pincode].filter((v) => v.trim()).join(", ");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-0 bg-[#111112] border border-white/10 rounded-xl shadow-2xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#DAAB34]/10 border border-[#DAAB34]/20 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5 text-[#DAAB34]" />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-white font-playfair leading-tight">Eye Test at Home</h2>
                  <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider font-bold">Our optometrist visits you</p>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                <p className="text-[9px] text-white/30 uppercase tracking-widest font-black ml-1">Contact</p>
                <Input placeholder="Name*" value={formData.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
                <Input placeholder="Phone number*" type="tel" value={formData.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />

                <p className="text-[9px] text-white/30 uppercase tracking-widest font-black ml-1 pt-1">Home Address</p>
                <Input placeholder="House no., building, street*" value={formData.line1} onChange={(e) => update("line1", e.target.value)} className={inputClass} />
                <Input placeholder="Area / colony" value={formData.line2} onChange={(e) => update("line2", e.target.value)} className={inputClass} />
                <Input placeholder="Landmark" value={formData.landmark} onChange={(e) => update("landmark", e.target.value)} className={inputClass} />
                <div className="grid grid-cols-2 gap-2.5">
                  <Input placeholder="City*" value={formData.city} onChange={(e) => update("city", e.target.value)} className={inputClass} />
                  <Input placeholder="Pincode*" inputMode="numeric" maxLength={6} value={formData.pincode} onChange={(e) => update("pincode", e.target.value.replace(/\D/g, ""))} className={inputClass} />
                </div>
                <Input placeholder="State" value={formData.state} onChange={(e) => update("state", e.target.value)} className={inputClass} />
              </div>

              <Button onClick={handleNext} className="w-full h-10 bg-[#DAAB34] hover:bg-[#C2982E] text-black text-[12px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95">
                Choose Date & Time
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4">
              <h2 className="text-[18px] font-bold text-white font-playfair leading-tight">Visit Schedule</h2>
              <p className="text-[10px] text-[#DAAB34] font-bold uppercase tracking-widest mt-0.5 truncate">{formData.city} · {formData.pincode}</p>

              <div className="h-[1px] bg-white/5 -mx-4 my-3" />

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Choose Date</h3>
                  <p className="text-[10px] text-white/30 font-medium">{currentMonthDisplay}</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {dates.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, date: d.date, slot: "" }))}
                      className={`flex flex-col items-center justify-center min-w-[50px] h-[65px] rounded-lg border transition-all ${formData.date === d.date ? "border-[#DAAB34] bg-[#DAAB34]/10" : "border-white/5 bg-white/5 hover:border-white/10"}`}
                    >
                      <span className={`text-[9px] font-bold uppercase mb-0.5 ${formData.date === d.date ? "text-[#DAAB34]" : "text-white/40"}`}>{d.day}</span>
                      <span className={`text-[15px] font-black ${formData.date === d.date ? "text-white" : "text-white/60"}`}>{d.dateNum}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">Preferred Time</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {HOME_SLOTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => update("slot", s)}
                      className={`py-2 px-2.5 rounded-lg border text-[11px] font-bold transition-all ${formData.slot === s ? "bg-[#DAAB34] border-[#DAAB34] text-black" : "bg-white/5 border-white/5 text-white/50 hover:border-white/10 hover:text-white/70"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/30 mt-2">Our team will call you to confirm the exact visit time.</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-10 border-white/10 text-white/60 hover:bg-white/5 rounded-lg text-[11px] font-bold uppercase">Back</Button>
                <Button onClick={handleBook} disabled={loading} className="flex-[2] h-10 bg-[#DAAB34] hover:bg-[#C2982E] text-black text-[12px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95">
                  {loading ? "Booking..." : "Book Home Visit"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-4 text-center">
              <div className="mb-4 pt-2">
                <div className="w-14 h-14 bg-[#DAAB34]/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#DAAB34]/20">
                  <CheckCircle2 className="w-7 h-7 text-[#DAAB34]" />
                </div>
                <h2 className="text-[20px] font-bold text-white font-playfair tracking-tight">Home Visit Requested</h2>
                <p className="text-[11px] text-white/50 mt-1">We will call you on <span className="text-white font-bold">{formData.phone}</span> to confirm.</p>
              </div>

              <div className="text-left space-y-3.5 mb-5 px-3.5 py-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-[#DAAB34]" />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Visit</p>
                    <p className="text-[13px] font-bold text-white mt-1">{format(new Date(formData.date), "EEEE, d MMM")}</p>
                    <p className="text-[11px] text-[#DAAB34] font-bold mt-1">{formData.slot}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-t border-white/5 pt-3.5">
                  <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#DAAB34]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Address</p>
                    <p className="text-[12px] text-white/80 font-medium mt-1 leading-snug">{fullAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-t border-white/5 pt-3.5">
                  <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-4 h-4 text-[#DAAB34]" />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Service</p>
                    <p className="text-[12px] text-white/80 font-medium mt-1">Comprehensive eye test by a certified optometrist</p>
                  </div>
                </div>
              </div>

              <Button onClick={onClose} className="w-full h-10 bg-[#DAAB34] hover:bg-[#C2982E] text-black text-[11px] font-black uppercase tracking-widest rounded-lg">
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default HomeEyeTestModal;
