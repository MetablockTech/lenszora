import express from 'express'
import { User } from '../models/User'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = express.Router()

// Get all users (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean()
        res.json(users)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Update user role (Admin only)
router.patch('/:id/role', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body
        if (!['admin', 'user', 'vendor', 'agent'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' })
        }
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password')
        if (!user) return res.status(404).json({ error: 'User not found' })
        res.json(user)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Sync user's active cart
router.post('/cart/sync', requireAuth, async (req, res) => {
    try {
        const userId = (req as any).user.id
        const { cart } = req.body
        const user = await User.findByIdAndUpdate(
            userId,
            { cart: Array.isArray(cart) ? cart : [] },
            { new: true }
        ).select('-password')
        res.json({ message: 'Cart synced successfully', cart: user?.cart || [] })
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Get user's active cart
router.get('/cart', requireAuth, async (req, res) => {
    try {
        const userId = (req as any).user.id
        const user = await User.findById(userId).select('cart')
        res.json(user?.cart || [])
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Get users with active carts or wishlists (Admin only - Lead Generation)
router.get('/leads/active', requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({
            $or: [
                { 'cart.0': { $exists: true } },
                { 'wishlist.0': { $exists: true } }
            ]
        })
        .select('-password')
        .populate('wishlist', 'title price image category brand stock inStock')
        .sort({ updatedAt: -1 })
        .lean()

        res.json(users)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Delete user (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id)
        if (!user) return res.status(404).json({ error: 'User not found' })
        res.json({ message: 'User deleted successfully' })
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

export default router
