import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, MapPin, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { pincodes, getToken } from "@/lib/api";

interface Pincode {
    _id: string;
    pincode: string;
    city: string;
    state: string;
    isServiceable: boolean;
    estimatedDeliveryDays: number;
    deliveryRules?: Array<{
        minOrderValue: number;
        deliveryCharge: number;
    }>;
}

const AdminPincodes = () => {
    const [pincodeList, setPincodeList] = useState<Pincode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPincode, setEditingPincode] = useState<Pincode | null>(null);
    const [formData, setFormData] = useState({
        pincode: "",
        city: "",
        state: "",
        isServiceable: true,
        estimatedDeliveryDays: 7,
        deliveryRules: [] as Array<{ minOrderValue: number; deliveryCharge: number; }>
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            loadPincodes();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    async function loadPincodes() {
        try {
            setLoading(true);
            const token = getToken();
            const data = await pincodes.list(token, { search: searchQuery });
            setPincodeList(data);
        } catch (error) {
            console.error("Failed to load pincodes:", error);
            toast({
                title: "Error",
                description: "Failed to load pincodes",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();

        try {
            if (editingPincode) {
                await pincodes.update(editingPincode._id, formData, token);
                toast({
                    title: "Success",
                    description: "Pincode updated successfully"
                });
            } else {
                await pincodes.create(formData, token);
                toast({
                    title: "Success",
                    description: "Pincode added successfully"
                });
            }

            setShowAddModal(false);
            setEditingPincode(null);
            setFormData({
                pincode: "",
                city: "",
                state: "",
                isServiceable: true,
                estimatedDeliveryDays: 7,
                deliveryRules: []
            });
            loadPincodes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save pincode",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this pincode?")) return;

        try {
            const token = getToken();
            await pincodes.remove(id, token);
            toast({
                title: "Success",
                description: "Pincode deleted successfully"
            });
            loadPincodes();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete pincode",
                variant: "destructive"
            });
        }
    };

    const handleEdit = (pincode: Pincode) => {
        setEditingPincode(pincode);
        setFormData({
            pincode: pincode.pincode,
            city: pincode.city,
            state: pincode.state,
            isServiceable: pincode.isServiceable,
            estimatedDeliveryDays: pincode.estimatedDeliveryDays,
            deliveryRules: pincode.deliveryRules || []
        });
        setShowAddModal(true);
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
                    Pincode Management
                </h1>
                <p className="text-muted-foreground">
                    Manage serviceable delivery pincodes
                </p>
            </div>

            {/* Search and Add */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by pincode, city, or state..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                    />
                </div>
                <button
                    onClick={() => {
                        setEditingPincode(null);
                        setFormData({
                            pincode: "",
                            city: "",
                            state: "",
                            isServiceable: true,
                            estimatedDeliveryDays: 7,
                            deliveryRules: []
                        });
                        setShowAddModal(true);
                    }}
                    className="btn-gold flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Add Pincode
                </button>
            </div>

            {/* Pincode List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="bg-card border border-border/30 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-secondary">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Pincode
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    City
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    State
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Delivery Days
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {pincodeList
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((item) => (
                                    <tr key={item._id} className="hover:bg-secondary/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                <span className="font-medium">{item.pincode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                            {item.city}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                            {item.state}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                            {item.estimatedDeliveryDays} days
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.isServiceable ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
                                                    <Check className="h-3 w-3" />
                                                    Serviceable
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-medium">
                                                    <X className="h-3 w-3" />
                                                    Not Serviceable
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 hover:bg-primary/10 rounded transition-colors"
                                                >
                                                    <Edit className="h-4 w-4 text-primary" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-2 hover:bg-red-500/10 rounded transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>

                    {pincodeList.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No pincodes found. Add your first pincode to get started.
                        </div>
                    )}

                    {/* Pagination */}
                    {pincodeList.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border/30">
                            <div className="text-sm text-muted-foreground">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pincodeList.length)} of {pincodeList.length} pincodes
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-border/50 rounded hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.ceil(pincodeList.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 border rounded transition-colors ${currentPage === page
                                                ? 'bg-primary text-white border-primary'
                                                : 'border-border/50 hover:bg-secondary'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(pincodeList.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage === Math.ceil(pincodeList.length / itemsPerPage)}
                                    className="px-3 py-1 border border-border/50 rounded hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card border border-border/30 rounded-lg p-6 w-full max-w-md"
                    >
                        <h2 className="text-2xl font-playfair font-bold mb-4">
                            {editingPincode ? "Edit Pincode" : "Add New Pincode"}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Pincode</label>
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                    required
                                    maxLength={6}
                                    className="w-full px-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                                    placeholder="Enter 6-digit pincode"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                                    placeholder="Enter city name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">State</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                                    placeholder="Enter state name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Estimated Delivery Days</label>
                                <input
                                    type="number"
                                    value={formData.estimatedDeliveryDays}
                                    onChange={(e) => setFormData({ ...formData, estimatedDeliveryDays: parseInt(e.target.value) || 7 })}
                                    required
                                    min="1"
                                    className="w-full px-4 py-2 bg-secondary border border-border/50 rounded-lg focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium">Delivery Charges Rules</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            deliveryRules: [...formData.deliveryRules, { minOrderValue: 0, deliveryCharge: 0 }]
                                        })}
                                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                    >
                                        <Plus className="h-3 w-3" /> Add Rule
                                    </button>
                                </div>

                                {formData.deliveryRules.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No specific rules. Default shipping behavior applies.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {formData.deliveryRules.map((rule, index) => (
                                            <div key={index} className="flex gap-2 items-start">
                                                <div className="flex-1">
                                                    <label className="text-xs text-muted-foreground">Min Order Value</label>
                                                    <input
                                                        type="number"
                                                        value={rule.minOrderValue}
                                                        onChange={(e) => {
                                                            const newRules = [...formData.deliveryRules];
                                                            newRules[index].minOrderValue = parseInt(e.target.value) || 0;
                                                            setFormData({ ...formData, deliveryRules: newRules });
                                                        }}
                                                        className="w-full px-2 py-1 bg-secondary border border-border/50 rounded text-sm"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-muted-foreground">Delivery Charge</label>
                                                    <input
                                                        type="number"
                                                        value={rule.deliveryCharge}
                                                        onChange={(e) => {
                                                            const newRules = [...formData.deliveryRules];
                                                            newRules[index].deliveryCharge = parseInt(e.target.value) || 0;
                                                            setFormData({ ...formData, deliveryRules: newRules });
                                                        }}
                                                        className="w-full px-2 py-1 bg-secondary border border-border/50 rounded text-sm"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newRules = formData.deliveryRules.filter((_, i) => i !== index);
                                                        setFormData({ ...formData, deliveryRules: newRules });
                                                    }}
                                                    className="p-1 mt-5 hover:bg-red-500/10 rounded transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isServiceable"
                                    checked={formData.isServiceable}
                                    onChange={(e) => setFormData({ ...formData, isServiceable: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isServiceable" className="text-sm font-medium">
                                    Serviceable for delivery
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingPincode(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-border/50 rounded-lg hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-gold"
                                >
                                    {editingPincode ? "Update" : "Add"} Pincode
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminPincodes;
