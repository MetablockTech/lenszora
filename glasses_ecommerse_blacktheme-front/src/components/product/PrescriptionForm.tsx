import { useState, useEffect } from "react";
import { Phone, Check, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Prescription {
    sph: string;
    cyl: string;
    axis: string;
    addl: string;
}

interface PrescriptionData {
    od: Prescription;
    os: Prescription;
    pd: string;
    isSamePower: boolean;
    hasCylindrical: boolean;
    customerName: string;
    customerPhone: string;
}

interface PrescriptionFormProps {
    onPrescriptionChange: (data: PrescriptionData) => void;
    initialData?: Partial<PrescriptionData>;
}

const PrescriptionForm = ({ onPrescriptionChange, initialData }: PrescriptionFormProps) => {
    const defaultPrescription = { sph: "", cyl: "", axis: "", addl: "" };
    const [od, setOd] = useState<Prescription>(initialData?.od || defaultPrescription);
    const [os, setOs] = useState<Prescription>(initialData?.os || defaultPrescription);
    const [pd, setPd] = useState(initialData?.pd || "62");
    const [isSamePower, setIsSamePower] = useState(initialData?.isSamePower || false);
    const [hasCylindrical, setHasCylindrical] = useState(initialData?.hasCylindrical || false);
    const [customerName, setCustomerName] = useState(initialData?.customerName || "");
    const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || "");

    useEffect(() => {
        onPrescriptionChange({
            od, os, pd, isSamePower, hasCylindrical, customerName, customerPhone
        });
    }, [od, os, pd, isSamePower, hasCylindrical, customerName, customerPhone]);

    const handleUpdate = (eye: 'od' | 'os', field: keyof Prescription, value: string) => {
        if (isSamePower) {
            setOd(prev => ({ ...prev, [field]: value }));
            setOs(prev => ({ ...prev, [field]: value }));
        } else {
            const setter = eye === 'od' ? setOd : setOs;
            setter(prev => ({ ...prev, [field]: value }));
        }
    };

    const sphValues = ["-12.00", "-11.75", "-11.50", "-11.25", "-11.00", "-10.75", "-10.50", "-10.25", "-10.00", "-9.75", "-9.50", "-9.25", "-9.00", "-8.75", "-8.50", "-8.25", "-8.00", "-7.75", "-7.50", "-7.25", "-7.00", "-6.75", "-6.50", "-6.25", "-6.00", "-5.75", "-5.50", "-5.25", "-5.00", "-4.75", "-4.50", "-4.25", "-4.00", "-3.75", "-3.50", "-3.25", "-3.00", "-2.75", "-2.50", "-2.25", "-2.00", "-1.75", "-1.50", "-1.25", "-1.00", "-0.75", "-0.50", "-0.25", "0.00", "+0.25", "+0.50", "+0.75", "+1.00", "+1.25", "+1.50", "+1.75", "+2.00", "+2.25", "+2.50", "+2.75", "+3.00", "+3.25", "+3.50", "+3.75", "+4.00", "+4.25", "+4.50", "+4.75", "+5.00", "+5.25", "+5.50", "+5.75", "+6.00"];
    const cylValues = ["-6.00", "-5.75", "-5.50", "-5.25", "-5.00", "-4.75", "-4.50", "-4.25", "-4.00", "-3.75", "-3.50", "-3.25", "-3.00", "-2.75", "-2.50", "-2.25", "-2.00", "-1.75", "-1.50", "-1.25", "-1.00", "-0.75", "-0.50", "-0.25", "0.00", "+0.25", "+0.50", "+0.75", "+1.00", "+1.25", "+1.50", "+1.75", "+2.00", "+2.25", "+2.50", "+2.75", "+3.00", "+3.25", "+3.50", "+3.75", "+4.00"];
    const addlValues = ["0.75", "1.00", "1.25", "1.50", "1.75", "2.00", "2.25", "2.50", "2.75", "3.00", "3.25", "3.50", "3.75", "4.00"];

    return (
        <div className="space-y-5 pt-1 pb-6 px-1 animate-in fade-in duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Toggles */}
            <div className="space-y-4 mb-6">
                <label className="flex items-center gap-3 group cursor-pointer select-none">
                    <div className="relative flex items-center justify-center">
                        <input 
                            type="checkbox" 
                            checked={isSamePower} 
                            onChange={(e) => setIsSamePower(e.target.checked)}
                            className="peer appearance-none w-5 h-5 border-[1.5px] border-slate-400 rounded-[4px] checked:bg-[#0f1e3c] checked:border-[#0f1e3c] hover:border-slate-500 transition-all cursor-pointer"
                        />
                        <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-[.88rem] font-medium text-slate-800">I have same power for both eyes</span>
                </label>

                <label className="flex items-center gap-3 group cursor-pointer select-none">
                    <div className="relative flex items-center justify-center">
                        <input 
                            type="checkbox" 
                            checked={hasCylindrical} 
                            onChange={(e) => setHasCylindrical(e.target.checked)}
                            className="peer appearance-none w-5 h-5 border-[1.5px] border-slate-400 rounded-[4px] checked:bg-[#0f1e3c] checked:border-[#0f1e3c] hover:border-slate-500 transition-all cursor-pointer"
                        />
                        <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-[.88rem] font-medium text-slate-800">I have cylindrical power</span>
                </label>
            </div>

            {/* Grid Form */}
            <div className={`bg-white rounded-2xl space-y-5 grid ${isSamePower ? 'grid-cols-[100px_1fr]' : 'grid-cols-[100px_1fr_1fr]'} gap-y-5 items-start`}>
                
                {/* Header Row */}
                <div className="text-[.72rem] font-black text-slate-800 tracking-tight uppercase self-center pb-1">Power</div>
                {isSamePower ? (
                    <div className="text-[.72rem] font-black text-slate-800 tracking-tight uppercase text-center pb-1">Left & Right</div>
                ) : (
                    <>
                        <div className="text-[.72rem] font-black text-slate-800 tracking-tight uppercase text-center pb-1">LEFT (OS)</div>
                        <div className="text-[.72rem] font-black text-slate-800 tracking-tight uppercase text-center pb-1">RIGHT (OD)</div>
                    </>
                )}

                {/* SPH Row */}
                <div className="text-[.72rem] font-bold text-slate-500 uppercase tracking-wide self-center">SPH</div>
                <div className="relative">
                    <select
                        value={os.sph}
                        onChange={(e) => handleUpdate('os', 'sph', e.target.value)}
                        className="w-full h-12 appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 text-[.85rem] font-medium text-slate-700 focus:border-[#0f1e3c] focus:ring-1 focus:ring-[#0f1e3c]/10 outline-none transition-all cursor-pointer"
                    >
                        <option value="">Select</option>
                        {sphValues.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" className="text-slate-400"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                </div>
                {!isSamePower && (
                    <div className="relative">
                        <select
                            value={od.sph}
                            onChange={(e) => handleUpdate('od', 'sph', e.target.value)}
                            className="w-full h-12 appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 text-[.85rem] font-medium text-slate-700 focus:border-[#0f1e3c] focus:ring-1 focus:ring-[#0f1e3c]/10 outline-none transition-all cursor-pointer"
                        >
                            <option value="">Select</option>
                            {sphValues.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg width="8" height="5" viewBox="0 0 10 6" fill="none" className="text-slate-400"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>
                )}

                {/* CYL Row (Conditional) */}
                {hasCylindrical && (
                    <>
                        <div className="text-[.72rem] font-bold text-slate-500 uppercase tracking-wide self-center animate-in fade-in duration-300">CYL</div>
                        <div className="relative animate-in fade-in duration-300">
                            <select
                                value={os.cyl}
                                onChange={(e) => handleUpdate('os', 'cyl', e.target.value)}
                                className="w-full h-12 appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 text-[.85rem] font-medium text-slate-700 focus:border-[#0f1e3c] focus:ring-1 focus:ring-[#0f1e3c]/10 outline-none transition-all cursor-pointer"
                            >
                                <option value="">Select</option>
                                {cylValues.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg width="8" height="5" viewBox="0 0 10 6" fill="none" className="text-slate-400"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                        </div>
                        {!isSamePower && (
                            <div className="relative animate-in fade-in duration-300">
                                <select
                                    value={od.cyl}
                                    onChange={(e) => handleUpdate('od', 'cyl', e.target.value)}
                                    className="w-full h-12 appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 text-[.85rem] font-medium text-slate-700 focus:border-[#0f1e3c] focus:ring-1 focus:ring-[#0f1e3c]/10 outline-none transition-all cursor-pointer"
                                >
                                    <option value="">Select</option>
                                    {cylValues.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg width="8" height="5" viewBox="0 0 10 6" fill="none" className="text-slate-400"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* AXIS Row (Conditional) */}
                {hasCylindrical && (
                    <>
                        <div className="text-[.72rem] font-bold text-slate-500 uppercase tracking-wide self-center animate-in fade-in duration-400">Axis</div>
                        <div className="animate-in fade-in duration-400">
                            <input
                                type="text"
                                value={os.axis}
                                onChange={(e) => handleUpdate('os', 'axis', e.target.value.replace(/\D/g, '').slice(0, 3))}
                                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-[.85rem] font-medium text-slate-700 focus:border-[#0f1e3c] focus:ring-1 focus:ring-[#0f1e3c]/10 outline-none transition-all"
                            />
                        </div>
                        {!isSamePower && (
                            <div className="animate-in fade-in duration-400">
                                <input
                                    type="text"
                                    value={od.axis}
                                    onChange={(e) => handleUpdate('od', 'axis', e.target.value.replace(/\D/g, '').slice(0, 3))}
                                    className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-[.85rem] font-medium text-slate-700 focus:border-[#0f1e3c] focus:ring-1 focus:ring-[#0f1e3c]/10 outline-none transition-all"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Addl. Power Row */}
                <div className="text-[.72rem] font-bold text-slate-500 uppercase tracking-wide self-center">Addl. Power</div>
                <div className="relative">
                    <select
                        value={os.addl}
                        onChange={(e) => handleUpdate('os', 'addl', e.target.value)}
                        className="w-full h-12 appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 text-[.85rem] font-medium text-slate-700 focus:border-[#0f1e3c] focus:ring-1 focus:ring-[#0f1e3c]/10 outline-none transition-all cursor-pointer"
                    >
                        <option value="">Select</option>
                        {addlValues.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" className="text-slate-400"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                </div>
                {!isSamePower && (
                    <div className="relative">
                        <select
                            value={od.addl}
                            onChange={(e) => handleUpdate('od', 'addl', e.target.value)}
                            className="w-full h-12 appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 text-[.85rem] font-medium text-slate-700 focus:border-[#0f1e3c] focus:ring-1 focus:ring-[#0f1e3c]/10 outline-none transition-all cursor-pointer"
                        >
                            <option value="">Select</option>
                            {addlValues.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg width="8" height="5" viewBox="0 0 10 6" fill="none" className="text-slate-400"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Customer Details */}
            <div className="pt-6 space-y-5">
                <h3 className="text-[.95rem] font-black text-slate-800 tracking-tight">Whose prescription is this</h3>
                
                <div className="space-y-4">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full h-14 bg-white border border-slate-200 rounded-xl px-5 text-[.88rem] font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0f1e3c] focus:ring-1 focus:ring-[#0f1e3c]/10 outline-none transition-all"
                            placeholder="Name *"
                        />
                    </div>
                    <div className="relative">
                        <input 
                            type="tel" 
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="w-full h-14 bg-white border border-slate-200 rounded-xl px-5 text-[.88rem] font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0f1e3c] focus:ring-1 focus:ring-[#0f1e3c]/10 outline-none transition-all"
                            placeholder="Phone Number *"
                        />
                    </div>
                </div>
            </div>

            {/* WhatsApp Floating Hint */}
            <div className="fixed bottom-24 right-5 z-[120]">
                <a href="https://wa.me/918470007367" target="_blank" rel="noopener noreferrer" className="w-[52px] h-[52px] bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 active:scale-95 transition-all">
                    <MessageCircle className="w-7 h-7 text-white fill-white" />
                </a>
            </div>
        </div>
    );
};

export default PrescriptionForm;
