import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, MapPin, Phone, CheckCircle2, ChevronRight, Gift, Navigation, PhoneCall } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { appointments } from "@/lib/api";
import { toast } from "sonner";
import { format, addDays, startOfToday } from "date-fns";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: any;
}

const AppointmentModal = ({ isOpen, onClose, store }: AppointmentModalProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    reason: "Eye Test",
    date: format(startOfToday(), "yyyy-MM-dd"),
    slot: "",
  });

  // Generate next 7 days
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(startOfToday(), i);
      return {
        date: format(d, "yyyy-MM-dd"),
        day: format(d, "EEE"),
        dateNum: format(d, "dd"),
        month: format(d, "MMM yyyy"),
      };
    });
  }, []);

  // Generate slots
  const slots = [
    "11:00 - 11:30", "11:30 - 12:00", "12:00 - 12:30", "12:30 - 13:00",
    "13:00 - 13:30", "13:30 - 14:00", "14:00 - 14:30", "14:30 - 15:00",
    "15:00 - 15:30", "15:30 - 16:00", "16:00 - 16:30", "16:30 - 17:00",
    "17:00 - 17:30", "17:30 - 18:00", "18:00 - 18:30", "18:30 - 19:00"
  ];

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        name: "",
        phone: "",
        reason: "Eye Test",
        date: format(startOfToday(), "yyyy-MM-dd"),
        slot: "",
      });
      setBookedSlots([]);
    }
  }, [isOpen]);

  // Fetch booked slots when date or store changes
  const fetchBookedSlots = async (selectedDate: string) => {
    try {
      const response = await appointments.list({ 
        storeId: store._id, 
        date: selectedDate 
      });
      const taken = response.map((app: any) => app.timeSlot);
      setBookedSlots(taken);
    } catch (error) {
      console.error("Failed to fetch booked slots", error);
    }
  };

  const handleDateSelect = (selectedDate: string) => {
    setFormData({ ...formData, date: selectedDate, slot: "" }); // Reset slot on date change
    fetchBookedSlots(selectedDate);
  };

  useMemo(() => {
    if (isOpen && store._id) {
      fetchBookedSlots(formData.date);
    }
  }, [isOpen, store._id]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.phone) {
        toast.error("Please enter your name and phone number");
        return;
      }
      setStep(2);
    }
  };

  const handleBook = async () => {
    if (!formData.slot) {
      toast.error("Please select a time slot");
      return;
    }

    setLoading(true);
    try {
      await appointments.create({
        storeId: store._id,
        customerName: formData.name,
        customerPhone: formData.phone,
        appointmentDate: formData.date,
        timeSlot: formData.slot,
        reason: formData.reason
      });
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGetDirections = () => {
    if (store.location?.coordinates) {
      const [lng, lat] = store.location.coordinates;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      const query = encodeURIComponent(`${store.name} ${store.addressLine} ${store.city}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleCallStore = () => {
    if (store.phone) {
      window.location.href = `tel:${store.phone}`;
    } else {
      toast.error("Store phone number not available");
    }
  };

  const currentMonthDisplay = dates.find(d => d.date === formData.date)?.month || dates[0].month;

  const reasons = ["Eye Test", "New Purchase", "Frame Repair", "Checkup", "Other"];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-[#111112] border border-white/10 rounded-xl selection:bg-[#DAAB34]/20 shadow-2xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-white font-playfair leading-tight">Contact Details</h2>
                  <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider font-bold">Booking Registration</p>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                <Input
                  placeholder="Phone number*"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10 bg-white/5 border-white/10 rounded-lg px-3 text-[12px] text-white focus:border-[#DAAB34] transition-all placeholder:text-white/20"
                />
                <Input
                  placeholder="Name*"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 bg-white/5 border-white/10 rounded-lg px-3 text-[12px] text-white focus:border-[#DAAB34] transition-all placeholder:text-white/20"
                />
                
                <div className="pt-1">
                  <p className="text-[9px] text-white/30 uppercase tracking-widest font-black mb-2 ml-1">Reason for Visit</p>
                  <div className="flex flex-wrap gap-1.5">
                    {reasons.map((r) => (
                      <button
                        key={r}
                        onClick={() => setFormData({ ...formData, reason: r })}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${formData.reason === r
                            ? "bg-[#DAAB34] border-[#DAAB34] text-black shadow-[0_0_10px_rgba(218,171,52,0.2)]"
                            : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                          }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#DAAB34]/10 py-1.5 px-4 mb-4 -mx-4 flex items-center justify-center gap-1.5 border-y border-[#DAAB34]/20">
                <Gift className="w-3 h-3 text-[#DAAB34]" />
                <span className="text-[9px] font-bold text-[#DAAB34] uppercase tracking-widest leading-none">FREE EYE TEST <span className="text-white">& REPAIR</span></span>
              </div>

              <Button
                onClick={handleNext}
                className="w-full h-10 bg-[#DAAB34] hover:bg-[#C2982E] text-black text-[12px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
              >
                Next Step
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h2 className="text-[18px] font-bold text-white font-playfair leading-tight">Visit Schedule</h2>
                  <p className="text-[10px] text-[#DAAB34] font-bold uppercase tracking-widest mt-0.5 truncate max-w-[280px]">{store.name}</p>
                </div>
              </div>

              <div className="h-[1px] bg-white/5 -mx-4 my-3" />

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Choose Date</h3>
                  <p className="text-[10px] text-white/30 font-medium">{currentMonthDisplay}</p>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                  {dates.map((d) => (
                    <button
                      key={d.date}
                      onClick={() => handleDateSelect(d.date)}
                      className={`flex flex-col items-center justify-center min-w-[50px] h-[65px] rounded-lg border transition-all duration-300 ${formData.date === d.date
                          ? "border-[#DAAB34] bg-[#DAAB34]/10 shadow-[0_0_10px_rgba(218,171,52,0.1)]"
                          : "border-white/5 bg-white/5 hover:border-white/10"
                        }`}
                    >
                      <span className={`text-[9px] font-bold uppercase mb-0.5 ${formData.date === d.date ? "text-[#DAAB34]" : "text-white/40"}`}>{d.day}</span>
                      <span className={`text-[15px] font-black ${formData.date === d.date ? "text-white" : "text-white/60"}`}>{d.dateNum}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Available Slots</h3>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-[130px] overflow-y-auto px-0.5 custom-scrollbar">
                  {slots.map((s) => {
                    const isBooked = bookedSlots.includes(s);
                    return (
                      <button
                        key={s}
                        disabled={isBooked}
                        onClick={() => setFormData({ ...formData, slot: s })}
                        className={`py-2 px-2.5 rounded-lg border text-[10px] font-bold transition-all duration-200 ${formData.slot === s
                            ? "bg-[#DAAB34] border-[#DAAB34] text-black"
                            : isBooked
                            ? "bg-white/5 border-white/5 text-white/10 cursor-not-allowed opacity-40"
                            : "bg-white/5 border-white/5 text-white/40 hover:border-white/10 hover:text-white/60"
                          }`}
                      >
                        {s}
                        {isBooked && <span className="block text-[7px] opacity-60 uppercase">(Taken)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-10 border-white/10 text-white/60 hover:bg-white/5 rounded-lg text-[11px] font-bold uppercase">Back</Button>
                <Button
                  onClick={handleBook}
                  disabled={loading}
                  className="flex-[2] h-10 bg-[#DAAB34] hover:bg-[#C2982E] text-black text-[12px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                >
                  {loading ? "Confirming..." : "Book Now"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 text-center relative"
            >
              <div className="mb-4 pt-2">
                <div className="w-14 h-14 bg-[#DAAB34]/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#DAAB34]/20 shadow-[0_0_20px_rgba(218,171,52,0.1)]">
                  <CheckCircle2 className="w-7 h-7 text-[#DAAB34]" />
                </div>
                <h2 className="text-[20px] font-bold text-white font-playfair tracking-tight">Booking Confirmed</h2>
                <p className="text-[9px] text-[#DAAB34] mt-0.5 uppercase tracking-[3px] font-black">Lenzora Store Appointment</p>
              </div>

              <div className="text-left space-y-3.5 mb-5 px-3.5 py-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-[#DAAB34]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Appointment</p>
                        <p className="text-[13px] font-bold text-white leading-none mt-1">{format(new Date(formData.date), 'EEEE, d MMM')}</p>
                        <p className="text-[11px] text-[#DAAB34] font-bold mt-1 uppercase tracking-tighter">{formData.slot}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Reason</p>
                        <p className="text-[11px] text-white/80 font-bold mt-1">{formData.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 group border-t border-white/5 pt-3.5">
                  <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#DAAB34]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Location</p>
                    <p className="text-[13px] font-bold text-white mt-1 truncate">{store.name}</p>
                    <p className="text-[10px] text-white/40 font-medium mt-0.5 leading-tight line-clamp-1">{store.addressLine}, {store.city}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button 
                  onClick={handleGetDirections}
                  variant="outline" 
                  className="bg-[#DAAB34] text-black border-none h-10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#C2982E] transition-all gap-1.5 shadow-[0_5px_15px_rgba(218,171,52,0.2)]"
                >
                  <Navigation className="w-3 h-3 fill-current" />
                  Get Directions
                </Button>
                <Button 
                  onClick={handleCallStore}
                  variant="outline" 
                  className="bg-white/5 border border-white/10 text-white/70 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all gap-1.5"
                >
                  <PhoneCall className="w-3 h-3" />
                  Call Store
                </Button>
              </div>

              <button
                onClick={onClose}
                className="w-full text-[9px] text-white/20 font-bold uppercase tracking-[4px] hover:text-[#DAAB34] transition-colors py-1"
              >
                Close Window
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;
