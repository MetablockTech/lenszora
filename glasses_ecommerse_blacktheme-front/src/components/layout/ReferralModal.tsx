import React, { useEffect, useState } from 'react'
import { referrals, getToken } from '@/lib/api'
import { toast } from 'sonner'
import {
  Gift,
  Copy,
  Check,
  Share2,
  Ticket,
  Users,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Percent,
  IndianRupee
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ReferralModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ReferralModal: React.FC<ReferralModalProps> = ({ open, onOpenChange }) => {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null)
  const [referralData, setReferralData] = useState<{
    referralCode: string
    referralCount: number
    referredUsers: any[]
    earnedCoupons: any[]
    settings: any
  } | null>(null)

  useEffect(() => {
    if (open) {
      loadReferralInfo()
    }
  }, [open])

  async function loadReferralInfo() {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) return
      const data = await referrals.getMyInfo(token)
      setReferralData(data)
    } catch (error: any) {
      console.error('Failed to load referral info:', error)
    } finally {
      setLoading(false)
    }
  }

  const referralCode = referralData?.referralCode || 'LENSEZORA'
  const shareUrl = `${window.location.origin}/auth?ref=${referralCode}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Referral link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    const text = `Hey! Check out LensZora for premium eyewear. Sign up using my referral link to get awesome discounts: ${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCoupon(code)
    toast.success(`Coupon code ${code} copied!`)
    setTimeout(() => setCopiedCoupon(null), 2000)
  }

  const rewardText = referralData?.settings
    ? (referralData.settings.referrerRewardType === 'flat'
      ? `₹${referralData.settings.referrerRewardValue} OFF`
      : `${referralData.settings.referrerRewardValue}% OFF`)
    : '₹200 OFF'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-950 text-slate-100 border-slate-800 p-0 overflow-hidden shadow-2xl">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-6 text-slate-950 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/20 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Refer & Earn Rewards
          </div>
          <h2 className="text-2xl font-black tracking-tight">Refer Friends, Get {rewardText}!</h2>
          <p className="text-xs text-slate-950/80 font-medium mt-1">
            Share your link with friends. When they sign up & place their first order, you instantly get a {rewardText} discount coupon!
          </p>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-amber-400 animate-spin mb-2" />
              <p className="text-slate-400 text-xs">Loading your referral details...</p>
            </div>
          ) : (
            <>
              {/* Share Box */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Your Unique Referral Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-mono truncate select-all">
                    {shareUrl}
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 text-xs h-10 shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleShareWhatsApp}
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold h-10 text-xs flex items-center justify-center gap-2 rounded-xl"
                  >
                    <Share2 className="w-4 h-4" /> Share Referral Link on WhatsApp
                  </Button>
                </div>
              </div>

              {/* Earned Coupons Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-400" /> My Earned Reward Coupons
                  </h3>
                  <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-semibold">
                    {referralData?.earnedCoupons?.length || 0} Coupons
                  </span>
                </div>

                {referralData?.earnedCoupons && referralData.earnedCoupons.length > 0 ? (
                  <div className="space-y-2.5">
                    {referralData.earnedCoupons.map((c) => (
                      <div
                        key={c._id}
                        className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-inner"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-amber-400 text-sm tracking-wider">
                              {c.code}
                            </span>
                            <span className="text-[10px] bg-amber-500/10 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/20">
                              {c.discountType === 'flat' ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {c.minOrderAmount ? `Min order ₹${c.minOrderAmount}` : 'No min order limit'}
                            {c.expiryDate && ` • Expires ${new Date(c.expiryDate).toLocaleDateString()}`}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCouponCode(c.code)}
                          className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8"
                        >
                          {copiedCoupon === c.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="ml-1">{copiedCoupon === c.code ? 'Copied' : 'Copy'}</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-400">No reward coupons earned yet.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Share your link above. When a friend places their first order, your coupon will appear here!
                    </p>
                  </div>
                )}
              </div>

              {/* Referred Friends Summary */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" /> Friends Referred ({referralData?.referralCount || 0})
                  </h3>
                </div>

                {referralData?.referredUsers && referralData.referredUsers.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {referralData.referredUsers.map((u, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{u.name || u.phone || 'User'}</div>
                            <div className="text-[10px] text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${u.hasPlacedFirstOrder ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                          {u.hasPlacedFirstOrder ? 'First Order Placed ✓' : 'Signed Up'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">
                    You haven't referred any friends yet. Share your link to start earning rewards!
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReferralModal
