import React, { useEffect, useState } from 'react'
import { referrals, coupons, getToken } from '@/lib/api'
import { toast } from 'sonner'
import {
  Gift,
  Ticket,
  Users,
  CheckCircle2,
  Save,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  Percent,
  IndianRupee,
  Calendar,
  Clock,
  ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const ReferralManagerPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    enabled: true,
    referrerRewardType: 'flat',
    referrerRewardValue: 200,
    minOrderAmount: 500,
    couponValidityDays: 30,
    triggerOn: 'first_order'
  })

  const [stats, setStats] = useState({
    totalReferredUsers: 0,
    totalReferralCoupons: 0,
    usedReferralCoupons: 0
  })

  const [couponList, setCouponList] = useState<any[]>([])
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'flat',
    discountValue: 100,
    minOrderAmount: 0,
    usageLimit: 1,
    expiryDate: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const token = getToken()
      const [settingsRes, couponsRes] = await Promise.all([
        referrals.getAdminSettings(token),
        coupons.getAllAdmin(token)
      ])

      if (settingsRes.settings) setSettings(settingsRes.settings)
      if (settingsRes.stats) setStats(settingsRes.stats)
      setCouponList(couponsRes || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSettings() {
    setSaving(true)
    try {
      const token = getToken()
      await referrals.updateAdminSettings(settings, token)
      toast.success('Referral settings updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const token = getToken()
      await coupons.createAdmin(newCoupon, token)
      toast.success('Coupon created successfully')
      setIsAddCouponOpen(false)
      setNewCoupon({ code: '', discountType: 'flat', discountValue: 100, minOrderAmount: 0, usageLimit: 1, expiryDate: '' })
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCoupon(id: string) {
    try {
      const token = getToken()
      await coupons.deleteAdmin(id, token)
      toast.success('Coupon deleted')
      loadData()
    } catch (error: any) {
      toast.error('Failed to delete coupon')
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Gift className="h-8 w-8 text-amber-500" /> Referral & Coupon System
          </h1>
          <p className="text-slate-500 mt-1">Configure referral reward coupons given to User A when User B places their first order.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadData} className="border-slate-200">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => setIsAddCouponOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Create Custom Coupon
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Referred Users</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalReferredUsers}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Referral Coupons Issued</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalReferralCoupons}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Coupons Redeemed</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stats.usedReferralCoupons}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Rules & Config Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" /> Referral Reward Settings
          </CardTitle>
          <CardDescription>
            When User A refers User B, User A will receive an automatic discount coupon once User B places their first order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div>
              <Label className="text-base font-semibold text-slate-900">Enable Referral System</Label>
              <p className="text-xs text-slate-500 mt-0.5">Turn on/off automatic referral coupon generation for referrers.</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label>Reward Discount Type</Label>
                <select
                  value={settings.referrerRewardType}
                  onChange={(e) => setSettings({ ...settings, referrerRewardType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="flat">Flat Amount Discount (₹)</option>
                  <option value="percent">Percentage Discount (%)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>
                  Reward Discount Value ({settings.referrerRewardType === 'flat' ? '₹' : '%'})
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={settings.referrerRewardValue}
                  onChange={(e) => setSettings({ ...settings, referrerRewardValue: Number(e.target.value) })}
                  placeholder={settings.referrerRewardType === 'flat' ? '200' : '15'}
                />
              </div>

              <div className="space-y-2">
                <Label>Minimum Order Amount to Use Coupon (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={settings.minOrderAmount}
                  onChange={(e) => setSettings({ ...settings, minOrderAmount: Number(e.target.value) })}
                  placeholder="500"
                />
                <p className="text-[11px] text-slate-400">Coupon will only apply if cart subtotal is equal to or greater than this amount.</p>
              </div>

              <div className="space-y-2">
                <Label>Coupon Expiry (Days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={settings.couponValidityDays}
                  onChange={(e) => setSettings({ ...settings, couponValidityDays: Number(e.target.value) })}
                  placeholder="30"
                />
                <p className="text-[11px] text-slate-400">Days until the reward coupon expires after being issued.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <Button onClick={handleSaveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Save Referral Rules
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-600" /> Active & Generated Coupons
            </h3>
            <p className="text-xs text-slate-500">List of all system and referral coupons</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Total: {couponList.length}
          </span>
        </div>

        {couponList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold">No coupons created yet.</p>
            <p className="text-xs text-slate-400 mt-1">Create custom coupons or generate referrals.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Min Order</th>
                  <th className="px-6 py-4">Assigned User / Type</th>
                  <th className="px-6 py-4">Usage</th>
                  <th className="px-6 py-4">Expiry</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {couponList.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-700">
                      {c.discountType === 'flat' ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      ₹{c.minOrderAmount || 0}
                    </td>
                    <td className="px-6 py-4">
                      {c.isReferralReward ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Gift className="h-3 w-3" /> Referral Reward
                        </span>
                      ) : c.userId ? (
                        <span className="text-slate-700 font-medium">User: {c.userId.name || c.userId.phone || c.userId.email}</span>
                      ) : (
                        <span className="text-blue-600 font-medium">Public / Global</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {c.timesUsed} / {c.usageLimit}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCoupon(c._id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Custom Coupon Modal */}
      <Dialog open={isAddCouponOpen} onOpenChange={setIsAddCouponOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Create Custom Coupon</DialogTitle>
            <DialogDescription>Add a new promotional coupon code manually.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <Input
                required
                uppercase
                placeholder="e.g. WELCOME100"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <select
                  value={newCoupon.discountType}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="flat">Flat (₹)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Discount Value *</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Order Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newCoupon.minOrderAmount}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={newCoupon.usageLimit}
                  onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={newCoupon.expiryDate}
                onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddCouponOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Coupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReferralManagerPage
