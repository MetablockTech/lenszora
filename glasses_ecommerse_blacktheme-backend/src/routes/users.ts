import express from 'express'
import { User } from '../models/User'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = express.Router()

// Get all users (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 })
        res.json(users)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Update user role (Admin only)
router.patch('/:id/role', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body
        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' })
        }
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password')
        if (!user) return res.status(404).json({ error: 'User not found' })
        res.json(user)
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
