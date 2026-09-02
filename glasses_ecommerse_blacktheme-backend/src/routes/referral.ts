import express from 'express'
import { User } from '../models/User'
import { Coupon } from '../models/Coupon'
import { Setting } from '../models/Setting'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'

const router = express.Router()

// Default referral settings
const DEFAULT_REFERRAL_SETTINGS = {
  enabled: true,
  referrerRewardType: 'flat', // 'flat' or 'percent'
  referrerRewardValue: 200,   // ₹200 OFF for User A
  minOrderAmount: 500,        // Min order ₹500 required to use coupon
  couponValidityDays: 30,     // Valid for 30 days
  triggerOn: 'first_order'    // Triggered when User B places first order
}

// Get user's referral info, link, and coupons
router.get('/my-info', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.id).select('name email phone referralCode referralCount createdAt')
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Generate referral code if user doesn't have one
    if (!user.referralCode) {
      const code = `LZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      user.referralCode = code
      await user.save()
    }

    // Get list of referred users (User B's)
    const referredUsers = await User.find({ referredBy: user._id })
      .select('name email phone createdAt hasPlacedFirstOrder')
      .sort({ createdAt: -1 })

    // Get earned coupons for User A
    const earnedCoupons = await Coupon.find({ userId: user._id, isReferralReward: true })
      .sort({ createdAt: -1 })

    // Get referral settings for display
    const settingsDoc = await Setting.findOne({ key: 'referral_settings' })
    const refSettings = settingsDoc?.value || DEFAULT_REFERRAL_SETTINGS

    res.json({
      referralCode: user.referralCode,
      referralCount: referredUsers.length,
      referredUsers,
      earnedCoupons,
      settings: refSettings
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Get referral settings & summary stats
router.get('/admin/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const settingsDoc = await Setting.findOne({ key: 'referral_settings' })
    const refSettings = settingsDoc?.value || DEFAULT_REFERRAL_SETTINGS

    // Stats
    const totalReferredUsers = await User.countDocuments({ referredBy: { $ne: null } })
    const totalReferralCoupons = await Coupon.countDocuments({ isReferralReward: true })
    const usedReferralCoupons = await Coupon.countDocuments({ isReferralReward: true, timesUsed: { $gt: 0 } })

    res.json({
      settings: refSettings,
      stats: {
        totalReferredUsers,
        totalReferralCoupons,
        usedReferralCoupons
      }
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Update referral settings
router.put('/admin/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const newSettings = req.body
    const settingDoc = await Setting.findOneAndUpdate(
      { key: 'referral_settings' },
      { key: 'referral_settings', value: newSettings, category: 'referral', type: 'json' },
      { new: true, upsert: true }
    )
    res.json(settingDoc.value)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
