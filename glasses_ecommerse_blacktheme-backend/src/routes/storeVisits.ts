import express from 'express'
import crypto from 'crypto'
import { Types } from 'mongoose'
import { StoreVisit } from '../models/StoreVisit'
import { Product } from '../models/Product'
import { Store } from '../models/Store'
import { Vendor } from '../models/Vendor'
import { User } from '../models/User'
import { Commission } from '../models/Commission'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'
import { vendorAuth } from '../middleware/vendorAuth'
import { getSellingPrice } from '../utils/pricing'

const router = express.Router()

const PASS_VALID_DAYS_AFTER_VISIT = 3
const MAX_ACTIVE_PASSES_PER_USER = 10
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L to avoid misreading

function generateCode() {
  let out = ''
  for (let i = 0; i < 8; i++) out += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]
  return `LZV-${out}`
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const normalizeCode = (c: unknown) => String(c || '').trim().toUpperCase().replace(/\s+/g, '')
const maskPhone = (p: string) => (p.length > 4 ? `${'*'.repeat(Math.max(0, p.length - 4))}${p.slice(-4)}` : p)

// Passes not used by their expiry become 'expired'
async function expireOldPasses() {
  await StoreVisit.updateMany({ status: 'booked', expiresAt: { $lt: new Date() } }, { $set: { status: 'expired' } })
}

// Product.vendorId / Store.vendorId may hold the Vendor id or (legacy) the vendor's user id
async function resolveVendor(id: unknown) {
  if (!id || !Types.ObjectId.isValid(String(id))) return null
  return Vendor.findOne({ $or: [{ _id: id }, { userId: id }] })
}

/* ------------------------------ Customer ------------------------------ */

// Reserve a product for a store visit and get a visit pass
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { productId, storeId, visitDate, variantSku, color } = req.body
    if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ error: 'Product and store are required' })
    }

    const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    if (typeof visitDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(visitDate) || visitDate < todayStr() || visitDate > maxDate) {
      return res.status(400).json({ error: 'Please choose a visit date within the next 30 days' })
    }

    const [product, store, user] = await Promise.all([
      Product.findById(productId),
      Store.findById(storeId),
      User.findById(req.user!.id).select('name phone')
    ])
    if (!product || product.status !== 'active') return res.status(404).json({ error: 'Product not available' })
    if (!store || store.isActive === false) return res.status(404).json({ error: 'Store not available' })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const [productVendor, storeVendor] = await Promise.all([resolveVendor(product.vendorId), resolveVendor(store.vendorId)])
    if (!productVendor || !storeVendor || !productVendor._id.equals(storeVendor._id)) {
      return res.status(400).json({ error: 'This product is not sold at the selected store' })
    }

    // Same product + store already reserved: reuse that pass instead of creating duplicates
    const existing = await StoreVisit.findOne({ userId: user._id, productId, storeId, status: 'booked', expiresAt: { $gte: new Date() } })
    if (existing) {
      existing.visitDate = visitDate
      existing.expiresAt = new Date(new Date(`${visitDate}T23:59:59`).getTime() + PASS_VALID_DAYS_AFTER_VISIT * 86400000)
      await existing.save()
      return res.json(existing)
    }

    const active = await StoreVisit.countDocuments({ userId: user._id, status: 'booked', expiresAt: { $gte: new Date() } })
    if (active >= MAX_ACTIVE_PASSES_PER_USER) {
      return res.status(429).json({ error: 'You have too many active store visit passes. Cancel one to book another.' })
    }

    const variant = variantSku ? product.variants?.find((v: any) => v.sku === variantSku) : null
    const settings = await Commission.findOne().lean()
    const commissionRate = Number(productVendor.commissionRate ?? settings?.defaultRate ?? 15)

    let code = generateCode()
    for (let i = 0; i < 5 && await StoreVisit.exists({ code }); i++) code = generateCode()

    const visit = await StoreVisit.create({
      code,
      userId: user._id,
      customerName: user.name,
      customerPhone: user.phone,
      productId: product._id,
      productTitle: product.title,
      productImage: variant?.images?.[0] || product.thumbnail || product.images?.[0],
      variantSku: variant?.sku,
      color: typeof color === 'string' ? color.slice(0, 60) : undefined,
      storeId: store._id,
      vendorId: productVendor._id,
      visitDate,
      expiresAt: new Date(new Date(`${visitDate}T23:59:59`).getTime() + PASS_VALID_DAYS_AFTER_VISIT * 86400000),
      priceAtBooking: getSellingPrice(product, variant),
      commissionRate
    })
    res.status(201).json(visit)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Customer's own passes
router.get('/my', requireAuth, async (req: AuthRequest, res) => {
  try {
    await expireOldPasses()
    const visits = await StoreVisit.find({ userId: req.user!.id })
      .populate('storeId', 'name addressLine city state pincode phone location')
      .select('-commissionRate -commissionAmount -commissionStatus -commissionCollectedAt -flagged')
      .sort({ createdAt: -1 })
      .lean()
    res.json(visits)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const visit = await StoreVisit.findOne({ _id: req.params.id, userId: req.user!.id })
    if (!visit) return res.status(404).json({ error: 'Visit not found' })
    if (visit.status !== 'booked') return res.status(400).json({ error: 'Only upcoming visits can be cancelled' })
    visit.status = 'cancelled'
    visit.closedAt = new Date()
    await visit.save()
    res.json(visit)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Follow-up: "Did you buy this product at the store?"
// A "yes" without a vendor-recorded sale is flagged for admin review.
router.post('/:id/feedback', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { purchased } = req.body
    if (typeof purchased !== 'boolean') return res.status(400).json({ error: 'purchased must be true or false' })

    const visit = await StoreVisit.findOne({ _id: req.params.id, userId: req.user!.id })
    if (!visit) return res.status(404).json({ error: 'Visit not found' })
    if (visit.status === 'cancelled') return res.status(400).json({ error: 'This visit was cancelled' })
    if (visit.status === 'booked' && visit.visitDate > todayStr()) {
      return res.status(400).json({ error: 'You can answer after your visit date' })
    }

    visit.customerSaysPurchased = purchased
    visit.customerFeedbackAt = new Date()
    visit.flagged = purchased && visit.status !== 'sold'
    await visit.save()
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/* ------------------------------- Vendor ------------------------------- */

router.get('/vendor', vendorAuth, async (req: AuthRequest, res) => {
  try {
    await expireOldPasses()
    const filter: any = { vendorId: req.user!.vendorId }
    if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status
    const visits = await StoreVisit.find(filter)
      .populate('storeId', 'name city')
      .select('-flagged -customerSaysPurchased -customerFeedbackAt')
      .sort({ visitDate: 1, createdAt: -1 })
      .limit(500)
      .lean()
    res.json(visits.map((v) => ({ ...v, customerPhone: maskPhone(v.customerPhone) })))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Vendor scans the QR / enters the code at the store. Opening a valid pass marks the visit as verified.
router.get('/vendor/code/:code', vendorAuth, async (req: AuthRequest, res) => {
  try {
    await expireOldPasses()
    const visit = await StoreVisit.findOne({ code: normalizeCode(req.params.code), vendorId: req.user!.vendorId })
      .populate('storeId', 'name city')
    if (!visit) return res.status(404).json({ error: 'No visit pass with this code for your stores' })

    if (visit.status === 'booked') {
      visit.status = 'verified'
      visit.verifiedAt = new Date()
      await visit.save()
    }
    const out = visit.toObject()
    res.json({ ...out, customerPhone: maskPhone(out.customerPhone), flagged: undefined, customerSaysPurchased: undefined })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Vendor records the outcome of the visit
router.post('/vendor/code/:code/outcome', vendorAuth, async (req: AuthRequest, res) => {
  try {
    const { outcome, saleAmount, billNumber, reason } = req.body
    const visit = await StoreVisit.findOne({ code: normalizeCode(req.params.code), vendorId: req.user!.vendorId })
    if (!visit) return res.status(404).json({ error: 'No visit pass with this code for your stores' })
    if (!['booked', 'verified'].includes(visit.status)) {
      return res.status(400).json({ error: `This visit is already ${visit.status.replace('_', ' ')}` })
    }

    if (outcome === 'sold') {
      const amount = Number(saleAmount)
      if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Enter the sale amount' })
      visit.status = 'sold'
      visit.saleAmount = amount
      visit.billNumber = typeof billNumber === 'string' ? billNumber.trim().slice(0, 60) : undefined
      visit.commissionAmount = Math.round(amount * visit.commissionRate) / 100
      visit.commissionStatus = 'due'
    } else if (outcome === 'not_purchased') {
      visit.status = 'not_purchased'
      visit.notPurchasedReason = typeof reason === 'string' ? reason.trim().slice(0, 200) : undefined
    } else {
      return res.status(400).json({ error: 'outcome must be sold or not_purchased' })
    }

    visit.verifiedAt = visit.verifiedAt || new Date()
    visit.closedAt = new Date()
    visit.flagged = visit.customerSaysPurchased === true && visit.status !== 'sold'
    await visit.save()
    res.json({ ...visit.toObject(), customerPhone: maskPhone(visit.customerPhone), flagged: undefined, customerSaysPurchased: undefined })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/* -------------------------------- Admin ------------------------------- */

router.get('/admin', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    await expireOldPasses()
    const filter: any = {}
    const { status, vendorId, flagged, from, to } = req.query
    if (typeof status === 'string' && status) filter.status = status
    if (typeof vendorId === 'string' && Types.ObjectId.isValid(vendorId)) filter.vendorId = vendorId
    if (flagged === 'true') filter.flagged = true
    if (typeof from === 'string' && from) filter.visitDate = { ...(filter.visitDate || {}), $gte: from }
    if (typeof to === 'string' && to) filter.visitDate = { ...(filter.visitDate || {}), $lte: to }

    const visits = await StoreVisit.find(filter)
      .populate('storeId', 'name city')
      .populate('vendorId', 'businessName')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean()
    res.json(visits)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Per-vendor funnel: booked → verified → sold, plus commission due and suspicious signals
router.get('/admin/summary', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    await expireOldPasses()
    const rows = await StoreVisit.aggregate([
      {
        $group: {
          _id: '$vendorId',
          total: { $sum: 1 },
          upcoming: { $sum: { $cond: [{ $eq: ['$status', 'booked'] }, 1, 0] } },
          verified: { $sum: { $cond: [{ $in: ['$status', ['verified', 'sold', 'not_purchased']] }, 1, 0] } },
          sold: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] } },
          notPurchased: { $sum: { $cond: [{ $eq: ['$status', 'not_purchased'] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
          flagged: { $sum: { $cond: ['$flagged', 1, 0] } },
          salesAmount: { $sum: { $ifNull: ['$saleAmount', 0] } },
          commissionDue: { $sum: { $cond: [{ $eq: ['$commissionStatus', 'due'] }, { $ifNull: ['$commissionAmount', 0] }, 0] } },
          commissionCollected: { $sum: { $cond: [{ $eq: ['$commissionStatus', 'collected'] }, { $ifNull: ['$commissionAmount', 0] }, 0] } }
        }
      },
      { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
      { $addFields: { vendorName: { $ifNull: [{ $arrayElemAt: ['$vendor.businessName', 0] }, 'Unknown vendor'] } } },
      { $project: { vendor: 0 } },
      { $sort: { flagged: -1, total: -1 } }
    ])
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/admin/:id/commission-collected', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const visit = await StoreVisit.findById(req.params.id)
    if (!visit) return res.status(404).json({ error: 'Visit not found' })
    if (visit.commissionStatus !== 'due') return res.status(400).json({ error: 'No commission due on this visit' })
    visit.commissionStatus = 'collected'
    visit.commissionCollectedAt = new Date()
    await visit.save()
    res.json(visit)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
