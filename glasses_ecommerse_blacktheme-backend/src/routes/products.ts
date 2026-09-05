import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Product } from '../models/Product'
import { Setting } from '../models/Setting'
import { requireAuth, requireAdmin, requireVendorOrAdmin, AuthRequest } from '../middleware/auth'

const router = express.Router()

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'products')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})
const upload = multer({ storage })

// Get all products (Admin/Public with optional status filter)
router.get('/', async (req, res) => {
  try {
    const {
      status, isBestSeller, isFeatured, sort, limit,
      category, brand, minPrice, maxPrice,
      gender, frameType, frameShape, frameMaterial, weightGroup, faceShape,
      vendorId, isBulk, search
    } = req.query

    const filter: any = {}

    if (vendorId) filter.vendorId = vendorId

    if (search) {
      const searchStr = String(search).trim();
      filter.$or = [
        { title: { $regex: searchStr, $options: 'i' } },
        { description: { $regex: searchStr, $options: 'i' } },
        { searchTags: { $regex: searchStr, $options: 'i' } }
      ]
    }
    
    // Default: Hide bulk products from retail shop
    if (isBulk === 'true') {
      filter.isBulk = true
    } else if (isBulk === 'false') {
      filter.isBulk = false
    } else {
      filter.isBulk = { $ne: true }
    }

    // Status filter
    if (status) filter.status = status
    if (isBestSeller === 'true') filter.isBestSeller = true
    if (isFeatured === 'true') filter.isFeatured = true

    // Category filter (support ID or slug) - includes all descendant categories
    if (category) {
      const { Category } = require('../models/Category')
      let categoryId: any

      if (typeof category === 'string' && category.match(/^[0-9a-fA-F]{24}$/)) {
        categoryId = category
      } else {
        const cat = await Category.findOne({ slug: category })
        if (cat) categoryId = cat._id
      }

      if (categoryId) {
        // Recursively get all descendant category IDs
        const getAllDescendantIds = async (catId: any): Promise<any[]> => {
          const children = await Category.find({ parentId: catId })
          if (children.length === 0) return [catId]

          let allIds = [catId]
          for (const child of children) {
            const descendantIds = await getAllDescendantIds(child._id)
            allIds = [...allIds, ...descendantIds]
          }
          return allIds
        }

        const categoryIds = await getAllDescendantIds(categoryId)
        filter.category = { $in: categoryIds }
      }
    }

    // Brand filter (support ID or slug)
    if (brand) {
      if (typeof brand === 'string' && brand.match(/^[0-9a-fA-F]{24}$/)) {
        filter.brand = brand
      } else {
        const { Brand } = require('../models/Brand')
        const b = await Brand.findOne({ slug: brand })
        if (b) filter.brand = b._id
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }

    // Eyewear details filters
    if (gender) filter['eyewearDetails.gender'] = gender
    if (frameType) filter['eyewearDetails.frameType'] = frameType
    if (frameShape) filter['eyewearDetails.frameShape'] = frameShape
    if (frameMaterial) filter['eyewearDetails.frameMaterial'] = frameMaterial
    if (weightGroup) filter['eyewearDetails.weightGroup'] = weightGroup
    if (faceShape) filter['eyewearDetails.faceShape'] = { $in: [faceShape] }

    let query = Product.find(filter)

    // Handle sorting
    if (sort) {
      const sortStr = sort as string
      if (sortStr.includes(':')) {
        const [field, order] = sortStr.split(':')
        query = query.sort({ [field]: order === 'desc' || order === '-1' ? -1 : 1 })
      } else {
        query = query.sort(sortStr)
      }
    } else {
      query = query.sort({ createdAt: -1 })
    }

    // Handle limit
    if (limit) {
      query = query.limit(parseInt(limit as string))
    }

    const products = await query
      .populate('category')
      .populate('brand')
      .lean()
    res.json(products)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get product counts by status (Admin Only)
router.get('/stats/counts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const counts = await Product.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    // Format as a simple object: { active: 10, pending: 5, etc. }
    const formattedCounts = counts.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count
      return acc
    }, { active: 0, inactive: 0, pending: 0, rejected: 0 })

    res.json(formattedCounts)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Update product status (Admin Only)
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body
    if (!['active', 'inactive', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const updateData: any = { status }
    if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason || ''
    } else {
      updateData.rejectionReason = undefined // Clear reason if approved or set to pending
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )

    if (!product) return res.status(404).json({ error: 'Not found' })
    res.json(product)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get vendor's own products
router.get('/vendor/me', requireAuth, requireVendorOrAdmin, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query
    const filter: any = {}
    if (req.user!.role === 'vendor') {
      filter.vendorId = req.user!.vendorId || req.user!.id
    }
    if (status) filter.status = status

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .populate('category')
      .populate('brand')
      .lean()
    res.json(products)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id)
      .populate('category')
      .populate('brand')
      .populate('vendorId')
      .populate('lensSettings.lensTypes.lensTypeId')
    if (!p) return res.status(404).json({ error: 'Not found' })
    res.json(p)
  } catch (err: any) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid product ID format' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireAuth, requireVendorOrAdmin, async (req: AuthRequest, res) => {
  const {
    title, description, price, images, thumbnail, stock, category, brand,
    productType, sku, unit, searchTags, minOrderQuantity,
    discountAmount, discountType, shippingCost, shippingCostMultiply,
    status, colors, attributes, variants, hasVariants, returnPolicy,
    vendorId, eyewearDetails, lensSettings, isBulk
  } = req.body

  if (!title || price == null || !sku || !unit) {
    return res.status(400).json({ error: 'Missing required fields (title, price, sku, unit)' })
  }

  try {
    // Determine vendorId
    let finalVendorId = vendorId
    if (req.user!.role === 'vendor' || !finalVendorId || finalVendorId === '') {
      finalVendorId = req.user!.vendorId || req.user!.id
    }

    if (!finalVendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' })
    }

    // Sanitize category & brand (convert empty strings or 'none' to null)
    const finalCategory = (category && category !== '' && category !== 'none') ? category : null
    const finalBrand = (brand && brand !== '' && brand !== 'none') ? brand : null

    // New products from vendors are 'pending' by default unless auto-approval is enabled.
    // Admins can specify status.
    let finalStatus = status
    if (req.user!.role === 'vendor') {
      const autoApproveSetting = await Setting.findOne({ key: 'autoApproveVendorProducts' })
      const isAutoApprove = autoApproveSetting?.value === true || autoApproveSetting?.value === 'true'
      finalStatus = isAutoApprove ? 'active' : 'pending'
    } else if (req.user!.role === 'admin') {
      finalStatus = status || 'active'
    }

    const product = new Product({
      title, description, price, images: images || [], thumbnail: thumbnail || (images && images[0]) || undefined, stock: stock || 0,
      category: finalCategory, brand: finalBrand,
      vendorId: finalVendorId,
      productType: productType || 'physical',
      sku, unit, searchTags: searchTags || [],
      minOrderQuantity: minOrderQuantity || 1,
      discountAmount: discountAmount || 0,
      discountType: discountType || 'flat',
      shippingCost: shippingCost || 0,
      shippingCostMultiply: shippingCostMultiply || false,
      status: finalStatus,
      colors: colors || [],
      attributes: attributes || [],
      variants: variants || [],
      hasVariants: hasVariants || false,
      returnPolicy: returnPolicy || undefined,
      eyewearDetails: eyewearDetails || undefined,
      lensSettings: lensSettings || undefined,
      isBulk: isBulk === true || isBulk === 'true'
    })
    await product.save()
    res.json(product)
  } catch (err: any) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0]
      return res.status(400).json({ error: `Duplicate value for ${field}. Please use a unique ${field}.` })
    }
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', requireAuth, requireVendorOrAdmin, async (req: AuthRequest, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })

    // Check ownership
    if (req.user!.role === 'vendor' && product.vendorId.toString() !== (req.user!.vendorId || req.user!.id)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this product' })
    }

    // Vendors cannot change status once it's set (usually back to pending if they edit? 
    // For now let's say if a vendor edits an active product, it stays active or goes back to pending?
    // In many marketplaces, edits trigger re-approval. For now, let's keep it simple.
    const updateData = { ...req.body }
    if (updateData.category === '' || updateData.category === 'none') updateData.category = null
    if (updateData.brand === '' || updateData.brand === 'none') updateData.brand = null
    if (updateData.vendorId === '') {
      updateData.vendorId = req.user!.vendorId || req.user!.id
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true })
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireAuth, requireVendorOrAdmin, async (req: AuthRequest, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })

    // Check ownership
    if (req.user!.role === 'vendor' && product.vendorId.toString() !== (req.user!.vendorId || req.user!.id)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this product' })
    }

    await Product.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/upload', requireAuth, requireVendorOrAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const publicPath = `/uploads/products/${req.file.filename}`
  res.json({ path: publicPath })
})

export default router
