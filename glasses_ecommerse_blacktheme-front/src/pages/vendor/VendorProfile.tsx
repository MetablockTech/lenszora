import React, { useEffect, useState } from 'react'
import { vendors, getToken } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Phone, Mail, MapPin, Landmark, CreditCard, Loader2, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const VendorProfile: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<any>(null)

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const data = await vendors.getProfile(getToken())
            setProfile(data)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch profile',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSaving(true)
            await vendors.updateProfile(profile, getToken())
            toast({
                title: 'Success',
                description: 'Profile updated successfully',
            })
            fetchProfile()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update profile',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading profile...</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-4 lg:p-0 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Merchant Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your business information and payout details.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] ${
                        profile?.verificationStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-900/50' : 'bg-amber-500/10 text-amber-400 border-amber-900/50'
                    }`}>
                        Status: {profile?.verificationStatus}
                    </Badge>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Business Information */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-800/30 border-b border-slate-800/50 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-white">Business Information</CardTitle>
                                <CardDescription className="text-xs text-slate-500">Your public store identity</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Business Name</label>
                            <Input 
                                value={profile?.businessName || ''} 
                                onChange={e => setProfile({...profile, businessName: e.target.value})}
                                className="bg-slate-950 border-slate-800 text-white rounded-xl focus:ring-blue-500 h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input 
                                    className="bg-slate-950 border-slate-800 text-white pl-10 h-12 rounded-xl"
                                    value={profile?.phone || ''} 
                                    onChange={e => setProfile({...profile, phone: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Store Description</label>
                            <Textarea 
                                className="bg-slate-950 border-slate-800 text-white rounded-xl min-h-[120px] focus:ring-blue-500"
                                placeholder="Describe your store to customers..."
                                value={profile?.description || ''} 
                                onChange={e => setProfile({...profile, description: e.target.value})}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Details */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-800/30 border-b border-slate-800/50 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                                <Landmark className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-white">Payout Details</CardTitle>
                                <CardDescription className="text-xs text-slate-500">Where you receive your earnings</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Holder Name</label>
                            <Input 
                                className="bg-slate-950 border-slate-800 text-white rounded-xl h-12"
                                value={profile?.bankDetails?.accountHolderName || ''} 
                                onChange={e => setProfile({
                                    ...profile, 
                                    bankDetails: {...profile.bankDetails, accountHolderName: e.target.value}
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bank Name</label>
                            <Input 
                                className="bg-slate-950 border-slate-800 text-white rounded-xl h-12"
                                value={profile?.bankDetails?.bankName || ''} 
                                onChange={e => setProfile({
                                    ...profile, 
                                    bankDetails: {...profile.bankDetails, bankName: e.target.value}
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input 
                                    className="bg-slate-950 border-slate-800 text-white pl-10 rounded-xl h-12"
                                    value={profile?.bankDetails?.accountNumber || ''} 
                                    onChange={e => setProfile({
                                        ...profile, 
                                        bankDetails: {...profile.bankDetails, accountNumber: e.target.value}
                                    })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">IFSC Code</label>
                            <Input 
                                className="bg-slate-950 border-slate-800 text-white rounded-xl h-12 font-mono uppercase tracking-widest"
                                value={profile?.bankDetails?.ifscCode || ''} 
                                onChange={e => setProfile({
                                    ...profile, 
                                    bankDetails: {...profile.bankDetails, ifscCode: e.target.value}
                                })}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">UPI ID (Alternative Payout)</label>
                            <Input 
                                className="bg-slate-950 border-blue-900/30 text-white rounded-xl h-12 font-bold focus:border-blue-500"
                                placeholder="e.g. merchant@upi"
                                value={profile?.bankDetails?.upiId || ''} 
                                onChange={e => setProfile({
                                    ...profile, 
                                    bankDetails: {...profile.bankDetails, upiId: e.target.value}
                                })}
                            />
                            <p className="text-[10px] text-slate-500 italic ml-1">Your primary bank account is used by default. Enter UPI if you prefer it.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Office Address */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-800/30 border-b border-slate-800/50 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-white">Business Address</CardTitle>
                                <CardDescription className="text-xs text-slate-500">Location for logistics and taxation</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Street Address</label>
                            <Input 
                                className="bg-slate-950 border-slate-800 text-white rounded-xl h-12"
                                value={profile?.address?.street || ''} 
                                onChange={e => setProfile({
                                    ...profile, 
                                    address: {...profile.address, street: e.target.value}
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">City</label>
                            <Input 
                                className="bg-slate-950 border-slate-800 text-white rounded-xl h-12"
                                value={profile?.address?.city || ''} 
                                onChange={e => setProfile({
                                    ...profile, 
                                    address: {...profile.address, city: e.target.value}
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">State</label>
                            <Input 
                                className="bg-slate-950 border-slate-800 text-white rounded-xl h-12"
                                value={profile?.address?.state || ''} 
                                onChange={e => setProfile({
                                    ...profile, 
                                    address: {...profile.address, state: e.target.value}
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 pb-12">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        className="rounded-xl px-10 text-slate-500 hover:text-white hover:bg-slate-800"
                        onClick={() => fetchProfile()}
                    >
                        RESET
                    </Button>
                    <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl px-16 h-14 shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                SAVING...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-3" />
                                SAVE SETTINGS
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default VendorProfile
