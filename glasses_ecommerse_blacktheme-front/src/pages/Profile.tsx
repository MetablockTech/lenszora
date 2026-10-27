import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Phone, Mail, Calendar, Gift, ShoppingBag, MapPin, Heart, Edit, Copy, Check, X, Camera, Eye, Users, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { users, orders, addresses, products, getToken, getUser, setUser } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { useNavigate, Link } from "react-router-dom";
import { useWishlist } from "@/context/WishlistContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

type EyeKey = "sph" | "cyl" | "axis" | "add";

interface EyePower {
    sph?: number;
    cyl?: number;
    axis?: number;
    add?: number;
}

interface Prescription {
    right?: EyePower;
    left?: EyePower;
    pd?: number;
    prescribedOn?: string;
    notes?: string;
}

interface Profile {
    _id: string;
    name?: string;
    email?: string;
    phone: string;
    alternatePhone?: string;
    gender?: "male" | "female" | "other";
    dateOfBirth?: string;
    avatar?: string;
    prescription?: Prescription;
    role: string;
    referralCode?: string;
    referralCount?: number;
    referredByName?: string;
    createdAt: string;
}

type EyeForm = Record<EyeKey, string>;

const EYE_FIELDS: { key: EyeKey; label: string; step: string; min: number; max: number }[] = [
    { key: "sph", label: "SPH", step: "0.25", min: -25, max: 25 },
    { key: "cyl", label: "CYL", step: "0.25", min: -10, max: 10 },
    { key: "axis", label: "Axis", step: "1", min: 0, max: 180 },
    { key: "add", label: "Add", step: "0.25", min: 0, max: 4 }
];

const GENDER_LABELS: Record<string, string> = { male: "Male", female: "Female", other: "Other" };

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : "");

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";

const toEyeForm = (eye?: EyePower): EyeForm => ({
    sph: eye?.sph?.toString() ?? "",
    cyl: eye?.cyl?.toString() ?? "",
    axis: eye?.axis?.toString() ?? "",
    add: eye?.add?.toString() ?? ""
});

const formatPower = (key: EyeKey, value?: number) => {
    if (value === undefined || value === null) return "—";
    if (key === "axis") return `${value}°`;
    return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
};

const inputClass = "w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary";
const cardClass = "border border-border/30 rounded-xl p-6 bg-card shadow-md";

// Scale a profile photo down to at most 800px on its longest side (JPEG) so any size can be uploaded.
// Files the browser can't decode (e.g. some HEIC) are sent as they are.
const shrinkPhoto = async (file: File): Promise<File> => {
    if (file.size <= 500 * 1024 && file.type !== "image/heic") return file;
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
        if (!blob) return file;
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
        return file;
    }
};

const Profile = () => {
    const navigate = useNavigate();
    const { wishlistItems } = useWishlist();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [orderCount, setOrderCount] = useState(0);
    const [addressCount, setAddressCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editingDetails, setEditingDetails] = useState(false);
    const [editingPrescription, setEditingPrescription] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [copied, setCopied] = useState(false);
    const [detailsForm, setDetailsForm] = useState({
        name: "",
        email: "",
        alternatePhone: "",
        gender: "",
        dateOfBirth: ""
    });
    const [prescriptionForm, setPrescriptionForm] = useState({
        right: toEyeForm(),
        left: toEyeForm(),
        pd: "",
        prescribedOn: "",
        notes: ""
    });

    useEffect(() => {
        if (!getToken()) {
            navigate('/auth');
            return;
        }
        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function applyProfile(data: Profile) {
        setProfile(data);
        setDetailsForm({
            name: data.name || "",
            email: data.email || "",
            alternatePhone: data.alternatePhone || "",
            gender: data.gender || "",
            dateOfBirth: toDateInput(data.dateOfBirth)
        });
        setPrescriptionForm({
            right: toEyeForm(data.prescription?.right),
            left: toEyeForm(data.prescription?.left),
            pd: data.prescription?.pd?.toString() ?? "",
            prescribedOn: toDateInput(data.prescription?.prescribedOn),
            notes: data.prescription?.notes || ""
        });
    }

    async function loadProfile() {
        try {
            setLoading(true);
            const token = getToken();
            const data: Profile = await users.getMe(token);
            applyProfile(data);

            const [orderList, addressList] = await Promise.all([
                orders.listUserOrders(data._id, token).catch(() => []),
                addresses.list(token).catch(() => [])
            ]);
            setOrderCount(Array.isArray(orderList) ? orderList.length : 0);
            setAddressCount(Array.isArray(addressList) ? addressList.length : 0);
        } catch (error) {
            console.error("Failed to load profile:", error);
            toast({
                title: "Error",
                description: "Failed to load profile",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    async function saveProfile(payload: Record<string, unknown>, successMessage: string) {
        try {
            setSaving(true);
            const updated: Profile = await users.updateMe(payload, getToken());
            applyProfile({ ...updated, referredByName: profile?.referredByName });
            setUser({ ...getUser(), name: updated.name, email: updated.email, avatar: updated.avatar });
            toast({ title: "Success", description: successMessage });
            return true;
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive"
            });
            return false;
        } finally {
            setSaving(false);
        }
    }

    const handleSaveDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await saveProfile(detailsForm, "Profile updated successfully")) setEditingDetails(false);
    };

    const handleSavePrescription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (await saveProfile({ prescription: prescriptionForm }, "Prescription saved successfully")) {
            setEditingPrescription(false);
        }
    };

    const handleCancelDetails = () => {
        if (profile) applyProfile(profile);
        setEditingDetails(false);
    };

    const handleCancelPrescription = () => {
        if (profile) applyProfile(profile);
        setEditingPrescription(false);
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !profile) return;
        try {
            setUploadingPhoto(true);
            const token = getToken();
            // No size limit for the customer: big photos are scaled down here before upload
            const res = await products.uploadImage(await shrinkPhoto(file), "avatars", undefined, `user-${profile._id}`, token);
            await saveProfile({ avatar: res.url }, "Profile photo updated");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to upload photo",
                variant: "destructive"
            });
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = () => saveProfile({ avatar: "" }, "Profile photo removed");

    const updateEye = (eye: "right" | "left", key: EyeKey, value: string) => {
        setPrescriptionForm((prev) => ({ ...prev, [eye]: { ...prev[eye], [key]: value } }));
    };

    const copyReferralCode = async () => {
        if (!profile?.referralCode) return;
        try {
            await navigator.clipboard.writeText(profile.referralCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: "Error", description: "Could not copy code", variant: "destructive" });
        }
    };

    const memberSince = formatDate(profile?.createdAt);
    const prescription = profile?.prescription;
    const hasPrescription = !!(prescription && (prescription.right || prescription.left || prescription.pd));
    const today = new Date().toISOString().slice(0, 10);

    const stats = [
        { label: "Orders", value: orderCount, icon: ShoppingBag, to: "/orders" },
        { label: "Addresses", value: addressCount, icon: MapPin, to: "/addresses" },
        { label: "Wishlist", value: wishlistItems.length, icon: Heart, to: "/wishlist" },
        { label: "Referrals", value: profile?.referralCount || 0, icon: Gift, to: null }
    ];

    const detailRow = (Icon: typeof User, label: string, value?: string) => (
        <div className="flex items-start gap-3 py-4 border-b border-border/30 last:border-0">
            <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className={`mt-0.5 break-words ${value ? "text-foreground font-medium" : "text-muted-foreground italic"}`}>
                    {value || "Not added"}
                </p>
            </div>
        </div>
    );

    const editButton = (onClick: () => void, label = "Edit") => (
        <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
            <Edit className="h-4 w-4" /> {label}
        </button>
    );

    const formButtons = (onCancel: () => void) => (
        <div className="flex gap-3 pt-2">
            <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
            >
                <Check className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1.5 px-5 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
            >
                <X className="h-4 w-4" /> Cancel
            </button>
        </div>
    );

    return (
        <>
            <Header />
            <div className="min-h-screen bg-background pt-10 pb-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
                            My Profile
                        </h1>
                        <p className="text-muted-foreground">
                            View and manage your account details
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : !profile ? (
                        <p className="text-center text-muted-foreground py-12">Could not load your profile.</p>
                    ) : (
                        <div className="space-y-6">
                            {/* Avatar + Name */}
                            <div className={`${cardClass} flex items-center gap-4`}>
                                <div className="relative shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingPhoto}
                                        className="group h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden relative"
                                        aria-label="Change profile photo"
                                    >
                                        {profile.avatar ? (
                                            <img src={getImageUrl(profile.avatar)} alt="Profile" className="h-full w-full object-cover" />
                                        ) : profile.name?.trim() ? (
                                            <span className="text-3xl font-bold text-primary">
                                                {profile.name.trim().charAt(0).toUpperCase()}
                                            </span>
                                        ) : (
                                            <User className="h-9 w-9 text-primary" />
                                        )}
                                        <span className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${uploadingPhoto ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                            {uploadingPhoto ? (
                                                <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></span>
                                            ) : (
                                                <Camera className="h-6 w-6 text-white" />
                                            )}
                                        </span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl font-bold text-foreground truncate">
                                        {profile.name || "Lenszora Customer"}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
                                    <div className="flex gap-4 mt-1">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingPhoto}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            {profile.avatar ? "Change photo" : "Add photo"}
                                        </button>
                                        {profile.avatar && (
                                            <button
                                                onClick={handleRemovePhoto}
                                                disabled={saving}
                                                className="flex items-center gap-1 text-xs text-red-400 hover:underline"
                                            >
                                                <Trash2 className="h-3 w-3" /> Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {stats.map(({ label, value, icon: Icon, to }) => {
                                    const content = (
                                        <>
                                            <Icon className="h-5 w-5 text-primary mb-2" />
                                            <p className="text-2xl font-bold text-foreground">{value}</p>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                                        </>
                                    );
                                    const className = "border border-border/30 rounded-xl p-4 bg-card shadow-md block";
                                    return to ? (
                                        <motion.div key={label} whileHover={{ scale: 1.02 }}>
                                            <Link to={to} className={`${className} hover:border-primary transition-colors`}>
                                                {content}
                                            </Link>
                                        </motion.div>
                                    ) : (
                                        <div key={label} className={className}>{content}</div>
                                    );
                                })}
                            </div>

                            {/* Personal Details */}
                            <div className={cardClass}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold text-foreground">Personal Details</h3>
                                    {!editingDetails && editButton(() => setEditingDetails(true))}
                                </div>

                                {editingDetails ? (
                                    <form onSubmit={handleSaveDetails} className="space-y-4 pt-2">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={detailsForm.name}
                                                onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })}
                                                className={inputClass}
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Gender</label>
                                                <select
                                                    value={detailsForm.gender}
                                                    onChange={(e) => setDetailsForm({ ...detailsForm, gender: e.target.value })}
                                                    className={inputClass}
                                                >
                                                    <option value="">Prefer not to say</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    value={detailsForm.dateOfBirth}
                                                    max={today}
                                                    onChange={(e) => setDetailsForm({ ...detailsForm, dateOfBirth: e.target.value })}
                                                    className={inputClass}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={detailsForm.email}
                                                onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
                                                className={inputClass}
                                                placeholder="you@example.com"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                                                <input
                                                    type="text"
                                                    value={profile.phone}
                                                    disabled
                                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Used for login, cannot be changed.</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Alternate Phone</label>
                                                <input
                                                    type="tel"
                                                    value={detailsForm.alternatePhone}
                                                    onChange={(e) => setDetailsForm({ ...detailsForm, alternatePhone: e.target.value })}
                                                    className={inputClass}
                                                    placeholder="Optional"
                                                />
                                            </div>
                                        </div>
                                        {formButtons(handleCancelDetails)}
                                    </form>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8">
                                        {detailRow(User, "Full Name", profile.name)}
                                        {detailRow(Users, "Gender", profile.gender && GENDER_LABELS[profile.gender])}
                                        {detailRow(Phone, "Phone", profile.phone)}
                                        {detailRow(Phone, "Alternate Phone", profile.alternatePhone)}
                                        {detailRow(Mail, "Email", profile.email)}
                                        {detailRow(Calendar, "Date of Birth", formatDate(profile.dateOfBirth))}
                                        {detailRow(Calendar, "Member Since", memberSince)}
                                    </div>
                                )}
                            </div>

                            {/* Eye Prescription */}
                            <div className={cardClass}>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                                        <Eye className="h-5 w-5 text-primary" /> Eye Prescription
                                    </h3>
                                    {!editingPrescription && editButton(() => setEditingPrescription(true), hasPrescription ? "Edit" : "Add")}
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Save your power once and use it while ordering lenses.
                                </p>

                                {editingPrescription ? (
                                    <form onSubmit={handleSavePrescription} className="space-y-4">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                                                        <th className="text-left py-2 pr-2">Eye</th>
                                                        {EYE_FIELDS.map((f) => (
                                                            <th key={f.key} className="text-left py-2 px-1">{f.label}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(["right", "left"] as const).map((eye) => (
                                                        <tr key={eye}>
                                                            <td className="py-2 pr-2 font-medium text-foreground whitespace-nowrap">
                                                                {eye === "right" ? "Right (OD)" : "Left (OS)"}
                                                            </td>
                                                            {EYE_FIELDS.map((f) => (
                                                                <td key={f.key} className="py-2 px-1">
                                                                    <input
                                                                        type="number"
                                                                        step={f.step}
                                                                        min={f.min}
                                                                        max={f.max}
                                                                        value={prescriptionForm[eye][f.key]}
                                                                        onChange={(e) => updateEye(eye, f.key, e.target.value)}
                                                                        className="w-full min-w-[70px] px-2 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                                        placeholder="0.00"
                                                                    />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">PD (Pupillary Distance, mm)</label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min={40}
                                                    max={80}
                                                    value={prescriptionForm.pd}
                                                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, pd: e.target.value })}
                                                    className={inputClass}
                                                    placeholder="e.g. 63"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Prescription Date</label>
                                                <input
                                                    type="date"
                                                    max={today}
                                                    value={prescriptionForm.prescribedOn}
                                                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, prescribedOn: e.target.value })}
                                                    className={inputClass}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                                            <textarea
                                                value={prescriptionForm.notes}
                                                maxLength={500}
                                                rows={2}
                                                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                                                className={inputClass}
                                                placeholder="Doctor name, clinic, anything else (optional)"
                                            />
                                        </div>
                                        {formButtons(handleCancelPrescription)}
                                    </form>
                                ) : hasPrescription && prescription ? (
                                    <div className="space-y-4">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border/30">
                                                        <th className="text-left py-2 pr-2">Eye</th>
                                                        {EYE_FIELDS.map((f) => (
                                                            <th key={f.key} className="text-left py-2 px-2">{f.label}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(["right", "left"] as const).map((eye) => (
                                                        <tr key={eye} className="border-b border-border/30 last:border-0">
                                                            <td className="py-3 pr-2 font-medium text-foreground whitespace-nowrap">
                                                                {eye === "right" ? "Right (OD)" : "Left (OS)"}
                                                            </td>
                                                            {EYE_FIELDS.map((f) => (
                                                                <td key={f.key} className="py-3 px-2 text-foreground font-mono">
                                                                    {formatPower(f.key, prescription[eye]?.[f.key])}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                                            <p><span className="text-muted-foreground">PD: </span><span className="text-foreground font-medium">{prescription.pd ? `${prescription.pd} mm` : "—"}</span></p>
                                            <p><span className="text-muted-foreground">Prescribed on: </span><span className="text-foreground font-medium">{formatDate(prescription.prescribedOn) || "—"}</span></p>
                                        </div>
                                        {prescription.notes && (
                                            <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No prescription saved yet.</p>
                                )}
                            </div>

                            {/* Referral */}
                            {profile.referralCode && (
                                <div className={cardClass}>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Your Referral Code</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Share this code with friends. {profile.referralCount || 0} friend(s) joined so far.
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <span className="px-4 py-2 bg-background border border-dashed border-primary rounded-lg font-mono font-bold tracking-widest text-primary">
                                            {profile.referralCode}
                                        </span>
                                        <button
                                            onClick={copyReferralCode}
                                            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                        >
                                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            {copied ? "Copied" : "Copy"}
                                        </button>
                                    </div>
                                    {profile.referredByName && (
                                        <p className="flex items-center gap-2 text-sm text-muted-foreground mt-4 pt-4 border-t border-border/30">
                                            <Gift className="h-4 w-4 text-primary" />
                                            You joined with a referral from <span className="font-medium text-foreground">{profile.referredByName}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Profile;
