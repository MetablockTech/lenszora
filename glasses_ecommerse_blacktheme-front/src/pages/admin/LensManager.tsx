import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Check, X, Trash2, Package, Layers, Image as ImageIcon, ShieldCheck, ShieldAlert } from 'lucide-react';
import { lens, API_URL, products } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const LensManager: React.FC = () => {
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isEditingType, setIsEditingType] = useState<string | null>(null);
    const [typeForm, setTypeForm] = useState({ 
        name: '', 
        subtitle: '', 
        description: '', 
        imageUrl: '', 
        isActive: true,
        allowPackages: true,
        skipPowerEntry: false
    });
    const [pendingTypeImage, setPendingTypeImage] = useState<File | null>(null);

    const token = localStorage.getItem('token') || '';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const typesData = await lens.listTypes(token);
            setTypes(typesData);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load lens data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveType = async () => {
        try {
            if (!typeForm.name) {
                toast({ title: "Validation Error", description: "Type Name is required", variant: "destructive" });
                return;
            }

            let finalForm = { ...typeForm };

            // Upload image if pending
            if (pendingTypeImage) {
                const res = await products.uploadImage(pendingTypeImage, 'lenses', 'types', `type-${Date.now()}`, token);
                finalForm.imageUrl = res.url;
            }

            if (isEditingType === 'new') {
                await lens.createType(finalForm, token);
                toast({ title: "Success", description: "Lens Type created" });
            } else {
                await lens.updateType(isEditingType!, finalForm, token);
                toast({ title: "Success", description: "Lens Type updated" });
            }
            setIsEditingType(null);
            setPendingTypeImage(null);
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeleteType = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this lens type? This will also delete all associated lens packages!")) return;
        try {
            await lens.deleteType(id, token);
            toast({ title: "Success", description: "Lens Type deleted successfully" });
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete lens type", variant: "destructive" });
        }
    };

    const startEditing = (type: any) => {
        setIsEditingType(type._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTypeForm({
            name: type.name,
            subtitle: type.subtitle || '',
            description: type.description || '',
            imageUrl: type.imageUrl || '',
            isActive: type.isActive !== false,
            allowPackages: type.allowPackages !== false,
            skipPowerEntry: type.skipPowerEntry === true
        });
        setPendingTypeImage(null);
    };

    if (loading) return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Loading Lens Manager...</p>
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end border-b pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lens Management</h1>
                    <p className="text-slate-500 mt-1">Configure global lens categories, icons, and package rules</p>
                </div>
                <button
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setIsEditingType('new');
                        setTypeForm({ name: '', subtitle: '', description: '', imageUrl: '', isActive: true, allowPackages: true, skipPowerEntry: false });
                        setPendingTypeImage(null);
                    }}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-bold text-sm"
                >
                    <Plus className="h-5 w-5" /> Add New Lens Type
                </button>
            </div>

            <div className="grid gap-6">
                {/* NEW / EDIT FORM */}
                {isEditingType && (
                    <div className="bg-white p-6 border-2 border-blue-500 rounded-2xl shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3 border-b pb-4">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                {isEditingType === 'new' ? <Plus className="w-6 h-6" /> : <Edit2 className="w-5 h-5" />}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {isEditingType === 'new' ? 'Create New Lens Type' : 'Edit Lens Type'}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Type Name</label>
                                    <input
                                        placeholder="e.g., Single Vision"
                                        value={typeForm.name}
                                        onChange={e => setTypeForm({ ...typeForm, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Subtitle / Badge</label>
                                    <input
                                        placeholder="e.g., With Power"
                                        value={typeForm.subtitle}
                                        onChange={e => setTypeForm({ ...typeForm, subtitle: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Description</label>
                                    <textarea
                                        placeholder="Brief description for customers"
                                        value={typeForm.description}
                                        onChange={e => setTypeForm({ ...typeForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Category Rules</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={typeForm.isActive} 
                                                onChange={e => setTypeForm({ ...typeForm, isActive: e.target.checked })}
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900">Active Category</p>
                                                <p className="text-xs text-slate-500">Visible in product selection grid</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={typeForm.allowPackages} 
                                                onChange={e => setTypeForm({ ...typeForm, allowPackages: e.target.checked })}
                                                className="w-5 h-5 rounded border-slate-300 text-teal-600"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900">Allow Lens Packages</p>
                                                <p className="text-xs text-slate-500">If unchecked, this category goes direct to cart</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={typeForm.skipPowerEntry} 
                                                onChange={e => setTypeForm({ ...typeForm, skipPowerEntry: e.target.checked })}
                                                className="w-5 h-5 rounded border-slate-300 text-purple-600"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900">Skip Eye Power Step</p>
                                                <p className="text-xs text-slate-500">Automatically skip Step 3 (Eye Power Selection)</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Category Icon</label>
                                    <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {(typeForm.imageUrl || pendingTypeImage) ? (
                                                <img 
                                                    src={pendingTypeImage ? URL.createObjectURL(pendingTypeImage) : `${API_URL}${typeForm.imageUrl}`} 
                                                    className="w-full h-full object-contain" 
                                                />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="category-icon"
                                                onChange={e => setPendingTypeImage(e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                            <label 
                                                htmlFor="category-icon"
                                                className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 shadow-sm"
                                            >
                                                Choose New Image
                                            </label>
                                            <p className="text-[10px] text-slate-400">Recommended: Transparent PNG or SVG (1:1 ratio)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button 
                                onClick={() => setIsEditingType(null)} 
                                className="px-6 py-2.5 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveType} 
                                className="bg-blue-600 text-white px-10 py-2.5 rounded-xl shadow-md hover:bg-blue-700 transition-all font-bold uppercase tracking-widest text-xs"
                            >
                                {isEditingType === 'new' ? 'Create Category' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {/* LIST VIEW */}
                <div className="grid gap-4">
                    {types.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                            <Layers className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">No lens types configured yet</p>
                        </div>
                    ) : (
                        types.map(type => (
                            <div 
                                key={type._id} 
                                className={cn(
                                    "bg-white p-4 border rounded-2xl flex justify-between items-center transition-all group",
                                    !type.isActive ? "bg-slate-50 border-slate-100 opacity-75" : "border-slate-200 hover:border-blue-200 hover:shadow-md"
                                )}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                        {type.imageUrl ? (
                                            <img src={`${API_URL}${type.imageUrl}`} className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <Layers className="h-7 w-7 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-extrabold text-xl text-slate-900 leading-none">{type.name}</h3>
                                            <div className="flex gap-1.5 Items-center">
                                                {!type.isActive && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">Inactive</span>}
                                                {type.allowPackages === false && (
                                                    <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                                                        <ShieldAlert className="w-3 h-3" /> Direct Add
                                                    </span>
                                                )}
                                                {type.allowPackages !== false && (
                                                    <span className="flex items-center gap-1 text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                                                        <ShieldCheck className="w-3 h-3" /> Packages Enabled
                                                    </span>
                                                )}
                                                {type.skipPowerEntry === true && (
                                                    <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                                                        No Power Selection
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {type.subtitle && (
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{type.subtitle}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 leading-snug max-w-xl line-clamp-1">{type.description || 'No description provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => startEditing(type)}
                                        className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                                        title="Edit Lens Type"
                                    >
                                        <Edit2 className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteType(type._id)}
                                        className="p-3 bg-slate-50 hover:bg-red-50 rounded-xl text-slate-300 hover:text-red-500 transition-all shadow-sm"
                                        title="Delete Lens Type"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LensManager;
