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
    } else if (!storeData.vendorId || storeData.vendorId === '' || storeData.vendorId === 'none') {
      delete storeData.vendorId
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
    const { id } = req.params
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Valid Store ID is required' })
    }

    let store = null
    try {
      store = await Store.findById(id)
    } catch (e) {
      // Catch CastError if ID is a custom string
    }

    if (!store) {
      store = await Store.findOne({ _id: id })
    }

    if (!store) return res.status(404).json({ error: 'Store not found' })

    // Selection check - only restrict if user is vendor and doesn't own this store
    if (req.user!.role === 'vendor' && store.vendorId?.toString() !== (req.user!.vendorId || req.user!.id)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this store' })
    }

    const updateData = { ...req.body }
    delete updateData._id
    delete updateData.id

    if (updateData.vendorId === '' || updateData.vendorId === 'none') {
      delete updateData.vendorId
    }

    // If location is provided, ensure valid coordinates array
    if (updateData.location) {
      if (!updateData.location.coordinates || !Array.isArray(updateData.location.coordinates) || updateData.location.coordinates.length < 2) {
        delete updateData.location
      }
    }

    let updated = null
    try {
      updated = await Store.findByIdAndUpdate(store._id, updateData, { new: true, runValidators: false })
    } catch (e) {
      updated = await Store.findOneAndUpdate({ _id: store._id }, updateData, { new: true, runValidators: false })
    }

    if (!updated) {
      return res.status(404).json({ error: 'Failed to update store' })
    }

    res.json(updated)
  } catch (err: any) {
    console.error('Store update error:', err)
    res.status(400).json({ error: err.message || 'Failed to update store' })
  }
})

// Delete store
router.delete('/:id', requireAuth, requireVendorOrAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Valid Store ID is required' })
    }

    let store = null
    try {
      store = await Store.findById(id)
    } catch (e) {
      // ignore
    }
    if (!store) {
      store = await Store.findOne({ _id: id })
    }

    if (!store) return res.status(404).json({ error: 'Store not found' })

    if (req.user!.role === 'vendor' && store.vendorId?.toString() !== (req.user!.vendorId || req.user!.id)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    try {
      await Store.findByIdAndDelete(store._id)
    } catch (e) {
      await Store.deleteOne({ _id: store._id })
    }

    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete store' })
  }
})

export default router
