import React, { useState } from 'react'
import { vendors } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import {
    Building2,
    Mail,
    User,
    Phone,
    MapPin,
    Percent,
    ChevronLeft,
    Loader2,
    Save,
    Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const CreateVendorPage: React.FC = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: 'Vendor@123', // Default password
        phone: '',
        businessName: '',
        description: '',
        commissionRate: 10,
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
        }
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (name.includes('.')) {
            const [parent, child] = name.split('.')
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value
                }
            }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            await vendors.register(formData)
            toast({
                title: 'Success',
                description: 'Vendor account created successfully',
            })
            navigate('/admin/vendors')
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create vendor',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/vendors')}
                    className="mb-4 text-slate-500 hover:text-slate-900"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Vendors
                </Button>
                <h1 className="text-3xl font-bold text-slate-900">Create New Vendor</h1>
                <p className="text-slate-500 mt-1">Register a new vendor profile and user account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Details */}
                <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold">
                        <User className="w-5 h-5 text-blue-600" />
                        <span>Owner Information</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Owner Name"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="vendor@example.com"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 12345 67890"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Default Password</label>
                            <div className="relative">
                                <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                <input
                                    disabled
                                    value={formData.password}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-100 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed text-black"
                                />
                            </div>
                            <p className="text-xs text-slate-400">Vendors can change this after their first login.</p>
                        </div>
                    </div>
                </div>

                {/* Business Details */}
                <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span>Business Information</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Company / Business Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    placeholder="Modern Sunglasses Pvt Ltd"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Short Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Briefly describe the vendor's products..."
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Commission Rate (%)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    type="number"
                                    name="commissionRate"
                                    value={formData.commissionRate}
                                    onChange={handleChange}
                                    placeholder="10"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span>Business Location</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Street Address</label>
                            <input
                                name="address.street"
                                value={formData.address.street}
                                onChange={handleChange}
                                placeholder="123 Shopping Plaza"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">City</label>
                            <input
                                name="address.city"
                                value={formData.address.city}
                                onChange={handleChange}
                                placeholder="Mumbai"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">State / Region</label>
                            <input
                                name="address.state"
                                value={formData.address.state}
                                onChange={handleChange}
                                placeholder="Maharashtra"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Zip / Postal Code</label>
                            <input
                                name="address.zipCode"
                                value={formData.address.zipCode}
                                onChange={handleChange}
                                placeholder="400001"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/admin/vendors')}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Create Vendor
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default CreateVendorPage
