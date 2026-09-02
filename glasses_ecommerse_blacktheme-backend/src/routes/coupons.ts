import express from 'express'
import { Coupon } from '../models/Coupon'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'

const router = express.Router()

// Validate and apply coupon code (Public or Auth)
router.post('/apply', async (req, res) => {
  try {
    const { code, orderAmount, userId } = req.body
    if (!code) return res.status(400).json({ error: 'Coupon code is required' })

    const cleanCode = String(code).trim().toUpperCase()
    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true })

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or inactive coupon code' })
    }

    // Check expiry
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ error: 'Coupon code has expired' })
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' })
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ error: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon` })
    }

    // Check user assignment if specific to a user
    if (coupon.userId && userId && coupon.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'This coupon is assigned to another user' })
    }

    // Calculate discount amount
    let discount = 0
    if (coupon.discountType === 'percent') {
      discount = (orderAmount * coupon.discountValue) / 100
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount
      }
    } else {
      discount = coupon.discountValue
    }

    // Cap discount at order amount
    if (discount > orderAmount) {
      discount = orderAmount
    }

    res.json({
      valid: true,
      couponId: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discount),
      finalAmount: Math.round(orderAmount - discount)
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get active coupons for logged-in user
router.get('/my-coupons', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const coupons = await Coupon.find({
      $or: [
        { userId: userId },
        { userId: null, isReferralReward: false }
      ],
      isActive: true,
      $expr: { $lt: ['$timesUsed', '$usageLimit'] }
    }).sort({ createdAt: -1 })

    res.json(coupons)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Get all coupons
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().populate('userId', 'name email phone').sort({ createdAt: -1 })
    res.json(coupons)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Create manual coupon
router.post('/admin/create', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      code, discountType, discountValue, minOrderAmount,
      maxDiscount, userId, usageLimit, expiryDate
    } = req.body

    if (!code || discountValue == null) {
      return res.status(400).json({ error: 'Code and discountValue are required' })
    }

    const cleanCode = String(code).trim().toUpperCase()

    const coupon = new Coupon({
      code: cleanCode,
      discountType: discountType || 'flat',
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      userId: userId || undefined,
      usageLimit: Number(usageLimit) || 1,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      isActive: true
    })

    await coupon.save()
    res.json(coupon)
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Coupon code already exists' })
    }
    res.status(500).json({ error: error.message })
  }
})

// Admin: Delete coupon
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
