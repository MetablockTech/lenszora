import { Router } from 'express'
import { VendorPayout } from '../models/VendorPayout'
import { Vendor } from '../models/Vendor'
import { Order } from '../models/Order'
import { auth, AuthRequest } from '../middleware/auth'
import { vendorAuth, AuthRequest as VendorAuthRequest } from '../middleware/vendorAuth'

const router = Router()

// Vendor: Get own payout history
router.get('/vendor/me', vendorAuth, async (req: AuthRequest, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query
        const filter: any = { vendorId: req.user?.vendorId }

        if (status) {
            filter.status = status
        }

        const payouts = await VendorPayout.find(filter)
            .populate('processedBy', 'email name')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 })

        const total = await VendorPayout.countDocuments(filter)

        res.json({
            payouts,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        })
    } catch (error: any) {
        console.error('Get vendor payouts error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Vendor: Request a withdrawal
router.post('/request', vendorAuth, async (req: AuthRequest, res) => {
    try {
        const { amount, notes, paymentMethod } = req.body
        const vendorId = req.user?.vendorId

        const vendor = await Vendor.findById(vendorId)
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' })
        }

        if (amount <= 0) {
            return res.status(400).json({ message: 'Invalid payout amount' })
        }

        if ((vendor.availableBalance || 0) < amount) {
            return res.status(400).json({ message: 'Insufficient balance' })
        }

        // Deduct from available balance and move to pending payouts
        vendor.availableBalance -= amount
        await vendor.save()

        const payout = new VendorPayout({
            vendorId,
            amount: amount, // Logic: for requests, we treat amount as net because commission is already deducted before adding to wallet
            netAmount: amount,
            commissionDeducted: 0, 
            periodStart: new Date(),
            periodEnd: new Date(),
            status: 'pending',
            paymentMethod: paymentMethod || 'Bank Transfer',
            notes: notes || 'Withdrawal request from vendor portal'
        })

        await payout.save()

        res.status(201).json({ message: 'Withdrawal request submitted successfully', payout })
    } catch (error: any) {
        console.error('Request withdrawal error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Admin: Get all payouts
router.get('/', auth, async (req: AuthRequest, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' })
        }

        const { page = 1, limit = 20, status, vendorId } = req.query
        const filter: any = {}

        if (status) filter.status = status
        if (vendorId) filter.vendorId = vendorId

        const payouts = await VendorPayout.find(filter)
            .populate('vendorId', 'businessName email')
            .populate('processedBy', 'email name')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 })

        const total = await VendorPayout.countDocuments(filter)

        res.json({
            payouts,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        })
    } catch (error: any) {
        console.error('Get payouts error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Admin: Get pending payouts summary
router.get('/pending/summary', auth, async (req: AuthRequest, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' })
        }

        const vendors = await Vendor.find({ verificationStatus: 'approved' })

        const pendingSummary = []

        for (const vendor of vendors) {
            // Get completed orders for this vendor
            const orders = await Order.find({
                'vendorOrders.vendorId': vendor._id,
                paymentStatus: 'completed',
                'vendorOrders.status': { $in: ['confirmed', 'shipped', 'delivered'] }
            })

            let pendingAmount = 0
            let pendingCommission = 0

            orders.forEach(order => {
                const vendorOrder = order.vendorOrders.find(
                    vo => vo.vendorId.toString() === vendor._id.toString()
                )
                if (vendorOrder) {
                    pendingAmount += vendorOrder.vendorAmount
                    pendingCommission += vendorOrder.commission
                }
            })

            if (pendingAmount > 0) {
                pendingSummary.push({
                    vendorId: vendor._id,
                    businessName: vendor.businessName,
                    email: vendor.email,
                    pendingAmount,
                    pendingCommission,
                    totalOrders: orders.length
                })
            }
        }

        res.json(pendingSummary)
    } catch (error: any) {
        console.error('Get pending payouts summary error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Admin: Create payout
router.post('/', auth, async (req: AuthRequest, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' })
        }

        const {
            vendorId,
            periodStart,
            periodEnd,
            paymentMethod,
            notes
        } = req.body

        // Calculate payout amount from orders
        const orders = await Order.find({
            'vendorOrders.vendorId': vendorId,
            paymentStatus: 'completed',
            'vendorOrders.status': { $in: ['confirmed', 'shipped', 'delivered'] },
            createdAt: {
                $gte: new Date(periodStart),
                $lte: new Date(periodEnd)
            }
        })

        let totalAmount = 0
        let totalCommission = 0

        orders.forEach(order => {
            const vendorOrder = order.vendorOrders.find(
                vo => vo.vendorId.toString() === vendorId
            )
            if (vendorOrder) {
                totalAmount += vendorOrder.subtotal
                totalCommission += vendorOrder.commission
            }
        })

        const netAmount = totalAmount - totalCommission

        const payout = new VendorPayout({
            vendorId,
            amount: totalAmount,
            commissionDeducted: totalCommission,
            netAmount,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            paymentMethod,
            notes,
            status: 'pending',
            processedBy: req.user?.id
        })

        await payout.save()

        res.status(201).json({ message: 'Payout created successfully', payout })
    } catch (error: any) {
        console.error('Create payout error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Admin: Update payout status
router.put('/:id/status', auth, async (req: AuthRequest, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' })
        }

        const { status, transactionId, transactionDetails, notes } = req.body

        const payout = await VendorPayout.findById(req.params.id)
        if (!payout) {
            return res.status(404).json({ message: 'Payout not found' })
        }

        const oldStatus = payout.status
        if (status) payout.status = status
        if (transactionId) payout.transactionId = transactionId
        if (transactionDetails) payout.transactionDetails = transactionDetails
        if (notes) payout.notes = notes

        if (status === 'completed' && oldStatus !== 'completed') {
            payout.processedAt = new Date()
            payout.processedBy = req.user?.id as any
        }

        // Logic: If cancelled, return funds to vendor
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            const vendor = await Vendor.findById(payout.vendorId)
            if (vendor) {
                vendor.availableBalance = (vendor.availableBalance || 0) + payout.netAmount
                await vendor.save()
            }
        }

        await payout.save()

        res.json({ message: 'Payout status updated successfully', payout })
    } catch (error: any) {
        console.error('Update payout status error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

export default router
