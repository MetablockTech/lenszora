import express from 'express'
import { Store } from '../models/Store'
import { requireAuth, requireAdmin, requireVendorOrAdmin, AuthRequest } from '../middleware/auth'

const router = express.Router()

// Get all stores (Public)
router.get('/', async (req, res) => {
  try {
    const { city, state, pincode, isActive, vendorId } = req.query
    const filter: any = {}
    
    if (city) filter.city = new RegExp(city as string, 'i')
    if (state) filter.state = new RegExp(state as string, 'i')
    if (pincode) filter.pincode = pincode
    if (vendorId) filter.vendorId = vendorId
    
    // Handle isActive filter
    if (isActive === 'true') filter.isActive = true
    else if (isActive === 'false') filter.isActive = false
    else if (isActive === 'all') { /* Don't filter by isActive */ }
    else filter.isActive = true // Default to active only for public

    const stores = await Store.find(filter).populate('vendorId', 'businessName').sort({ createdAt: -1 }).lean()
    res.json(stores)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get single store
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('vendorId', 'businessName').lean()
    if (!store) return res.status(404).json({ error: 'Store not found' })
    res.json(store)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Create store (Admin/Vendor)
router.post('/', requireAuth, requireVendorOrAdmin, async (req: AuthRequest, res) => {
  try {
    const storeData = { ...req.body }
    
    if (req.user!.role === 'vendor') {
      storeData.vendorId = req.user!.vendorId || req.user!.id
    }

    const store = new Store(storeData)
    await store.save()
    res.status(201).json(store)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Update store
router.put('/:id', requireAuth, requireVendorOrAdmin, async (req: AuthRequest, res) => {
  try {
    const store = await Store.findById(req.params.id)
    if (!store) return res.status(404).json({ error: 'Store not found' })

    // Selection check
    if (req.user!.role === 'vendor' && store.vendorId?.toString() !== (req.user!.vendorId || req.user!.id)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this store' })
    }

    const updated = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Delete store
router.delete('/:id', requireAuth, requireVendorOrAdmin, async (req: AuthRequest, res) => {
  try {
    const store = await Store.findById(req.params.id)
    if (!store) return res.status(404).json({ error: 'Store not found' })

    if (req.user!.role === 'vendor' && store.vendorId?.toString() !== (req.user!.vendorId || req.user!.id)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await Store.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
