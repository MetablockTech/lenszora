import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Zap, Shield, Eye, Waves, Sun, Droplets, Award, Sparkles, Check, Layers, Upload, MessageCircle, FileText, PhoneCall, Image as ImageIcon } from "lucide-react";
import { lens, API_URL, returnRequests, getToken } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
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
    const [powerOption, setPowerOption] = useState<'later' | 'manual' | 'upload' | null>(null);
    const [prescription, setPrescription] = useState<any>(null);
    const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
    const [prescriptionFileName, setPrescriptionFileName] = useState<string | null>(null);
    const [uploadingPrescription, setUploadingPrescription] = useState(false);
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
                    if (initialData.prescription.method === 'later') {
                        setPowerOption('later');
                    } else if (initialData.prescription.method === 'upload') {
                        setPowerOption('upload');
                        setPrescriptionImage(initialData.prescription.image || null);
                        setPrescriptionFileName(initialData.prescription.fileName || null);
                    } else {
                        setPowerOption('manual');
                    }
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
                setPrescriptionImage(null);
                setPrescriptionFileName(null);
                setShowPrescriptionForm(false);
            }
        }
    }, [isOpen, vendorId, product, initialData]);

const DEFAULT_FALLBACK_TYPES = [
    { _id: 'with', key: 'with', name: 'With Power', description: 'Positive, Negative or Cylindrical', allowPackages: true },
    { _id: 'zero', key: 'zero', name: 'Zero Power', description: 'Blue light block for screen protection', allowPackages: true },
    { _id: 'reading', key: 'reading', name: 'Reading Power', description: 'With power for near vision only', allowPackages: true },
    { _id: 'progressive', key: 'progressive', name: 'Progressive / Bifocals', description: 'Two powers in one eye', allowPackages: true },
    { _id: 'frame', key: 'frame', name: 'Frame Only', description: 'With no lenses', allowPackages: false, skipPowerEntry: true }
];

const DEFAULT_FALLBACK_PACKAGES = [
    // Packages for 'with' (With Power)
    { _id: 'pkg-with-1', lensTypeId: 'with', name: 'Standard Anti-Glare Lens', price: 499, originalPrice: 999, description: 'Anti-reflective coating, Scratch resistant', warranty: '6 Months' },
    { _id: 'pkg-with-2', lensTypeId: 'with', name: 'Blu Cut Screen Protect Lens', price: 999, originalPrice: 1999, description: 'Blue light filter, UV400 Protection, Anti-glare', warranty: '1 Year' },
    { _id: 'pkg-with-3', lensTypeId: 'with', name: 'Ultra Thin HD Anti-Reflective Lens', price: 1499, originalPrice: 2999, description: 'Super hydrophobic, Ultra lightweight 1.61 index', warranty: '1 Year' },

    // Packages for 'zero' (Zero Power)
    { _id: 'pkg-zero-1', lensTypeId: 'zero', name: 'Blu Cut Computer Screen Glasses', price: 499, originalPrice: 999, description: 'Blocks harmful digital screen blue light', warranty: '6 Months' },
    { _id: 'pkg-zero-2', lensTypeId: 'zero', name: 'Premium Anti-Glare Zero Power Lens', price: 899, originalPrice: 1499, description: 'Dust & smudge resistant, Zero distortion view', warranty: '1 Year' },

    // Packages for 'reading' (Reading Power)
    { _id: 'pkg-reading-1', lensTypeId: 'reading', name: 'Standard Reading Lens', price: 399, originalPrice: 799, description: 'Near vision reading clarity', warranty: '6 Months' },
    { _id: 'pkg-reading-2', lensTypeId: 'reading', name: 'Anti-Glare Reading Lens', price: 799, originalPrice: 1299, description: 'Anti-reflective near vision reading lens', warranty: '1 Year' },

    // Packages for 'progressive' (Progressive / Bifocal)
    { _id: 'pkg-prog-1', lensTypeId: 'progressive', name: 'Standard Bifocal Lens (Kryptok)', price: 1299, originalPrice: 2499, description: 'Distance & near vision dual segment', warranty: '6 Months' },
    { _id: 'pkg-prog-2', lensTypeId: 'progressive', name: 'No-Line Seamless Progressive Lens', price: 2499, originalPrice: 4999, description: 'Smooth transition, wide corridor digital progressive', warranty: '1 Year' }
];

    async function fetchLensData() {
        try {
            setLoading(true);
            const productLensTypes = product?.lensSettings?.lensTypes || [];

            if (productLensTypes.length > 0) {
                console.log("Using product-specific lens types:", productLensTypes.length);

                const hasUnpopulatedTypes = productLensTypes.some((pt: any) => typeof pt.lensTypeId === 'string');
                let adminGlobalData: any = null;
                let vendorGlobalData: any = null;
                if (hasUnpopulatedTypes) {
                    try {
                        adminGlobalData = await lens.getPublic();
                        if (vendorId && typeof vendorId === 'string' && vendorId.length > 5) {
                             vendorGlobalData = await lens.getPublic(vendorId);
                        }
                    } catch (e) {
                        console.error("Fallback global lens fetch failed", e);
                    }
                }

                const enabledTypes = productLensTypes
                    .map((pt: any) => {
                        let typeInfo = pt.lensTypeId;
                        if (typeof pt.lensTypeId === 'string') {
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

                const allProductPackages = productLensTypes.flatMap((pt: any) => {
                    const ptId = pt.lensTypeId?._id || pt.lensTypeId;
                    return (pt.packages || []).map((pkg: any) => ({
                        ...pkg,
                        lensTypeId: ptId,
                        _id: pkg._id || `pkg-${Math.random()}`
                    }));
                });

                if (enabledTypes.length > 0) {
                    setLensTypes(enabledTypes);
                    setLensPackages(allProductPackages.length > 0 ? allProductPackages : DEFAULT_FALLBACK_PACKAGES);
                } else {
                    setLensTypes(DEFAULT_FALLBACK_TYPES);
                    setLensPackages(DEFAULT_FALLBACK_PACKAGES);
                }
            } else {
                let types: any[] = [];
                let packages: any[] = [];
                try {
                    const data = await lens.getPublic(vendorId);
                    types = (data.types || []).map((t: any) => ({
                        ...t,
                        skipPowerEntry: t.skipPowerEntry === true
                    }));
                    packages = data.packages || [];
                } catch (e) {
                    console.warn("Public lens fetch error, using fallback defaults", e);
                }

                if (types.length > 0) {
                    setLensTypes(types);
                    setLensPackages(packages.length > 0 ? packages : DEFAULT_FALLBACK_PACKAGES);
                } else {
                    setLensTypes(DEFAULT_FALLBACK_TYPES);
                    setLensPackages(DEFAULT_FALLBACK_PACKAGES);
                }
            }
        } catch (error) {
            console.error("Failed to fetch lens data, using default fallbacks:", error);
            setLensTypes(DEFAULT_FALLBACK_TYPES);
            setLensPackages(DEFAULT_FALLBACK_PACKAGES);
        } finally {
            setLoading(false);
        }
    }

    const currentPackages = lensPackages.filter(p => {
        const pkgTypeId = p.lensTypeId?._id || p.lensTypeId;
        const selTypeId = selectedType?._id || selectedType?.key;
        return String(pkgTypeId) === String(selTypeId);
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
            if (powerOption === 'upload') return !!prescriptionImage;
            if (powerOption === 'manual') {
                if (!showPrescriptionForm) return true;
                return !!(prescription?.customerName && prescription?.customerPhone && prescription?.od?.sph && prescription?.os?.sph);
            }
            return false;
        }
        return false;
    };

    const getContinueLabel = () => {
        if (step === 3) {
            if (powerOption === 'later') return "Submit Power Later & Proceed →";
            if (powerOption === 'upload') return "Use Uploaded Prescription →";
            if (powerOption === 'manual' && showPrescriptionForm) return "Save & Proceed";
            if (powerOption === 'manual') return "Enter Power Values →";
            return "Select Power Option";
        }
        if (isFrameOnly && step === 1) return "Confirm – Frame Only";
        return "Continue";
    };

    async function handlePrescriptionFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingPrescription(true);
            setPrescriptionFileName(file.name);

            let uploadedUrl = '';
            const token = getToken();
            if (token) {
                try {
                    const res = await returnRequests.uploadProof(file, token);
                    uploadedUrl = res.url || res.path || '';
                } catch (err) {
                    console.warn("Server upload failed, fallback to local file reader", err);
                }
            }

            if (!uploadedUrl) {
                uploadedUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            }

            setPrescriptionImage(uploadedUrl);
            setPowerOption('upload');
            toast({ title: "Prescription uploaded successfully", description: file.name });
        } catch (error: any) {
            console.error("Prescription upload error:", error);
            toast({ title: "Upload failed", description: error?.message || "Could not process file", variant: "destructive" });
        } finally {
            setUploadingPrescription(false);
        }
    }

    const handleTypeSelect = (type: any) => {
        setSelectedType(type);
        setSelectedPackage(null);

        // Find packages for this specific type to decide if we skip Step 2
        const typePackages = lensPackages.filter(p => {
            const pkgTypeId = p.lensTypeId?._id || p.lensTypeId;
            const selTypeId = type._id || type.key;
            return String(pkgTypeId) === String(selTypeId);
        });

        // Skip Logic (Automatic):
        // 1. If NO packages exist for this type in the product configuration
        // 2. OR if skipPackages is explicitly ON in Admin for this product
        // 3. OR if allowPackages is globally OFF for this category
        if (typePackages.length === 0 || type.skipPackages || type.allowPackages === false) {
            console.log(`Skipping package selection for: ${type.name} (Package count: ${typePackages.length})`);

            // Check if we should ALSO skip Step 3 (Eye Power)
            const shouldSkipPower = type.name?.toLowerCase().includes("zero") || type.name?.toLowerCase().includes("frame only") || type.skipPowerEntry;

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
                onSelect({
                    type: selectedType,
                    package: selectedPackage,
                    prescription: {
                        method: 'later',
                        text: 'Submit Power Later (WhatsApp / Call after order)'
                    }
                });
                onClose();
            } else if (powerOption === 'upload') {
                onSelect({
                    type: selectedType,
                    package: selectedPackage,
                    prescription: {
                        method: 'upload',
                        image: prescriptionImage,
                        fileName: prescriptionFileName,
                        text: `Uploaded Prescription (${prescriptionFileName || 'Image/PDF'})`
                    }
                });
                onClose();
            } else if (powerOption === 'manual') {
                if (!showPrescriptionForm) {
                    setShowPrescriptionForm(true);
                } else {
                    onSelect({
                        type: selectedType,
                        package: selectedPackage,
                        prescription: {
                            ...prescription,
                            method: 'manual'
                        }
                    });
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
        reading: (
            <svg viewBox="0 0 60 44" fill="none" width="52">
                <circle cx="17" cy="22" r="13" stroke="#f97316" strokeWidth="2.2" fill="rgba(255,237,213,0.3)" />
                <circle cx="43" cy="22" r="13" stroke="#f97316" strokeWidth="2.2" fill="rgba(255,237,213,0.3)" />
                <text x="9" y="26" fontSize="9" fontWeight="bold" fill="#ea580c" fontFamily="sans-serif">+1.00</text>
                <text x="35" y="26" fontSize="9" fontWeight="bold" fill="#ea580c" fontFamily="sans-serif">+1.00</text>
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
        if (n.includes("reading")) return "reading";
        if (n.includes("progressive") || n.includes("bifocal")) return "progressive";
        if (n.includes("frame")) return "frame";
        return "default";
    };

    const getLensTypeBg = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("zero") || n.includes("blu")) return "radial-gradient(circle at 40% 40%,#e0f2fe,#f0f8ff)";
        if (n.includes("reading")) return "radial-gradient(circle at 40% 40%,#fff7ed,#fff0e6)";
        if (n.includes("progressive") || n.includes("bifocal")) return "radial-gradient(circle at 40% 40%,#f0f0f8,#f5f5f5)";
        if (n.includes("frame")) return "#f5f5f5";
        return "radial-gradient(circle at 40% 40%,#fffde7,#f0f0f0)";
    };

    const getLensTypeBadge = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("zero") || n.includes("blu")) return { text: "BLU Screen lenses", bg: "#dbeafe", color: "#1e40af" };
        if (n.includes("reading")) return { text: "Near Vision", bg: "#ffedd5", color: "#c2410c" };
        if (!n.includes("progressive") && !n.includes("frame") && !n.includes("reading")) return { text: "Most common", bg: "#fff3cd", color: "#92400a" };
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
                                        { key: 'reading', name: 'Reading Power', desc: 'With power for near vision only', svgKey: 'reading', bg: 'radial-gradient(circle at 40% 40%,#fff7ed,#fff0e6)', badge: { text: 'Near Vision', bg: '#ffedd5', color: '#c2410c' } },
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
                        <div className="space-y-3.5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h2 className="text-[1.1rem] font-bold text-slate-900">Add Eye Power</h2>
                                    <p className="text-[.78rem] text-slate-500">Choose how you want to submit your prescription</p>
                                </div>
                                <a className="text-[.78rem] text-teal-600 font-semibold cursor-pointer flex items-center gap-0.5 hover:underline" onClick={() => window.open('https://wa.me/918470007367', '_blank')}>
                                    Need Help? <ChevronRight className="w-3.5 h-3.5" />
                                </a>
                            </div>

                            {/* Option 1: Submit Power Later (WhatsApp / Call) */}
                            <div
                                onClick={() => setPowerOption('later')}
                                className={`flex items-start gap-3.5 p-4 border-[1.5px] rounded-xl cursor-pointer bg-white transition-all ${powerOption === 'later' ? 'ep-card-selected border-teal-500 bg-teal-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    <MessageCircle className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5 flex-wrap gap-1">
                                        <span className="text-[.92rem] font-bold text-slate-900">Submit Power Later (WhatsApp / Call)</span>
                                        <span className="text-[.62rem] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">Fastest</span>
                                    </div>
                                    <div className="text-[.78rem] text-slate-500 leading-snug">
                                        Submit via WhatsApp or phone call after placing your order.
                                    </div>
                                    {powerOption === 'later' && (
                                        <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200/60 text-[.74rem] text-emerald-800 flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                            <span>Selected! We will contact you on WhatsApp / Call after checkout.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Option 2: Enter Power Manually */}
                            <div
                                onClick={() => setPowerOption('manual')}
                                className={`flex items-start gap-3.5 p-4 border-[1.5px] rounded-xl cursor-pointer bg-white transition-all ${powerOption === 'manual' ? 'ep-card-selected border-teal-500 bg-teal-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5 flex-wrap gap-1">
                                        <span className="text-[.92rem] font-bold text-slate-900">Enter Power Manually</span>
                                        {prescription?.od?.sph && (
                                            <span className="text-[.62rem] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase">Power Saved</span>
                                        )}
                                    </div>
                                    <div className="text-[.78rem] text-slate-500 leading-snug">
                                        Input your latest eye prescription values (SPH, CYL, AXIS, ADD & PD)
                                    </div>
                                    {powerOption === 'manual' && (
                                        <div className="mt-2.5">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowPrescriptionForm(true);
                                                }}
                                                className="px-3.5 py-1.5 rounded-lg bg-teal-600 text-white text-[.78rem] font-semibold flex items-center gap-1.5 hover:bg-teal-700 transition-colors shadow-sm"
                                            >
                                                {prescription?.od?.sph ? 'Edit Prescription Values' : 'Fill Prescription Form'} <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Option 3: Upload Prescription Photo / PDF */}
                            <div
                                onClick={() => setPowerOption('upload')}
                                className={`flex items-start gap-3.5 p-4 border-[1.5px] rounded-xl cursor-pointer bg-white transition-all ${powerOption === 'upload' ? 'ep-card-selected border-teal-500 bg-teal-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-purple-50 text-purple-600 border border-purple-100">
                                    <Upload className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5 flex-wrap gap-1">
                                        <span className="text-[.92rem] font-bold text-slate-900">Upload Prescription Photo / PDF</span>
                                        {prescriptionImage && (
                                            <span className="text-[.62rem] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">Uploaded</span>
                                        )}
                                    </div>
                                    <div className="text-[.78rem] text-slate-500 leading-snug">
                                        Upload image (JPG, PNG) or PDF document of prescription
                                    </div>

                                    {powerOption === 'upload' && (
                                        <div className="mt-3">
                                            {prescriptionImage ? (
                                                <div className="p-3 bg-white border border-purple-200 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-purple-100">
                                                            {prescriptionImage.endsWith('.pdf') ? (
                                                                <FileText className="w-5 h-5 text-purple-600" />
                                                            ) : (
                                                                <img src={getImageUrl(prescriptionImage)} className="w-full h-full object-cover" alt="Prescription" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-[.8rem] font-bold text-slate-800 truncate">
                                                                {prescriptionFileName || 'Prescription Document'}
                                                            </div>
                                                            <div className="text-[.7rem] text-teal-600 font-medium">Ready to use</div>
                                                        </div>
                                                    </div>
                                                    <label className="text-[.74rem] font-semibold text-purple-600 hover:text-purple-800 cursor-pointer px-2 py-1 bg-purple-50 rounded-md">
                                                        Change
                                                        <input type="file" accept="image/*,.pdf" onChange={handlePrescriptionFileUpload} className="hidden" />
                                                    </label>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-xl bg-purple-50/50 cursor-pointer transition-colors text-center">
                                                    {uploadingPrescription ? (
                                                        <div className="flex items-center gap-2 text-purple-600 text-[.82rem] font-medium py-1">
                                                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                                            Uploading prescription...
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-5 h-5 text-purple-500 mb-1" />
                                                            <span className="text-[.82rem] font-semibold text-purple-700">Click to upload photo or PDF</span>
                                                            <span className="text-[.7rem] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP, PDF (Max 10MB)</span>
                                                        </>
                                                    )}
                                                    <input type="file" accept="image/*,.pdf" onChange={handlePrescriptionFileUpload} disabled={uploadingPrescription} className="hidden" />
                                                </label>
                                            )}
                                        </div>
                                    )}
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
