import express, { Request, Response } from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { Order } from '../models/Order'
import { Product } from '../models/Product'
import { Vendor } from '../models/Vendor'
import { User } from '../models/User'
import { Coupon } from '../models/Coupon'
import { Setting } from '../models/Setting'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = express.Router()

// Helper to trigger referral coupon for referrer when referred user places first order
async function checkAndTriggerReferralReward(userId: string) {
  try {
    const user = await User.findById(userId)
    if (!user || user.hasPlacedFirstOrder || !user.referredBy) return

    user.hasPlacedFirstOrder = true
    await user.save()

    const referrer = await User.findById(user.referredBy)
    if (!referrer) return

    const settingsDoc = await Setting.findOne({ key: 'referral_settings' })
    const refSettings = settingsDoc?.value || {
      enabled: true,
      referrerRewardType: 'flat',
      referrerRewardValue: 200,
      minOrderAmount: 500,
      couponValidityDays: 30
    }

    if (refSettings.enabled === false) return

    const days = Number(refSettings.couponValidityDays) || 30
    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const couponCode = `REF-${referrer.referralCode || 'BONUS'}-${randomSuffix}`

    const rewardCoupon = new Coupon({
      code: couponCode,
      discountType: refSettings.referrerRewardType || 'flat',
      discountValue: Number(refSettings.referrerRewardValue) || 200,
      minOrderAmount: Number(refSettings.minOrderAmount) || 500,
      userId: referrer._id,
      isReferralReward: true,
      usageLimit: 1,
      timesUsed: 0,
      expiryDate,
      isActive: true
    })

    await rewardCoupon.save()
    console.log(`[REFERRAL REWARD] Created reward coupon ${couponCode} for referrer ${referrer._id}`)
  } catch (err) {
    console.error('Error triggering referral reward:', err)
  }
}

// Initialize Razorpay
const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  ? new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
  : null

import { Pincode } from '../models/Pincode'

// ... imports

// Create order and payment
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { items: rawItems, total, shippingAddress, paymentMethod, paymentProof, utrNumber } = req.body

    // Group items by vendor and calculate commissions
    const vendorMap = new Map();
    const processedItems = [];
    let totalCommission = 0;

    for (const item of rawItems) {
      const vendorId = item.vendorId;
      if (!vendorMap.has(vendorId)) {
        const vendor = await Vendor.findById(vendorId);
        vendorMap.set(vendorId, {
          vendorId,
          items: [],
          subtotal: 0,
          commission: 0,
          vendorAmount: 0,
          commissionRate: vendor?.commissionRate || 15
        });
      }

      const vData = vendorMap.get(vendorId);
      const itemSubtotal = (item.price + (item.lens?.price || 0)) * item.quantity;
      const itemCommission = (itemSubtotal * vData.commissionRate) / 100;
      const itemVendorAmount = itemSubtotal - itemCommission;

      const processedItem = {
        ...item,
        commission: itemCommission,
        vendorAmount: itemVendorAmount
      };

      processedItems.push(processedItem);
      vData.items.push(processedItem);
      vData.subtotal += itemSubtotal;
      vData.commission += itemCommission;
      vData.vendorAmount += itemVendorAmount;
      totalCommission += itemCommission;
    }

    const vendorOrders = Array.from(vendorMap.values()).map(vo => ({
      vendorId: vo.vendorId,
      items: vo.items,
      subtotal: vo.subtotal,
      commission: vo.commission,
      vendorAmount: vo.vendorAmount,
      status: 'pending',
      deliveryOtp: Math.floor(100000 + Math.random() * 900000).toString(),
      statusHistory: [{ status: 'pending', timestamp: new Date(), note: 'Order created' }]
    }));

    // Calculate items total
    const itemsTotal = processedItems.reduce((sum: number, item: any) => sum + ((item.price + (item.lens?.price || 0)) * item.quantity), 0)

    // Calculate shipping charge based on pincode
    let shippingCharge = 0

    if (shippingAddress?.zipCode) {
      const pincodeData = await Pincode.findOne({
        pincode: shippingAddress.zipCode,
        isServiceable: true
      })

      if (pincodeData && pincodeData.deliveryRules && pincodeData.deliveryRules.length > 0) {
        // Sort rules by minOrderValue descending to find the highest matching threshold
        const sortedRules = [...pincodeData.deliveryRules].sort((a, b) => b.minOrderValue - a.minOrderValue)

        const applicableRule = sortedRules.find(rule => itemsTotal >= rule.minOrderValue)

        if (applicableRule) {
          shippingCharge = applicableRule.deliveryCharge
        }
      }
    }

    // Verify final total matches
    const calculatedTotal = itemsTotal + shippingCharge

    // Handle Manual Payment
    if (paymentMethod === 'manual') {
      const order = await Order.create({
        userId,
        items: processedItems,
        vendorOrders,
        total: calculatedTotal,
        totalCommission,
        shippingCharge,
        shippingAddress,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        paymentProof,
        utrNumber,
        verificationStatus: 'pending',
        manualPaymentDetails: {
          method: 'manual',
          submittedAt: new Date()
        }
      })

      // Trigger referral reward for referrer if this is user's first order
      checkAndTriggerReferralReward(userId).catch(err => console.error('Referral trigger error:', err))

      // If a coupon was applied, increment timesUsed
      if (req.body.couponCode) {
        Coupon.findOneAndUpdate({ code: String(req.body.couponCode).trim().toUpperCase() }, { $inc: { timesUsed: 1 } }).catch(() => {})
      }

      return res.json({
        orderId: order._id,
        manual: true,
        success: true
      })
    }

    // Default: Razorpay Flow
    if (!razorpay) {
      throw new Error('Razorpay keys are not configured')
    }

    const order = await Order.create({
      userId,
      items: processedItems,
      vendorOrders,
      total: calculatedTotal,
      totalCommission,
      shippingCharge,
      shippingAddress,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    })

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(calculatedTotal * 100),
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
      },
    })

    // Update order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id
    await order.save()

    res.json({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Verify payment
router.post('/verify-payment', async (req: Request, res: Response) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body

    // Find order
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    const data = `${order.razorpayOrderId}|${razorpayPaymentId}`
    hmac.update(data)
    const generated_signature = hmac.digest('hex')

    if (generated_signature === razorpaySignature) {
      // Payment verified
      order.paymentStatus = 'completed'
      order.orderStatus = 'confirmed'
      order.razorpayPaymentId = razorpayPaymentId
      order.razorpaySignature = razorpaySignature
      await order.save()

      // Increment totalOrders for products
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { totalOrders: item.quantity } })
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        order,
      })
    } else {
      // Payment failed
      order.paymentStatus = 'failed'
      await order.save()

      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get user orders
router.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId
    const authUserId = (req as any).user.id

    // Only allow users to view their own orders
    if (userId !== authUserId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const orders = await Order.find({ userId })
      .populate('items.productId', 'title thumbnail price sku category brand')
      .populate({
        path: 'items.productId',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'brand', select: 'name' }
        ]
      })
      .populate('items.vendorId', 'businessName email')
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get single order
router.get('/:orderId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params
    const userId = (req as any).user.id

    const order = await Order.findById(orderId)
      .populate('items.productId')
      .populate({
        path: 'items.productId',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'brand', select: 'name' }
        ]
      })
      .populate('items.vendorId', 'businessName email')

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Only allow users to view their own order
    if (order.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    res.json(order)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Get all orders
router.get('/admin/all', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'name email')
      .populate('items.productId')
      .populate({
        path: 'items.productId',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'brand', select: 'name' }
        ]
      })
      .populate('items.vendorId', 'businessName email')
      .populate('vendorOrders.vendorId', 'businessName email')
      .sort({ createdAt: -1 })
    res.json(orders)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Verify Manual Payment
router.post('/:id/verify-manual-payment', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log('[BACKEND] Verify manual payment request received')
    console.log('[BACKEND] Order ID:', req.params.id)
    console.log('[BACKEND] Action:', req.body.action)
    console.log('[BACKEND] Note:', req.body.note)

    const { action, note } = req.body // action: 'approve' | 'reject'
    const order = await Order.findById(req.params.id)

    if (!order) {
      console.log('[BACKEND] Order not found!')
      return res.status(404).json({ error: 'Order not found' })
    }

    console.log('[BACKEND] Order found:', order._id)
    console.log('[BACKEND] Current payment status:', order.paymentStatus)
    console.log('[BACKEND] Current order status:', order.orderStatus)

    if (action === 'approve') {
      console.log('[BACKEND] Approving payment...')
      order.paymentStatus = 'completed'
      order.orderStatus = 'confirmed'
      order.verificationStatus = 'approved'
      order.statusHistory.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: note || 'Manual payment approved by admin'
      })

      // Increment totalOrders for products
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { totalOrders: item.quantity } })
      }
      console.log('[BACKEND] Payment approved, new status:', order.paymentStatus)
    } else if (action === 'reject') {
      console.log('[BACKEND] Rejecting payment...')
      order.paymentStatus = 'failed'
      order.orderStatus = 'cancelled'
      order.verificationStatus = 'rejected'
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: note || 'Manual payment rejected by admin'
      })
      console.log('[BACKEND] Payment rejected, new status:', order.paymentStatus)
    } else {
      console.log('[BACKEND] Invalid action:', action)
      return res.status(400).json({ error: 'Invalid action' })
    }

    await order.save()
    console.log('[BACKEND] Order saved successfully')
    console.log('[BACKEND] Final payment status:', order.paymentStatus)
    console.log('[BACKEND] Final order status:', order.orderStatus)

    res.json(order)
  } catch (error: any) {
    console.error('[BACKEND] Error in verify-manual-payment:', error)
    res.status(500).json({ error: error.message })
  }
})

// Admin: Update order status
router.patch('/:id/status', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Update status
    order.orderStatus = status

    // Add to history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    })

    await order.save()
    res.json(order)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
