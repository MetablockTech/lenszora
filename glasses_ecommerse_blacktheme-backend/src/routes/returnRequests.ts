import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { ReturnRequest } from '../models/ReturnRequest'
import { Order } from '../models/Order'
import { Product } from '../models/Product'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = express.Router()

// Image upload configuration
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'returns')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})
const upload = multer({ storage })

// --- User Routes ---

// Create a new return/refund request
router.post('/', requireAuth, async (req: any, res) => {
    try {
        const { orderId, productId, requestType, reason, description, images, variantSku } = req.body
        const userId = (req as any).user.id

        // 1. Validate Order
        const order = await Order.findOne({ _id: orderId, userId: userId })
        if (!order) {
            return res.status(404).json({ error: 'Order not found or access denied' })
        }

        // 2. Validate Product in Order
        const orderItem = order.items.find((item: any) =>
            item.productId.toString() === productId &&
            (!variantSku || item.variant?.sku === variantSku)
        )

        if (!orderItem) {
            return res.status(404).json({ error: 'Product not found in this order' })
        }

        // 3. Validate Return Policy (Date check)
        // In a real app, we would check if the return period has expired based on delivery date
        // For now, we'll allow it if order is delivered
        /*
        if (order.status !== 'delivered') {
          return res.status(400).json({ error: 'Order must be delivered before requesting return' })
        }
        */

        // 4. Check for existing request
        const existingRequest = await ReturnRequest.findOne({
            orderId,
            productId,
            variantSku: variantSku || null
        })

        if (existingRequest) {
            return res.status(400).json({ error: 'A request already exists for this item' })
        }

        // 5. Create Request
        const request = new ReturnRequest({
            orderId,
            productId,
            userId,
            variantSku,
            requestType,
            reason,
            description,
            images: images || [],
            status: 'pending'
        })

        await request.save()
        res.status(201).json(request)

    } catch (err: any) {
        console.error(err)
        res.status(500).json({ error: err.message || 'Failed to create request' })
    }
})

// Get user's return requests
router.get('/', requireAuth, async (req: any, res) => {
    try {
        const requests = await ReturnRequest.find({ userId: (req as any).user.id })
            .sort({ createdAt: -1 })
            .populate('productId', 'title thumbnail')
            .populate('orderId', 'orderNumber')

        res.json(requests)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// --- Admin Routes ---

// Get all requests (with filters)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status, type } = req.query
        const filter: any = {}

        if (status && status !== 'all') filter.status = status
        if (type && type !== 'all') filter.requestType = type

        const requests = await ReturnRequest.find(filter)
            .sort({ createdAt: -1 })
            .populate('productId', 'title thumbnail price')
            .populate('orderId', 'orderNumber user')
            .populate('userId', 'email name') // Assuming User model has name

        res.json(requests)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// Update request status
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status, adminNotes, refundAmount } = req.body

        const request = await ReturnRequest.findById(req.params.id)
        if (!request) {
            return res.status(404).json({ error: 'Request not found' })
        }

        request.status = status
        if (adminNotes) request.adminNotes = adminNotes
        if (refundAmount) request.refundAmount = refundAmount
        if (status === 'approved' || status === 'rejected' || status === 'completed') {
            request.respondedAt = new Date()
        }

        await request.save()
        res.json(request)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// Upload return proof images
router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const publicPath = `/uploads/returns/${req.file.filename}`
    res.json({ path: publicPath })
})

export default router
