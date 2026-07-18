import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Check, X, Trash2, Package, Layers } from 'lucide-react';
import { lens } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const VendorLensManager: React.FC = () => {
    const [types, setTypes] = useState<any[]>([]);
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'types' | 'packages'>('types');

    // Form states
    const [isEditingType, setIsEditingType] = useState<string | null>(null);
    const [typeForm, setTypeForm] = useState({ name: '', description: '', isActive: true });

    const [isEditingPkg, setIsEditingPkg] = useState<string | null>(null);
    const [pkgForm, setPkgForm] = useState({
        lensTypeId: '',
        name: '',
        description: '',
        features: [''],
        price: 0,
        warranty: '',
        indexLabel: '',
        isActive: true
    });

    const token = localStorage.getItem('token') || '';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [typesData, pkgsData] = await Promise.all([
                lens.listVendorTypes(token),
                lens.listVendorPackages(token)
            ]);
            setTypes(typesData);
            setPackages(pkgsData);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load lens data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveType = async () => {
        try {
            if (isEditingType === 'new') {
                await lens.createVendorType(typeForm, token);
                toast({ title: "Success", description: "Lens Type created" });
            } else {
                await lens.updateVendorType(isEditingType!, typeForm, token);
                toast({ title: "Success", description: "Lens Type updated" });
            }
            setIsEditingType(null);
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleSavePackage = async () => {
        try {
            // Filter out empty features
            const finalPkg = { ...pkgForm, features: pkgForm.features.filter(f => f.trim() !== '') };

            if (isEditingPkg === 'new') {
                await lens.createVendorPackage(finalPkg, token);
                toast({ title: "Success", description: "Lens Package created" });
            } else {
                await lens.updateVendorPackage(isEditingPkg!, finalPkg, token);
                toast({ title: "Success", description: "Lens Package updated" });
            }
            setIsEditingPkg(null);
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900">My Lens Management</h1>
                <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('types')}
                        className={cn("px-4 py-2 rounded-md transition-all", activeTab === 'types' ? "bg-black text-white shadow-sm" : "text-slate-600 hover:bg-slate-300")}
                    >
                        Types
                    </button>
                    <button
                        onClick={() => setActiveTab('packages')}
                        className={cn("px-4 py-2 rounded-md transition-all", activeTab === 'packages' ? "bg-black text-white shadow-sm" : "text-slate-600 hover:bg-slate-300")}
                    >
                        Packages
                    </button>
                </div>
            </div>

            <p className="text-sm text-slate-500 mb-6">
                Manage lenses that you want to offer with your frames. These will only be shown for products where you enable "Vendor Lenses".
            </p>

            {activeTab === 'types' ? (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setIsEditingType('new');
                                setTypeForm({ name: '', description: '', isActive: true });
                            }}
                            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Lens Type
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {isEditingType === 'new' && (
                            <div className="bg-white p-4 border border-black rounded-lg shadow-lg animate-in fade-in slide-in-from-top-4">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <input
                                        placeholder="Name (e.g., Single Vision)"
                                        value={typeForm.name}
                                        onChange={e => setTypeForm({ ...typeForm, name: e.target.value })}
                                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-900"
                                    />
                                    <input
                                        placeholder="Description"
                                        value={typeForm.description}
                                        onChange={e => setTypeForm({ ...typeForm, description: e.target.value })}
                                        className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-900"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsEditingType(null)} className="px-4 py-2 hover:bg-slate-100 rounded text-slate-600">Cancel</button>
                                    <button onClick={handleSaveType} className="bg-black text-white px-6 py-2 rounded shadow-sm hover:bg-slate-800">Save</button>
                                </div>
                            </div>
                        )}

                        {types.map(type => (
                            <div key={type._id} className="bg-white p-4 border border-slate-200 rounded-lg flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                                {isEditingType === type._id ? (
                                    <div className="flex-1 grid grid-cols-2 gap-4 mr-4">
                                        <input
                                            value={typeForm.name}
                                            onChange={e => setTypeForm({ ...typeForm, name: e.target.value })}
                                            className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-900"
                                        />
                                        <input
                                            value={typeForm.description}
                                            onChange={e => setTypeForm({ ...typeForm, description: e.target.value })}
                                            className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-900"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{type.name}</h3>
                                        <p className="text-sm text-slate-500">{type.description}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    {isEditingType === type._id ? (
                                        <>
                                            <button onClick={handleSaveType} className="p-2 text-green-500 hover:bg-green-500/10 rounded"><Check className="h-5 w-5" /></button>
                                            <button onClick={() => setIsEditingType(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><X className="h-5 w-5" /></button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsEditingType(type._id);
                                                setTypeForm({ name: type.name, description: type.description || '', isActive: type.isActive });
                                            }}
                                            className="p-2 hover:bg-slate-50 rounded text-slate-400 hover:text-black"
                                        >
                                            <Edit2 className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setIsEditingPkg('new');
                                setPkgForm({
                                    lensTypeId: types[0]?._id || '',
                                    name: '',
                                    description: '',
                                    features: [''],
                                    price: 0,
                                    warranty: '',
                                    indexLabel: '',
                                    isActive: true
                                });
                            }}
                            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Package
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {(isEditingPkg === 'new' || isEditingPkg) && (
                            <div className="bg-white p-6 border border-black rounded-lg shadow-lg mb-8">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-slate-500 px-1 font-semibold uppercase">Lens Type</label>
                                        <select
                                            value={pkgForm.lensTypeId}
                                            onChange={e => setPkgForm({ ...pkgForm, lensTypeId: e.target.value })}
                                            className="bg-slate-50 border border-slate-200 p-2 rounded h-10 text-slate-900"
                                        >
                                            {types.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-slate-500 px-1 font-semibold uppercase">Package Name</label>
                                        <input
                                            placeholder="e.g., Anti-Glare Premium"
                                            value={pkgForm.name}
                                            onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })}
                                            className="bg-slate-50 border border-slate-200 p-2 rounded h-10 text-slate-900"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-slate-500 px-1 font-semibold uppercase">Price (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={pkgForm.price}
                                            onChange={e => setPkgForm({ ...pkgForm, price: Number(e.target.value) })}
                                            className="bg-slate-50 border border-slate-200 p-2 rounded h-10 text-slate-900"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 col-span-2">
                                        <label className="text-xs text-slate-500 px-1 font-semibold uppercase">Description</label>
                                        <input
                                            placeholder="Overall package description"
                                            value={pkgForm.description}
                                            onChange={e => setPkgForm({ ...pkgForm, description: e.target.value })}
                                            className="bg-slate-50 border border-slate-200 p-2 rounded h-10 text-slate-900"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-slate-500 px-1 font-semibold uppercase">Warranty</label>
                                        <input
                                            placeholder="e.g., 6 Months"
                                            value={pkgForm.warranty}
                                            onChange={e => setPkgForm({ ...pkgForm, warranty: e.target.value })}
                                            className="bg-slate-50 border border-slate-200 p-2 rounded h-10 text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="text-sm font-bold text-slate-900 mb-2 block uppercase tracking-tight">Features / Inclusions</label>
                                    <div className="space-y-2">
                                        {pkgForm.features.map((feat, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    value={feat}
                                                    onChange={e => {
                                                        const newFeats = [...pkgForm.features];
                                                        newFeats[idx] = e.target.value;
                                                        setPkgForm({ ...pkgForm, features: newFeats });
                                                    }}
                                                    className="bg-slate-50 border border-slate-200 p-2 rounded flex-1 text-slate-900"
                                                    placeholder="e.g., Scratch Resistant"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newFeats = pkgForm.features.filter((_, i) => i !== idx);
                                                        setPkgForm({ ...pkgForm, features: newFeats });
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setPkgForm({ ...pkgForm, features: [...pkgForm.features, ''] })}
                                            className="text-slate-600 text-sm font-medium hover:underline flex items-center gap-1 mt-2"
                                        >
                                            <Plus className="h-4 w-4" /> Add Feature
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsEditingPkg(null)} className="px-4 py-2 hover:bg-slate-100 rounded text-slate-600 border border-slate-200">Cancel</button>
                                    <button onClick={handleSavePackage} className="bg-black text-white px-8 py-2 rounded shadow-lg hover:bg-slate-800">Save Package</button>
                                </div>
                            </div>
                        )}

                        {packages.map(pkg => (
                            <div key={pkg._id} className="bg-white p-5 border border-slate-200 rounded-xl hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-slate-200">
                                                {pkg.lensTypeId?.name}
                                            </span>
                                            <h3 className="font-bold text-lg text-slate-900">{pkg.name}</h3>
                                        </div>
                                        <p className="text-sm text-slate-500">{pkg.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {pkg.features.map((f: string, i: number) => (
                                                <span key={i} className="text-xs flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                    <Check className="h-3 w-3 text-green-500" /> {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-slate-900">₹{pkg.price}</div>
                                        <div className="text-xs text-slate-500">{pkg.warranty} Warranty</div>
                                        <button
                                            onClick={() => {
                                                setIsEditingPkg(pkg._id);
                                                setPkgForm({
                                                    lensTypeId: pkg.lensTypeId?._id || pkg.lensTypeId || '',
                                                    name: pkg.name,
                                                    description: pkg.description || '',
                                                    features: pkg.features || [''],
                                                    price: pkg.price,
                                                    warranty: pkg.warranty || '',
                                                    indexLabel: pkg.indexLabel || '',
                                                    isActive: pkg.isActive
                                                });
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="mt-3 p-2 bg-slate-100 text-slate-400 hover:text-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-slate-200"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorLensManager;
