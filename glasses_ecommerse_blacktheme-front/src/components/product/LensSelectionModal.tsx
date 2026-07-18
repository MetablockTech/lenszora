import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Zap, Shield, Eye, Waves, Sun, Droplets, Award, Sparkles, Check, Layers } from "lucide-react";
import { lens, API_URL } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import PrescriptionForm from "./PrescriptionForm";

interface LensSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: any) => void;
    vendorId?: string;
    productTitle: string;
    product?: any;
    framePrice?: number;
    initialData?: any;
}

const LensSelectionModal = ({ isOpen, onClose, onSelect, vendorId, productTitle, product, framePrice = 0, initialData }: LensSelectionModalProps) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [lensTypes, setLensTypes] = useState<any[]>([]);
    const [lensPackages, setLensPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Selections
    const [selectedType, setSelectedType] = useState<any>(null);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [powerOption, setPowerOption] = useState<'later' | 'manual' | null>(null);
    const [prescription, setPrescription] = useState<any>(null);
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
    const [activePackageDetails, setActivePackageDetails] = useState<any>(null);

    useEffect(() => {
        if (isOpen && (product || vendorId)) {
            fetchLensData();
            
            if (initialData) {
                // Pre-fill from existing data
                setSelectedType(initialData.type || null);
                setSelectedPackage(initialData.package || null);
                setPrescription(initialData.prescription || null);
                
                if (initialData.prescription) {
                    setPowerOption('manual');
                } else if (initialData.type?.allowPackages === false) {
                     setPowerOption(null);
                }
                
                // Determine step
                if (initialData.package || initialData.type?.allowPackages === false) {
                    setStep(initialData.prescription ? 3 : 2);
                } else {
                    setStep(1);
                }
            } else {
                setStep(1);
                setSelectedType(null);
                setSelectedPackage(null);
                setPowerOption(null);
                setPrescription(null);
                setShowPrescriptionForm(false);
            }
        }
    }, [isOpen, vendorId, product, initialData]);

    async function fetchLensData() {
        try {
            setLoading(true);
            const productLensTypes = product?.lensSettings?.lensTypes || [];

            if (productLensTypes.length > 0) {
                // Hierarchical System (Vendor-defined for this specific product)
                console.log("Using product-specific lens types:", productLensTypes.length);

                // Fetch global vendor lens types as a fallback in case the API didn't populate lensTypeId
                const hasUnpopulatedTypes = productLensTypes.some((pt: any) => typeof pt.lensTypeId === 'string');
                let adminGlobalData: any = null;
                let vendorGlobalData: any = null;
                if (hasUnpopulatedTypes) {
                    try {
                        adminGlobalData = await lens.getPublic(); // Fetch platform global types
                        if (vendorId && typeof vendorId === 'string' && vendorId.length > 5) {
                             vendorGlobalData = await lens.getPublic(vendorId); // Fetch vendor-specific types
                        }
                    } catch (e) {
                        console.error("Fallback global lens fetch failed", e);
                    }
                }

                // Extract types directly from the populated product data
                // This avoids calling protected Admin APIs on the storefront
                const enabledTypes = productLensTypes
                    .map((pt: any) => {
                        let typeInfo = pt.lensTypeId;
                        if (typeof pt.lensTypeId === 'string') {
                            // Find the original type details from the global fetch if available
                            const fallbackType = 
                                vendorGlobalData?.types?.find((t: any) => t._id === pt.lensTypeId) ||
                                adminGlobalData?.types?.find((t: any) => t._id === pt.lensTypeId);
                            typeInfo = fallbackType || { _id: pt.lensTypeId, name: 'Lens Type' };
                        }
                        return {
                            ...typeInfo,
                            skipPackages: pt.skipPackages || false,
                            allowPackages: typeInfo?.allowPackages !== false,
                            skipPowerEntry: typeInfo?.skipPowerEntry === true
                        };
                    })
                    .filter((type: any) => type && type._id);

                // Map packages with their lensTypeId for filtering
                const allProductPackages = productLensTypes.flatMap((pt: any) => {
                    const ptId = pt.lensTypeId?._id || pt.lensTypeId;
                    return (pt.packages || []).map((pkg: any) => ({
                        ...pkg,
                        lensTypeId: ptId,
                        _id: pkg._id || `pkg-${Math.random()}`
                    }));
                });

                setLensTypes(enabledTypes);
                setLensPackages(allProductPackages);
            } else {
                // Legacy System (Global defaults for vendor)
                console.log("Product has no custom lens types, falling back to vendor defaults");
                const data = await lens.getPublic(vendorId);
                const types = (data.types || []).map((t: any) => ({
                    ...t,
                    skipPowerEntry: t.skipPowerEntry === true
                }));
                setLensTypes(types);
                setLensPackages(data.packages || []);
            }
        } catch (error) {
            console.error("Failed to fetch lens data:", error);
        } finally {
            setLoading(false);
        }
    }

    const currentPackages = lensPackages.filter(p => {
        const pkgTypeId = p.lensTypeId?._id || p.lensTypeId;
        const selTypeId = selectedType?._id;
        return pkgTypeId === selTypeId;
    });
    const isFrameOnly = selectedType?.name?.toLowerCase().includes("frame only") || selectedType?.skipPowerEntry;

    const getStepTitle = () => {
        if (step === 2) return "Choose Lens Package";
        if (step === 3) return "Eye Power";
        return "Select Lens Type";
    };

    const canContinue = () => {
        if (step === 1) return !!selectedType;
        if (step === 2) return !!selectedPackage;
        if (step === 3) {
            if (powerOption === 'later') return true;
            if (powerOption === 'manual') {
                if (!showPrescriptionForm) return true;
                return !!(prescription?.customerName && prescription?.customerPhone && prescription?.od?.sph && prescription?.os?.sph);
            }
            return !!powerOption;
        }
        return false;
    };

    const getContinueLabel = () => {
        if (step === 3) {
            if (powerOption === 'later') return "Place Order →";
            if (powerOption === 'manual' && showPrescriptionForm) return "Save & Proceed";
            if (powerOption === 'manual') return "Enter Power →";
        }
        if (isFrameOnly && step === 1) return "Confirm – Frame Only";
        return "Continue";
    };

    const handleTypeSelect = (type: any) => {
        setSelectedType(type);
        setSelectedPackage(null);

        // Find packages for this specific type to decide if we skip Step 2
        const typePackages = lensPackages.filter(p => {
            const pkgTypeId = p.lensTypeId?._id || p.lensTypeId;
            const selTypeId = type._id;
            return String(pkgTypeId) === String(selTypeId);
        });

        // Skip Logic (Automatic):
        // 1. If NO packages exist for this type in the product configuration
        // 2. OR if skipPackages is explicitly ON in Admin for this product
        // 3. OR if allowPackages is globally OFF for this category
        if (typePackages.length === 0 || type.skipPackages || type.allowPackages === false) {
            console.log(`Skipping package selection for: ${type.name} (Package count: ${typePackages.length})`);

            // Check if we should ALSO skip Step 3 (Eye Power)
            const shouldSkipPower = type.name?.toLowerCase().includes("zero") || type.skipPowerEntry;

            if (shouldSkipPower) {
                onSelect({
                    type,
                    package: null,
                    prescription: null
                });
                onClose();
            } else {
                // If it's a prescription lens but has no "Packages", we go directly to Step 3
                setStep(3);
            }
        } else {
            // Proceed to Step 2: Choose Lenses
            setStep(2);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (isFrameOnly) {
                // Skip lens package + prescription for frame only
                onSelect({ type: selectedType, package: null, prescription: null });
                onClose();
            } else {
                setStep(2);
            }
        } else if (step === 2) {
            const isZeroPower = selectedType?.name?.toLowerCase().includes("zero") || selectedType?.skipPowerEntry;
            if (isZeroPower) {
                // Skip eye power step if it's a zero power lens OR admin explicitly set skipPowerEntry
                onSelect({ type: selectedType, package: selectedPackage, prescription: null });
                onClose();
            } else {
                setStep(3);
            }
        } else if (step === 3) {
            if (powerOption === 'later') {
                onSelect({ type: selectedType, package: selectedPackage, prescription: null });
                onClose();
            } else if (powerOption === 'manual') {
                if (!showPrescriptionForm) {
                    setShowPrescriptionForm(true);
                } else {
                    onSelect({ type: selectedType, package: selectedPackage, prescription });
                    onClose();
                }
            }
        }
    };

    const handleBack = () => {
        if (showPrescriptionForm) {
            setShowPrescriptionForm(false);
        } else if (step > 1) {
            setStep((step - 1) as 1 | 2 | 3);
        }
    };

    // Lens type SVGs
    const lensTypeSVGs: Record<string, JSX.Element> = {
        default: (
            <svg viewBox="0 0 60 44" fill="none" width="52">
                <circle cx="17" cy="22" r="13" stroke="#888" strokeWidth="2.2" fill="rgba(210,230,255,0.3)" />
                <circle cx="43" cy="22" r="13" stroke="#888" strokeWidth="2.2" fill="rgba(210,230,255,0.3)" />
                <text x="10" y="26" fontSize="9" fill="#888" fontFamily="sans-serif">-/+</text>
            </svg>
        ),
        zero: (
            <svg viewBox="0 0 60 44" fill="none" width="52">
                <circle cx="17" cy="22" r="13" stroke="#4a9eff" strokeWidth="2.2" fill="rgba(147,197,253,0.22)" />
                <circle cx="43" cy="22" r="13" stroke="#4a9eff" strokeWidth="2.2" fill="rgba(147,197,253,0.22)" />
                <circle cx="17" cy="22" r="5" fill="rgba(96,165,250,0.28)" />
                <circle cx="43" cy="22" r="5" fill="rgba(96,165,250,0.28)" />
            </svg>
        ),
        progressive: (
            <svg viewBox="0 0 60 44" fill="none" width="52">
                <circle cx="17" cy="22" r="13" stroke="#aaa" strokeWidth="2.2" fill="rgba(220,220,240,0.3)" />
                <circle cx="43" cy="22" r="13" stroke="#aaa" strokeWidth="2.2" fill="rgba(220,220,240,0.3)" />
                <line x1="6" y1="22" x2="27" y2="22" stroke="#bbb" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="33" y1="22" x2="54" y2="22" stroke="#bbb" strokeWidth="1" strokeDasharray="3 2" />
            </svg>
        ),
        frame: (
            <svg viewBox="0 0 60 44" fill="none" width="52">
                <circle cx="17" cy="22" r="13" stroke="#ccc" strokeWidth="2.2" fill="rgba(240,240,240,0.2)" />
                <circle cx="43" cy="22" r="13" stroke="#ccc" strokeWidth="2.2" fill="rgba(240,240,240,0.2)" />
            </svg>
        ),
    };

    const getLensTypeSVGKey = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("zero") || n.includes("blu")) return "zero";
        if (n.includes("progressive") || n.includes("bifocal")) return "progressive";
        if (n.includes("frame")) return "frame";
        return "default";
    };

    const getLensTypeBg = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("zero") || n.includes("blu")) return "radial-gradient(circle at 40% 40%,#e0f2fe,#f0f8ff)";
        if (n.includes("progressive") || n.includes("bifocal")) return "radial-gradient(circle at 40% 40%,#f0f0f8,#f5f5f5)";
        if (n.includes("frame")) return "#f5f5f5";
        return "radial-gradient(circle at 40% 40%,#fffde7,#f0f0f0)";
    };

    const getLensTypeBadge = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("zero") || n.includes("blu")) return { text: "BLU Screen lenses", bg: "#dbeafe", color: "#1e40af" };
        if (!n.includes("progressive") && !n.includes("frame")) return { text: "Most common", bg: "#fff3cd", color: "#92400a" };
        return null;
    };

    // Lens package SVG visuals
    const pkgSVGs = [
        // Anti-glare style
        <svg key="1" viewBox="0 0 82 68" fill="none">
            <ellipse cx="41" cy="34" rx="36" ry="28" fill="rgba(220,230,245,0.5)" stroke="#ccc" strokeWidth="1.5" />
            <ellipse cx="41" cy="34" rx="28" ry="20" fill="rgba(200,215,235,0.4)" />
            <line x1="18" y1="20" x2="55" y2="48" stroke="#b0c4de" strokeWidth="1.2" opacity={0.7} />
            <line x1="24" y1="16" x2="62" y2="44" stroke="#b0c4de" strokeWidth="1" opacity={0.5} />
        </svg>,
        // BLU screen style
        <svg key="2" viewBox="0 0 82 68" fill="none">
            <ellipse cx="41" cy="34" rx="36" ry="28" fill="rgba(200,230,255,0.5)" stroke="#99c5e8" strokeWidth="1.5" />
            <ellipse cx="41" cy="34" rx="28" ry="20" fill="rgba(180,215,245,0.45)" />
            <line x1="18" y1="20" x2="55" y2="48" stroke="#7bb8e8" strokeWidth="1.2" opacity={0.7} />
            <line x1="24" y1="16" x2="62" y2="44" stroke="#7bb8e8" strokeWidth="1" opacity={0.55} />
        </svg>,
        // HD style
        <svg key="3" viewBox="0 0 82 68" fill="none">
            <ellipse cx="41" cy="34" rx="36" ry="28" fill="rgba(235,235,250,0.6)" stroke="#c5c5d8" strokeWidth="1.5" />
            <ellipse cx="41" cy="34" rx="28" ry="20" fill="rgba(220,220,245,0.4)" />
            <line x1="15" y1="34" x2="67" y2="34" stroke="#aaa" strokeWidth="1.5" strokeDasharray="4 3" />
        </svg>,
    ];

    const renderIcon = (iconName: string, className?: string) => {
        const icons: Record<string, any> = { Zap, Shield, Eye, Waves, Sun, Droplets, Award, Sparkles, Check };
        const IconComp = icons[iconName] || Zap;
        return <IconComp className={className || "w-4 h-4 text-blue-500"} />;
    };

    const getPkgBanner = (pkg: any, index: number) => {
        if (pkg.name?.toLowerCase().includes("blu") || pkg.name?.toLowerCase().includes("screen")) {
            return { label: "✦ Screen Friendly", bg: "#00b9a8" };
        }
        if (index === 1 || pkg.name?.toLowerCase().includes("popular") || pkg.name?.toLowerCase().includes("premium")) {
            return { label: "🏆 Most Popular", bg: "#f59e0b" };
        }
        return null;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-[99]"
                style={{ transition: "opacity 0.3s" }}
                onClick={onClose}
            />

            {/* Sidebar Drawer */}
            <div
                className="fixed top-0 right-0 w-[490px] max-w-full h-screen bg-white z-[100] flex flex-col shadow-2xl"
                style={{ transform: "translateX(0)", animation: "slideInRight 0.35s cubic-bezier(.4,0,.2,1)" }}
            >
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                    .ep-card-selected { border-color: #00b9a8 !important; box-shadow: 0 3px 14px rgba(0,185,168,0.14); }
                    .lp-card-selected { border-color: #00b9a8 !important; box-shadow: 0 3px 16px rgba(0,185,168,0.15); }
                    .lc-selected { border-color: #00b9a8 !important; box-shadow: 0 2px 14px rgba(0,185,168,0.14); }
                    .drawer-active { transform: translateY(0) !important; opacity: 1 !important; visibility: visible !important; }
                `}</style>

                {/* Header */}
                <div className="flex items-center gap-2 px-5 pt-5 pb-0 flex-shrink-0">
                    <button
                        onClick={handleBack}
                        style={{ visibility: step > 1 || showPrescriptionForm ? 'visible' : 'hidden' }}
                        className="flex items-center gap-1 text-sm text-slate-700 font-medium bg-none border-none cursor-pointer px-0 hover:opacity-70 transition-opacity"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="flex-1 text-center font-bold text-[1.05rem] text-slate-900">{getStepTitle()}</div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="flex px-6 pt-5 pb-0 gap-0 flex-shrink-0">
                    {(() => {
                        const isPowerEntrySkipped = selectedType?.skipPowerEntry
                            || selectedType?.name?.toLowerCase().includes("zero")
                            || selectedType?.name?.toLowerCase().includes("frame only");

                        const steps = [
                            { n: 1, label: "Power Type" },
                            { n: 2, label: "Lenses" },
                            ...(!isPowerEntrySkipped ? [{ n: 3, label: "Add Power" }] : [])
                        ];

                        return steps.map((s, i) => (
                            <div key={s.n} className="flex flex-col items-center gap-1 flex-1 relative">
                                {i < steps.length - 1 && (
                                    <div className="absolute top-[14px] left-[58%] w-[84%] h-0.5 z-0" style={{ background: step > s.n ? '#00b9a8' : '#e5e7eb' }} />
                                )}
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 transition-all"
                                    style={{
                                        background: step === s.n ? '#0f1e3c' : step > s.n ? '#00b9a8' : '#fff',
                                        borderColor: step === s.n ? '#0f1e3c' : step > s.n ? '#00b9a8' : '#e5e7eb',
                                        color: step >= s.n ? '#fff' : '#6b7280',
                                    }}
                                >
                                    {step > s.n ? '✓' : s.n}
                                </div>
                                <span className="text-[0.68rem] font-semibold text-center whitespace-nowrap" style={{ color: step === s.n ? '#0f1e3c' : '#6b7280', fontWeight: step === s.n ? 700 : 600 }}>
                                    {s.label}
                                </span>
                                <div className="h-0.5 w-full" style={{ background: step === s.n ? '#00b9a8' : 'transparent', marginTop: 2 }} />
                            </div>
                        ));
                    })()}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2" style={{ scrollbarWidth: 'thin' }}>

                    {/* STEP 1: Power Type */}
                    {step === 1 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[.95rem] font-bold text-slate-900">Select your Power Type:</h2>
                            </div>

                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
                                </div>
                            ) : lensTypes.length > 0 ? (
                                <div className="space-y-3">
                                    {lensTypes.map((type) => {
                                        const badge = getLensTypeBadge(type.name);
                                        const svgKey = getLensTypeSVGKey(type.name);
                                        const bg = getLensTypeBg(type.name);
                                        const isSelected = selectedType?._id === type._id;
                                        return (
                                            <div
                                                key={type._id}
                                                onClick={() => handleTypeSelect(type)}
                                                className={`flex items-center gap-4 px-4 py-4 border-[1.5px] rounded-xl cursor-pointer transition-all bg-white lc-card shadow-sm hover:shadow-md ${isSelected ? 'lc-selected' : 'border-slate-100 hover:border-slate-300'}`}
                                                style={{ borderColor: isSelected ? '#00b9a8' : undefined, borderWidth: isSelected ? '2px' : '1.5px' }}
                                            >
                                                <div className="w-[70px] h-[52px] rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-50" style={{ background: bg }}>
                                                    {type.imageUrl ? (
                                                        <img src={getImageUrl(type.imageUrl)} className="w-full h-full object-contain p-1" alt={type.name} />
                                                    ) : (
                                                        <div className="scale-110">{lensTypeSVGs[svgKey]}</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="text-[1rem] font-bold text-slate-800 tracking-tight">{type.name}</span>
                                                        {badge && (
                                                            <span className="text-[.62rem] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider" style={{ background: badge.bg, color: badge.color }}>
                                                                {badge.text}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {type.description && (
                                                        <div className="text-[.82rem] text-slate-500 leading-snug">
                                                            <p className="opacity-80">{type.description}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // Fallback static cards when no lens types from API
                                <div className="space-y-3">
                                    {[
                                        { key: 'with', name: 'With Power', desc: 'Positive, Negative or Cylindrical', svgKey: 'default', bg: 'radial-gradient(circle at 40% 40%,#fffde7,#f0f0f0)', badge: { text: 'Most common', bg: '#fff3cd', color: '#92400a' } },
                                        { key: 'zero', name: 'Zero Power', desc: 'Blue light block for screen protection', svgKey: 'zero', bg: 'radial-gradient(circle at 40% 40%,#e0f2fe,#f0f8ff)', badge: { text: 'BLU Screen lenses', bg: '#dbeafe', color: '#1e40af' } },
                                        { key: 'progressive', name: 'Progressive / Bifocals', desc: 'Two powers in one eye', svgKey: 'progressive', bg: 'radial-gradient(circle at 40% 40%,#f0f0f8,#f5f5f5)', badge: null },
                                        { key: 'frame', name: 'Frame Only', desc: 'With no lenses', svgKey: 'frame', bg: '#f5f5f5', badge: null },
                                    ].map(t => {
                                        const isSelected = selectedType?.key === t.key;
                                        return (
                                            <div
                                                key={t.key}
                                                onClick={() => handleTypeSelect({ _id: t.key, key: t.key, name: t.name, description: t.desc })}
                                                className="flex items-center gap-3.5 px-4 py-3.5 border-[1.5px] rounded-xl cursor-pointer transition-all bg-white"
                                                style={{ borderColor: isSelected ? '#00b9a8' : '#e5e7eb', boxShadow: isSelected ? '0 2px 14px rgba(0,185,168,0.14)' : undefined }}
                                            >
                                                <div className="w-[62px] h-[46px] rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: t.bg }}>
                                                    {lensTypeSVGs[t.svgKey]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                        <span className="text-[.9rem] font-bold text-slate-900">{t.name}</span>
                                                        {t.badge && (
                                                            <span className="text-[.66rem] font-bold px-2 py-0.5 rounded-full" style={{ background: t.badge.bg, color: t.badge.color }}>{t.badge.text}</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[.78rem] text-slate-500">{t.desc}</div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: Lens Packages */}
                    {step === 2 && (
                        <div>
                            {/* Filter tabs removed for truly dynamic experience */}

                            {currentPackages.length > 0 ? (
                                <div className="space-y-3.5">
                                    {currentPackages.map((pkg, index) => {
                                        const isSelected = selectedPackage?._id === pkg._id;
                                        const banner = getPkgBanner(pkg, index);
                                        const svgEl = pkgSVGs[index % pkgSVGs.length];
                                        return (
                                            <div
                                                key={pkg._id}
                                                onClick={() => setSelectedPackage(pkg)}
                                                className="border-[1.5px] rounded-2xl overflow-hidden cursor-pointer transition-all bg-white"
                                                style={{ borderColor: isSelected ? '#00b9a8' : '#e5e7eb', boxShadow: isSelected ? '0 3px 16px rgba(0,185,168,0.15)' : undefined }}
                                            >
                                                {banner && (
                                                    <div className="text-[.67rem] font-bold px-3.5 py-1.5 uppercase tracking-wider" style={{ background: banner.bg, color: '#fff' }}>
                                                        {banner.label}
                                                    </div>
                                                )}
                                                <div className="flex">
                                                    {/* Left image col */}
                                                    <div className="w-[108px] flex-shrink-0 py-3.5 px-2.5 flex flex-col items-center gap-2 border-r border-slate-100">
                                                        <div className="w-[82px] h-[68px] relative">
                                                            {pkg.imageUrl ? (
                                                                <img src={getImageUrl(pkg.imageUrl)} className="w-full h-full object-contain" />
                                                            ) : (
                                                                <>
                                                                    {svgEl}
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <div className="w-7 h-7 bg-black/55 rounded-full flex items-center justify-center">
                                                                            <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><polygon points="0,0 10,6 0,12" /></svg>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="text-[.64rem] text-slate-400 text-center leading-tight">
                                                            🛡️ {pkg.warranty || '6 Months'} Warranty
                                                        </div>
                                                    </div>

                                                    {/* Right info col */}
                                                    <div className="flex-1 p-3.5">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="text-[.93rem] font-bold text-slate-900 leading-snug">{pkg.name}</div>
                                                            <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                                                                <ChevronRight className="w-3 h-3 text-white" />
                                                            </div>
                                                        </div>

                                                        {/* Features (Derived from Detailed Benefits) */}
                                                        <div className="flex flex-col gap-1 mb-2">
                                                            {((pkg.detailedFeatures?.map((df: any) => df.title)) || [pkg.description]).filter(Boolean).slice(0, 3).map((f: string, fi: number) => (
                                                                <div key={fi} className="text-[.76rem] text-slate-600 flex items-center gap-1.5">
                                                                    <div className="w-1 h-1 rounded-full bg-slate-300" /> {f}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="text-[.76rem] text-teal-600 font-semibold flex items-center gap-1 mb-2.5 cursor-pointer hover:underline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActivePackageDetails(pkg);
                                                            }}
                                                        >
                                                            View Details <ChevronRight className="w-3 h-3" />
                                                        </div>

                                                        {/* Pricing */}
                                                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200 flex-wrap gap-1">
                                                            <div className="text-[.73rem] text-slate-400">
                                                                {pkg.couponCode ? <>Coupon : <strong className="text-slate-700">{pkg.couponCode}</strong></> : 'Total (Frame + Lens)'}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[.65rem] text-slate-500 mb-0.5 font-medium">₹{framePrice} + ₹{pkg.price}</div>
                                                                <div className="flex items-baseline gap-1.5">
                                                                    <span className="text-[.93rem] font-black text-slate-900 tracking-tight">₹{framePrice + pkg.price}</span>
                                                                    {pkg.originalPrice && <span className="text-[.78rem] text-slate-400 line-through">₹{framePrice + pkg.originalPrice}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // Graceful empty state when no packages found for specific selection
                                <div className="text-center py-12 px-6">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                                        <Layers className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold mb-1">No Packages Available</h3>
                                    <p className="text-slate-500 text-sm">We couldn't find any lens packages for the selected type. Please check back later.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: Eye Power */}
                    {step === 3 && !showPrescriptionForm && (
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-[1.3rem] font-bold text-slate-900">Enter power manually</h2>
                                <a className="text-[.8rem] text-teal-600 font-semibold cursor-pointer flex items-center gap-0.5 hover:underline" onClick={() => window.open('tel:+918470007367')}>
                                    Help? <ChevronRight className="w-3.5 h-3.5" />
                                </a>
                            </div>


                            <div
                                onClick={() => { setPowerOption('manual'); }}
                                className="flex items-center border-[1.5px] rounded-xl overflow-hidden cursor-pointer bg-white transition-all"
                                style={{ borderColor: powerOption === 'manual' ? '#00b9a8' : '#e5e7eb', boxShadow: powerOption === 'manual' ? '0 3px 14px rgba(0,185,168,0.14)' : undefined }}
                            >
                                <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#e8f0f8,#d0e0f0)' }}>
                                    <svg viewBox="0 0 72 72" fill="none" width="72" height="72">
                                        <rect x="24" y="12" width="28" height="42" rx="5" fill="#fff" stroke="#ccc" strokeWidth="1.5" />
                                        <rect x="27" y="16" width="22" height="30" rx="2" fill="#e8f4ff" />
                                        <line x1="30" y1="21" x2="46" y2="21" stroke="#a0c0e0" strokeWidth="1.5" />
                                        <line x1="30" y1="26" x2="46" y2="26" stroke="#a0c0e0" strokeWidth="1.5" />
                                        <line x1="30" y1="31" x2="40" y2="31" stroke="#a0c0e0" strokeWidth="1.5" />
                                        <path d="M20 52 Q18 48 22 44 L50 44 Q54 44 54 48 L54 56 Q54 60 50 60 L26 60 Q22 60 20 56 Z" fill="#d4a574" />
                                    </svg>
                                </div>
                                <div className="flex-1 px-3 py-3.5">
                                    <div className="text-[.88rem] font-bold text-slate-900 mb-0.5">Enter Power Manually</div>
                                    <div className="text-[.76rem] text-slate-500">Input your latest eye prescription</div>
                                </div>
                                <div className="px-3.5">
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prescription Form (shown after selecting "Enter Manually") */}
                    {step === 3 && showPrescriptionForm && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[1.3rem] font-bold text-slate-900">Enter power manually</h2>
                            </div>
                            <PrescriptionForm onPrescriptionChange={setPrescription} initialData={prescription} />
                        </div>
                    )}
                </div>

                {/* Footer CTA */}
                <div className="px-5 py-4 border-t border-slate-200 flex-shrink-0">
                    <button
                        onClick={handleNext}
                        disabled={!canContinue()}
                        className="w-full py-3.5 rounded-xl text-[.9rem] font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: '#0f1e3c' }}
                    >
                        {getContinueLabel()}
                    </button>
                </div>

                {/* SLIDE-UP DRAWER (View Details) */}
                <div
                    className={`fixed inset-0 bg-black/40 z-[110] transition-opacity duration-300 ${activePackageDetails ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                    onClick={() => setActivePackageDetails(null)}
                >
                    <div
                        className={`absolute bottom-0 left-0 right-0 max-h-[92%] bg-white rounded-t-[2rem] overflow-hidden flex flex-col transition-all duration-500 transform translate-y-full ${activePackageDetails ? 'drawer-active' : ''}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="w-full py-3 flex justify-center">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                        </div>

                        {/* Drawer content */}
                        {activePackageDetails && (
                            <div className="flex-1 overflow-y-auto px-6 pb-24">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-[1.3rem] font-bold text-slate-900 pr-8">{activePackageDetails.name}</h3>
                                    <button
                                        onClick={() => setActivePackageDetails(null)}
                                        className="p-1 px-1.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Banner/Hero Image inside drawer if available */}
                                {activePackageDetails.imageUrl && (
                                    <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden mb-6">
                                        <img src={getImageUrl(activePackageDetails.imageUrl)} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* Top Benefits (Icon list) */}
                                {activePackageDetails.benefits && activePackageDetails.benefits.length > 0 && (
                                    <div className="mb-8">
                                        <h4 className="text-[.9rem] font-bold text-slate-500 uppercase tracking-widest mb-4">Top Benefits</h4>
                                        <div className="space-y-4">
                                            {activePackageDetails.benefits.map((b: string, i: number) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                                        {renderIcon(i === 0 ? 'Zap' : i === 1 ? 'Shield' : 'Award', "w-5 h-5 text-blue-600")}
                                                    </div>
                                                    <span className="text-[.95rem] font-semibold text-slate-700">{b}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Detailed Features (Image list) */}
                                {activePackageDetails.detailedFeatures && activePackageDetails.detailedFeatures.length > 0 && (
                                    <div className="mt-8">
                                        <h4 className="text-[.9rem] font-bold text-slate-500 uppercase tracking-widest mb-5">Features</h4>
                                        <div className="space-y-6">
                                            {activePackageDetails.detailedFeatures.map((feat: any, i: number) => (
                                                <div key={i} className="flex gap-5 items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-colors hover:bg-white hover:shadow-sm">
                                                    <div className="w-24 h-18 bg-slate-200 rounded-xl overflow-hidden shrink-0 shadow-sm">
                                                        {feat.image ? (
                                                            <img src={getImageUrl(feat.image)} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                                                {renderIcon(feat.icon || 'ImageIcon', "w-8 h-8")}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-[.95rem] font-bold text-slate-900 mb-1 leading-tight flex items-center gap-2">
                                                            {feat.icon && renderIcon(feat.icon, "w-4 h-4 text-blue-500")}
                                                            {feat.title}
                                                        </div>
                                                        <p className="text-[.82rem] text-slate-500 leading-snug">{feat.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bottom Sticky Select Button in Drawer */}
                        {activePackageDetails && (
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent border-t border-slate-100 flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[.7rem] text-slate-500 font-bold uppercase tracking-wider">₹{framePrice} Frame + ₹{activePackageDetails.price} Lens</span>
                                    <span className="text-[1.3rem] font-black text-slate-900">₹{framePrice + activePackageDetails.price}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedPackage(activePackageDetails);
                                        setActivePackageDetails(null);
                                    }}
                                    className="flex-1 max-w-[240px] py-4 bg-[#0f1e3c] text-white rounded-2xl font-bold text-[1rem] shadow-lg shadow-blue-900/10 active:scale-95 transition-all"
                                >
                                    Select This Lens
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LensSelectionModal;
