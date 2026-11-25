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

// Helper to trigger referral coupon for referrer when referred user's first order is paid.
// Call only after payment is confirmed (Razorpay verified or manual payment approved).
async function checkAndTriggerReferralReward(userId: string) {
  try {
    // Atomic claim so duplicate payment callbacks can't create two coupons
    const user = await User.findOneAndUpdate(
      { _id: userId, hasPlacedFirstOrder: { $ne: true }, referredBy: { $ne: null } },
      { $set: { hasPlacedFirstOrder: true } },
      { new: true }
    )
    if (!user || !user.referredBy) return

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

// Re-check a coupon against the real cart total at order time (the checkout page may be out of date,
// e.g. items removed after applying). Returns the discount or an error message.
async function evaluateCoupon(code: any, userId: string, orderAmount: number): Promise<{ coupon?: any; discount: number; error?: string }> {
  const cleanCode = String(code || '').trim().toUpperCase()
  if (!cleanCode) return { discount: 0 }
  const coupon = await Coupon.findOne({ code: cleanCode, isActive: true })
  if (!coupon) return { discount: 0, error: 'Invalid or inactive coupon code' }
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) return { discount: 0, error: 'Coupon code has expired' }
  if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) return { discount: 0, error: 'Coupon usage limit reached' }
  if (coupon.userId && coupon.userId.toString() !== String(userId)) return { discount: 0, error: 'This coupon is assigned to another user' }
  if (orderAmount < (coupon.minOrderAmount || 0)) {
    return { discount: 0, error: `Coupon ${coupon.code} needs a minimum order of ₹${coupon.minOrderAmount}. Your cart total is now ₹${Math.round(orderAmount)}, so the coupon was removed.` }
  }
  let discount = coupon.discountType === 'percent' ? (orderAmount * coupon.discountValue) / 100 : coupon.discountValue
  if (coupon.discountType === 'percent' && coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount
  discount = Math.round(Math.min(discount, orderAmount))
  return { coupon, discount }
}

// Take ordered quantities out of stock once payment is confirmed (never below 0). Runs once per order.
async function deductStock(order: any) {
  if (order.stockDeducted) return
  for (const item of order.items) {
    const qty = Number(item.quantity) || 0
    if (!item.productId || qty <= 0) continue
    await Product.updateOne({ _id: item.productId }, [
      { $set: { stock: { $max: [0, { $subtract: [{ $ifNull: ['$stock', 0] }, qty] }] } } }
    ])
  }
  order.stockDeducted = true
}

// Put stock back when a paid order is cancelled or returned
async function restoreStock(order: any) {
  if (!order.stockDeducted) return
  for (const item of order.items) {
    const qty = Number(item.quantity) || 0
    if (!item.productId || qty <= 0) continue
    await Product.updateOne({ _id: item.productId }, { $inc: { stock: qty } })
  }
  order.stockDeducted = false
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

    // Coupon: validated again on the server against the real items total, and the discount is stored on the order
    const couponResult = await evaluateCoupon(req.body.couponCode, userId, itemsTotal)
    if (couponResult.error) {
      return res.status(400).json({ error: couponResult.error, couponInvalid: true })
    }
    const discount = couponResult.discount
    const couponCode = couponResult.coupon?.code

    // Share the discount between vendor orders in proportion to their subtotal (for vendor panels)
    if (discount > 0 && itemsTotal > 0) {
      let left = discount
      vendorOrders.forEach((vo: any, i: number) => {
        const share = i === vendorOrders.length - 1 ? left : Math.round((discount * vo.subtotal) / itemsTotal)
        vo.discount = share
        left -= share
      })
    }

    // Verify final total matches
    const calculatedTotal = Math.max(0, itemsTotal - discount) + shippingCharge

    // Handle Manual Payment
    if (paymentMethod === 'manual') {
      const order = await Order.create({
        userId,
        items: processedItems,
        vendorOrders,
        total: calculatedTotal,
        subtotal: itemsTotal,
        discount,
        couponCode,
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

      // If a coupon was applied, increment timesUsed
      if (couponCode) {
        Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { timesUsed: 1 } }).catch(() => {})
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
      subtotal: itemsTotal,
      discount,
      couponCode,
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
      // Repeated callback for an order that is already paid: nothing more to do
      if (order.paymentStatus === 'completed') {
        return res.json({ success: true, message: 'Payment verified successfully', order })
      }
      // Payment verified
      order.paymentStatus = 'completed'
      order.orderStatus = 'confirmed'
      order.razorpayPaymentId = razorpayPaymentId
      order.razorpaySignature = razorpaySignature
      order.statusHistory.push({ status: 'confirmed', timestamp: new Date(), note: 'Payment received' })
      await deductStock(order)
      await order.save()

      // Coupon is used up only once the payment has gone through
      if (order.couponCode) {
        Coupon.findOneAndUpdate({ code: order.couponCode }, { $inc: { timesUsed: 1 } }).catch(() => {})
      }

      // Increment totalOrders for products
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { totalOrders: item.quantity } })
      }

      // Payment confirmed: reward the referrer if this is the user's first paid order
      checkAndTriggerReferralReward(order.userId.toString()).catch(err => console.error('Referral trigger error:', err))

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
      await deductStock(order)
      console.log('[BACKEND] Payment approved, new status:', order.paymentStatus)

      // Payment confirmed: reward the referrer if this is the user's first paid order
      checkAndTriggerReferralReward(order.userId.toString()).catch(err => console.error('Referral trigger error:', err))
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

    // An order whose payment failed or is still unverified can't be confirmed, shipped or delivered
    const fulfilment = ['confirmed', 'shipped', 'delivered', 'partially_shipped', 'partially_delivered']
    if (fulfilment.includes(status) && order.paymentStatus !== 'completed') {
      const why = order.paymentStatus === 'failed' ? 'the payment failed' : 'the payment is not confirmed yet'
      return res.status(400).json({ error: `Cannot mark this order as ${status}: ${why}.` })
    }

    // Stock: taken out when a paid order moves forward, put back if it is cancelled or returned
    if (fulfilment.includes(status)) await deductStock(order)
    if (['cancelled', 'returned', 'refunded'].includes(status)) await restoreStock(order)

    // Update status
    order.orderStatus = status

    // Add to history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    })

    // Sync vendorOrders status if present
    if (order.vendorOrders && order.vendorOrders.length > 0) {
      order.vendorOrders.forEach(vo => {
        vo.status = status as any
        vo.statusHistory.push({
          status,
          timestamp: new Date(),
          note: note || `Status updated to ${status} by admin`
        })
      })
    }

    await order.save()
    res.json(order)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
