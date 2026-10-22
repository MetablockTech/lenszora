import express from 'express'
import { User } from '../models/User'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'
import { referrerDisplayName } from '../utils/referral'

const router = express.Router()

const PROFILE_FIELDS = 'name email phone alternatePhone gender dateOfBirth avatar prescription role referralCode referralCount wishlist createdAt updatedAt'

// [min, max] allowed for each eye power value
const EYE_POWER_RANGES: Record<string, [number, number]> = {
    sph: [-25, 25],
    cyl: [-10, 10],
    axis: [0, 180],
    add: [0, 4]
}

function parseEyePower(raw: any, eye: string) {
    if (!raw || typeof raw !== 'object') return undefined
    const result: Record<string, number> = {}
    for (const [key, [min, max]] of Object.entries(EYE_POWER_RANGES)) {
        const value = raw[key]
        if (value === undefined || value === null || value === '') continue
        const num = Number(value)
        if (!Number.isFinite(num) || num < min || num > max) {
            throw new Error(`${eye} eye ${key.toUpperCase()} must be between ${min} and ${max}`)
        }
        result[key] = num
    }
    return Object.keys(result).length ? result : undefined
}

function parsePrescription(raw: any) {
    if (!raw || typeof raw !== 'object') return undefined
    const result: Record<string, any> = {}
    const right = parseEyePower(raw.right, 'Right')
    const left = parseEyePower(raw.left, 'Left')
    if (right) result.right = right
    if (left) result.left = left
    if (raw.pd !== undefined && raw.pd !== null && raw.pd !== '') {
        const pd = Number(raw.pd)
        if (!Number.isFinite(pd) || pd < 40 || pd > 80) throw new Error('PD must be between 40 and 80 mm')
        result.pd = pd
    }
    if (raw.prescribedOn) {
        const date = new Date(raw.prescribedOn)
        if (isNaN(date.getTime()) || date > new Date()) throw new Error('Invalid prescription date')
        result.prescribedOn = date
    }
    if (raw.notes) result.notes = String(raw.notes).trim().slice(0, 500)
    return Object.keys(result).length ? result : undefined
}

// Get logged-in user's profile
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
    try {
        const user = await User.findById(req.user!.id)
            .select(`${PROFILE_FIELDS} referredBy`)
            .populate<{ referredBy?: { name?: string; phone: string } }>('referredBy', 'name phone')
            .lean()
        if (!user) return res.status(404).json({ error: 'User not found' })
        const { referredBy, ...profile } = user
        res.json({ ...profile, referredByName: referredBy ? referrerDisplayName(referredBy) : undefined })
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Update logged-in user's profile (phone is the login id and cannot be changed here)
router.put('/me', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { name, email, alternatePhone, gender, dateOfBirth, avatar, prescription } = req.body
        const update: Record<string, any> = {}
        const unset: Record<string, 1> = {}

        if (name !== undefined) update.name = String(name).trim()

        if (alternatePhone !== undefined) {
            const digits = String(alternatePhone).replace(/[\s-]/g, '')
            if (!digits) {
                unset.alternatePhone = 1
            } else {
                if (!/^\+?\d{10,13}$/.test(digits)) {
                    return res.status(400).json({ error: 'Invalid alternate phone number' })
                }
                update.alternatePhone = digits
            }
        }

        if (gender !== undefined) {
            if (!gender) unset.gender = 1
            else if (['male', 'female', 'other'].includes(gender)) update.gender = gender
            else return res.status(400).json({ error: 'Invalid gender' })
        }

        if (dateOfBirth !== undefined) {
            if (!dateOfBirth) {
                unset.dateOfBirth = 1
            } else {
                const dob = new Date(dateOfBirth)
                if (isNaN(dob.getTime()) || dob > new Date() || dob.getFullYear() < 1900) {
                    return res.status(400).json({ error: 'Invalid date of birth' })
                }
                update.dateOfBirth = dob
            }
        }

        if (avatar !== undefined) {
            if (!avatar) unset.avatar = 1
            else if (typeof avatar === 'string' && /^(\/uploads\/|https?:\/\/)/.test(avatar)) update.avatar = avatar
            else return res.status(400).json({ error: 'Invalid avatar URL' })
        }

        if (prescription !== undefined) {
            let parsed
            try {
                parsed = parsePrescription(prescription)
            } catch (e: any) {
                return res.status(400).json({ error: e.message })
            }
            if (parsed) update.prescription = parsed
            else unset.prescription = 1
        }

        if (email !== undefined) {
            const trimmed = String(email).trim().toLowerCase()
            if (!trimmed) {
                unset.email = 1
            } else {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                    return res.status(400).json({ error: 'Invalid email address' })
                }
                const taken = await User.exists({ email: trimmed, _id: { $ne: req.user!.id } })
                if (taken) return res.status(400).json({ error: 'Email is already in use' })
                update.email = trimmed
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user!.id,
            { $set: update, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
            { new: true }
        ).select(PROFILE_FIELDS).lean()
        if (!user) return res.status(404).json({ error: 'User not found' })
        res.json(user)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

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
