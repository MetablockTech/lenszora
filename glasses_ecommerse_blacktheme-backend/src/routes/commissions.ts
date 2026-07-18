import { Router } from 'express'
import { Commission } from '../models/Commission'
import { auth, AuthRequest } from '../middleware/auth'

const router = Router()

// Admin: Get commission settings
router.get('/', auth, async (req: AuthRequest, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' })
        }

        let commission = await Commission.findOne()
            .populate('categoryRates.categoryId', 'name')
            .populate('vendorRates.vendorId', 'businessName')

        if (!commission) {
            // Create default commission settings
            commission = new Commission({
                defaultRate: 15,
                categoryRates: [],
                vendorRates: []
            })
            await commission.save()
        }

        res.json(commission)
    } catch (error: any) {
        console.error('Get commission error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Admin: Update commission settings
router.put('/', auth, async (req: AuthRequest, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' })
        }

        const { defaultRate, categoryRates, vendorRates } = req.body

        let commission = await Commission.findOne()

        if (!commission) {
            commission = new Commission({
                defaultRate: defaultRate || 15,
                categoryRates: categoryRates || [],
                vendorRates: vendorRates || []
            })
        } else {
            if (defaultRate !== undefined) commission.defaultRate = defaultRate
            if (categoryRates !== undefined) commission.categoryRates = categoryRates
            if (vendorRates !== undefined) commission.vendorRates = vendorRates
        }

        await commission.save()

        res.json({ message: 'Commission settings updated successfully', commission })
    } catch (error: any) {
        console.error('Update commission error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Get commission rate for a specific vendor/category
router.get('/calculate', async (req, res) => {
    try {
        const { vendorId, categoryId } = req.query

        const commission = await Commission.findOne()

        if (!commission) {
            return res.json({ rate: 15 }) // Default rate
        }

        // Check vendor-specific rate first
        if (vendorId) {
            const vendorRate = commission.vendorRates.find(
                vr => vr.vendorId.toString() === vendorId
            )
            if (vendorRate) {
                return res.json({ rate: vendorRate.rate })
            }
        }

        // Check category-specific rate
        if (categoryId) {
            const categoryRate = commission.categoryRates.find(
                cr => cr.categoryId.toString() === categoryId
            )
            if (categoryRate) {
                return res.json({ rate: categoryRate.rate })
            }
        }

        // Return default rate
        res.json({ rate: commission.defaultRate })
    } catch (error: any) {
        console.error('Calculate commission error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

export default router
