import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Edit, Trash2, Home, Briefcase, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { addresses, pincodes, getToken, getUser } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface Address {
    _id: string;
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
    addressType: 'home' | 'work' | 'other';
}

const Addresses = () => {
    const navigate = useNavigate();
    const user = getUser();
    const [addressList, setAddressList] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [checkingPincode, setCheckingPincode] = useState(false);
    const [pincodeValid, setPincodeValid] = useState<boolean | null>(null);
    const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        isDefault: false,
        addressType: 'home' as 'home' | 'work' | 'other'
    });

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }
        loadAddresses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadAddresses() {
        try {
            setLoading(true);
            const token = getToken();
            const data = await addresses.list(token);
            setAddressList(data);
        } catch (error) {
            console.error("Failed to load addresses:", error);
            toast({
                title: "Error",
                description: "Failed to load addresses",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    const checkPincodeAvailability = async (pincode: string) => {
        if (pincode.length !== 6) {
            setPincodeValid(null);
            setDeliveryInfo(null);
            return;
        }

        try {
            setCheckingPincode(true);
            const result = await pincodes.check(pincode);
            setPincodeValid(result.serviceable);
            setDeliveryInfo(result);
        } catch (error) {
            setPincodeValid(false);
            setDeliveryInfo(null);
        } finally {
            setCheckingPincode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pincodeValid) {
            toast({
                title: "Invalid Pincode",
                description: "Delivery is not available for this pincode",
                variant: "destructive"
            });
            return;
        }

        const token = getToken();

        try {
            if (editingAddress) {
                await addresses.update(editingAddress._id, formData, token);
                toast({
                    title: "Success",
                    description: "Address updated successfully"
                });
            } else {
                await addresses.create(formData, token);
                toast({
                    title: "Success",
                    description: "Address added successfully"
                });
            }

            setShowAddModal(false);
            setEditingAddress(null);
            resetForm();
            loadAddresses();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save address",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        try {
            const token = getToken();
            await addresses.remove(id, token);
            toast({
                title: "Success",
                description: "Address deleted successfully"
            });
            loadAddresses();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete address",
                variant: "destructive"
            });
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const token = getToken();
            await addresses.setDefault(id, token);
            toast({
                title: "Success",
                description: "Default address updated"
            });
            loadAddresses();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to set default address",
                variant: "destructive"
            });
        }
    };

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setFormData({
            name: address.name,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || "",
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            isDefault: address.isDefault,
            addressType: address.addressType
        });
        checkPincodeAvailability(address.pincode);
        setShowAddModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            pincode: "",
            isDefault: false,
            addressType: 'home'
        });
        setPincodeValid(null);
        setDeliveryInfo(null);
    };

    const getAddressTypeIcon = (type: string) => {
        switch (type) {
            case 'home': return <Home className="h-4 w-4" />;
            case 'work': return <Briefcase className="h-4 w-4" />;
            default: return <MapPin className="h-4 w-4" />;
        }
    };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-background pt-32 pb-16">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
                            My Addresses
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your delivery addresses
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {/* Add New Address Card */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => {
                                        resetForm();
                                        setEditingAddress(null);
                                        setShowAddModal(true);
                                    }}
                                    className="border-2 border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors min-h-[200px]"
                                >
                                    <Plus className="h-12 w-12 text-muted-foreground mb-2" />
                                    <span className="text-muted-foreground font-medium">Add New Address</span>
                                </motion.div>

                                {/* Address Cards */}
                                {addressList.map((address) => (
                                    <motion.div
                                        key={address._id}
                                        whileHover={{ scale: 1.02 }}
                                        className="border border-border/30 rounded-lg p-6 bg-card relative"
                                    >
                                        {address.isDefault && (
                                            <div className="absolute top-3 right-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                                    <Star className="h-3 w-3 fill-current" />
                                                    Default
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 mb-3">
                                            {getAddressTypeIcon(address.addressType)}
                                            <span className="font-medium capitalize">{address.addressType}</span>
                                        </div>

                                        <div className="space-y-1 mb-4">
                                            <p className="font-semibold">{address.name}</p>
                                            <p className="text-sm text-muted-foreground">{address.phone}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {address.addressLine1}
                                                {address.addressLine2 && `, ${address.addressLine2}`}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {address.city}, {address.state} - {address.pincode}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 pt-3 border-t border-border/30">
                                            <button
                                                onClick={() => handleEdit(address)}
                                                className="flex-1 px-3 py-2 text-sm border border-border/50 rounded hover:bg-secondary transition-colors"
                                            >
                                                <Edit className="h-4 w-4 inline mr-1" />
                                                Edit
                                            </button>
                                            {!address.isDefault && (
                                                <button
                                                    onClick={() => handleSetDefault(address._id)}
                                                    className="flex-1 px-3 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
                                                >
                                                    Set Default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(address._id)}
                                                className="px-3 py-2 text-sm border border-red-500/50 text-red-500 rounded hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {addressList.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    No addresses saved yet. Add your first address to get started.
                                </div>
                            )}
                        </>
                    )}

                    {/* Add/Edit Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-card border border-border/30 rounded-lg p-6 w-full max-w-2xl my-8"
                            >
                                <h2 className="text-2xl font-playfair font-bold mb-4">
                                    {editingAddress ? "Edit Address" : "Add New Address"}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Full Name *</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="w-full px-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                                                placeholder="Enter your name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Phone Number *</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                                required
                                                maxLength={10}
                                                className="w-full px-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                                                placeholder="10-digit mobile number"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Address Line 1 *</label>
                                        <input
                                            type="text"
                                            value={formData.addressLine1}
                                            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                                            placeholder="House No., Building Name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Address Line 2</label>
                                        <input
                                            type="text"
                                            value={formData.addressLine2}
                                            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                                            className="w-full px-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                                            placeholder="Road name, Area, Colony (Optional)"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Pincode *</label>
                                            <input
                                                type="text"
                                                value={formData.pincode}
                                                onChange={(e) => {
                                                    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    setFormData({ ...formData, pincode: pin });
                                                    if (pin.length === 6) {
                                                        checkPincodeAvailability(pin);
                                                    } else {
                                                        setPincodeValid(null);
                                                        setDeliveryInfo(null);
                                                    }
                                                }}
                                                required
                                                maxLength={6}
                                                className={`w-full px-4 py-2 bg-secondary border rounded-lg focus:outline-none ${pincodeValid === true ? 'border-green-500' :
                                                    pincodeValid === false ? 'border-red-500' :
                                                        'border-border/50 focus:border-primary'
                                                    }`}
                                                placeholder="6-digit pincode"
                                            />
                                            {checkingPincode && <p className="text-xs text-muted-foreground mt-1">Checking...</p>}
                                            {pincodeValid === true && deliveryInfo && (
                                                <p className="text-xs text-green-500 mt-1">
                                                    ✓ Delivery in {deliveryInfo.estimatedDeliveryDays} days
                                                </p>
                                            )}
                                            {pincodeValid === false && (
                                                <p className="text-xs text-red-500 mt-1">✗ Delivery not available</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">City *</label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                required
                                                className="w-full px-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                                                placeholder="City"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">State *</label>
                                            <input
                                                type="text"
                                                value={formData.state}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                required
                                                className="w-full px-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                                                placeholder="State"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Address Type</label>
                                        <div className="flex gap-3">
                                            {(['home', 'work', 'other'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, addressType: type })}
                                                    className={`flex-1 px-4 py-2 border rounded-lg capitalize transition-colors ${formData.addressType === type
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'border-border/50 hover:bg-secondary'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            checked={formData.isDefault}
                                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <label htmlFor="isDefault" className="text-sm font-medium">
                                            Set as default address
                                        </label>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddModal(false);
                                                setEditingAddress(null);
                                                resetForm();
                                            }}
                                            className="flex-1 px-4 py-2 border border-border/50 rounded-lg hover:bg-secondary transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!pincodeValid}
                                            className="flex-1 btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {editingAddress ? "Update" : "Save"} Address
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Addresses;
