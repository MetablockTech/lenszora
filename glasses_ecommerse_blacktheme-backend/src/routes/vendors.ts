import { Router } from 'express'
import { Vendor } from '../models/Vendor'
import { User } from '../models/User'
import { Product } from '../models/Product'
import { Order } from '../models/Order'
import { auth, AuthRequest } from '../middleware/auth'
import { vendorAuth, adminOrVendorAuth } from '../middleware/vendorAuth'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = Router()

// Public: Vendor Registration
router.post('/register', async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            phone,
            businessName,
            description,
            address,
            businessLicense,
            taxId,
            gstNumber,
            bankDetails
        } = req.body

        // Check if user already exists by email or phone
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' })
        }

        const existingPhone = await User.findOne({ phone })
        if (existingPhone) {
            return res.status(400).json({ message: 'Phone number already registered' })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Generate unique slug
        let vendorSlug = businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')

        const existingVendorSlug = await Vendor.findOne({ slug: vendorSlug })
        if (existingVendorSlug) {
            vendorSlug = `${vendorSlug}-${Math.random().toString(36).substring(2, 7)}`
        }

        // Create user with vendor role
        const user = new User({
            email,
            password: hashedPassword,
            name,
            phone,
            role: 'vendor'
        })
        await user.save()

        // Create vendor profile
        const vendor = new Vendor({
            userId: user._id,
            businessName,
            slug: vendorSlug,
            description,
            email,
            phone,
            address,
            businessLicense,
            taxId,
            gstNumber,
            bankDetails: bankDetails || {
                accountHolderName: name || 'TBD',
                accountNumber: 'TBD',
                bankName: 'TBD',
                ifscCode: 'TBD'
            },
            verificationStatus: 'pending'
        })
        await vendor.save()

        // Link vendor to user
        user.vendorId = vendor._id
        await user.save()

        res.status(201).json({
            message: 'Vendor registration successful. Awaiting admin approval.',
            vendor: {
                id: vendor._id,
                businessName: vendor.businessName,
                verificationStatus: vendor.verificationStatus
            }
        })
    } catch (error: any) {
        console.error('Vendor registration error:', error)
        res.status(500).json({ message: 'Server error during registration', error: error.message })
    }
})

// Admin: Get all vendors
router.get('/', auth, async (req: AuthRequest, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' })
        }

        const { status } = req.query
        const filter: any = {}
        if (status) {
            filter.verificationStatus = status
        }

        const vendors = await Vendor.find(filter)
            .populate('userId', 'email name phone')
            .sort({ createdAt: -1 })

        res.json(vendors)
    } catch (error: any) {
        console.error('Get vendors error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Get vendor by ID (public or authenticated)
router.get('/:id', async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id)
            .populate('userId', 'email name')

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' })
        }

        // Don't expose sensitive data for public requests
        const vendorData: any = vendor.toObject()
        delete vendorData.bankDetails
        delete vendorData.businessLicense
        delete vendorData.taxId
        delete vendorData.gstNumber
        delete vendorData.documents

        res.json(vendorData)
    } catch (error: any) {
        console.error('Get vendor error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Vendor: Get own profile (with sensitive data)
router.get('/profile/me', vendorAuth, async (req: AuthRequest, res) => {
    try {
        const vendor = await Vendor.findById(req.user?.vendorId)
            .populate('userId', 'email name phone')

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found' })
        }

        res.json(vendor)
    } catch (error: any) {
        console.error('Get vendor profile error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Vendor: Update own profile
router.put('/profile/me', vendorAuth, async (req: AuthRequest, res) => {
    try {
        const {
            businessName,
            description,
            logo,
            banner,
            phone,
            address,
            bankDetails
        } = req.body

        const vendor = await Vendor.findById(req.user?.vendorId)
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found' })
        }

        // Update allowed fields
        if (businessName) vendor.businessName = businessName
        if (description !== undefined) vendor.description = description
        if (logo !== undefined) vendor.logo = logo
        if (banner !== undefined) vendor.banner = banner
        if (phone) vendor.phone = phone
        if (address) vendor.address = address
        if (bankDetails) vendor.bankDetails = bankDetails

        await vendor.save()

        res.json({ message: 'Profile updated successfully', vendor })
    } catch (error: any) {
        console.error('Update vendor profile error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Admin: Update vendor status (approve/reject/suspend)
router.put('/:id/status', auth, async (req: AuthRequest, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' })
        }

        const { verificationStatus, verificationNotes, commissionRate } = req.body

        const vendor = await Vendor.findById(req.params.id)
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' })
        }

        if (verificationStatus) vendor.verificationStatus = verificationStatus
        if (verificationNotes !== undefined) vendor.verificationNotes = verificationNotes
        if (commissionRate !== undefined) vendor.commissionRate = commissionRate

        await vendor.save()

        res.json({ message: 'Vendor status updated successfully', vendor })
    } catch (error: any) {
        console.error('Update vendor status error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Get vendor's products
router.get('/:id/products', async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query
        const filter: any = { vendorId: req.params.id }

        if (status) {
            filter.status = status
        }

        const products = await Product.find(filter)
            .populate('category', 'name slug')
            .populate('brand', 'name slug')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 })

        const total = await Product.countDocuments(filter)

        res.json({
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        })
    } catch (error: any) {
        console.error('Get vendor products error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Vendor: Get own orders
router.get('/orders/me', vendorAuth, async (req: AuthRequest, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query

        const filter: any = {
            'vendorOrders.vendorId': req.user?.vendorId
        }

        if (status) {
            filter['vendorOrders.status'] = status
        }

        const orders = await Order.find(filter)
            .populate('userId', 'email name')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 })

        // Filter to show only this vendor's items
        const vendorOrders = orders.map(order => {
            const vendorOrder = order.vendorOrders.find(
                vo => vo.vendorId.toString() === req.user?.vendorId
            )
            return {
                ...order.toObject(),
                vendorOrder
            }
        })

        const total = await Order.countDocuments(filter)

        res.json({
            orders: vendorOrders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        })
    } catch (error: any) {
        console.error('Get vendor orders error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Vendor: Update own sub-order status
router.put('/orders/:id/status', vendorAuth, async (req: AuthRequest, res) => {
    try {
        const { status, note, otp } = req.body
        const vendorId = req.user?.vendorId

        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'partially_shipped', 'partially_delivered']
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' })
        }

        const order = await Order.findOne({ 
            _id: req.params.id,
            'vendorOrders.vendorId': vendorId
        })

        if (!order) {
            return res.status(404).json({ message: 'Order not found for this vendor' })
        }

        const vendorOrderIndex = order.vendorOrders.findIndex(
            vo => vo.vendorId.toString() === vendorId
        )

        if (vendorOrderIndex === -1) {
            return res.status(404).json({ message: 'Vendor sub-order not found' })
        }

        const currentVO = order.vendorOrders[vendorOrderIndex]
        const oldStatus = currentVO.status

        // Status Hierarchy Map
        const statusPriority: { [key: string]: number } = {
            'pending': 0,
            'confirmed': 1,
            'shipped': 2,
            'delivered': 3,
            'cancelled': -1 // Special handling
        }

        const currentRank = statusPriority[oldStatus] || 0
        const newRank = statusPriority[status] || 0

        // Prevent backward movement
        if (newRank <= currentRank && status !== 'cancelled') {
            return res.status(400).json({ 
                message: `Cannot change status from ${oldStatus.toUpperCase()} to ${status.toUpperCase()}. Status can only move forward.` 
            })
        }

        // Specific rule for 'cancelled': Only allowed before shipping
        if (status === 'cancelled' && currentRank >= 2) {
            return res.status(400).json({ message: 'Cannot cancel an order that has already been shipped' })
        }

        // SECURITY: OTP Verification for Delivery
        if (status === 'delivered') {
            if (!order.vendorOrders[vendorOrderIndex].deliveryOtp) {
                return res.status(400).json({ message: 'Order must be marked as SHIPPED before it can be DELIVERED' })
            }
            if (!otp || otp !== order.vendorOrders[vendorOrderIndex].deliveryOtp) {
                return res.status(400).json({ message: 'Invalid Delivery OTP' })
            }
        }

        order.vendorOrders[vendorOrderIndex].status = status
        order.vendorOrders[vendorOrderIndex].statusHistory.push({
            status,
            note: note || `Status updated by vendor from ${oldStatus} to ${status}`,
            timestamp: new Date()
        })

        // Action: Credit Vendor Wallet on Verified Delivery
        if (status === 'delivered' && oldStatus !== 'delivered') {
            const vendor = await Vendor.findById(vendorId)
            if (vendor) {
                const amountToAdd = order.vendorOrders[vendorOrderIndex].vendorAmount || 0
                vendor.availableBalance = (vendor.availableBalance || 0) + amountToAdd
                vendor.totalEarned = (vendor.totalEarned || 0) + amountToAdd
                vendor.totalSales = (vendor.totalSales || 0) + 1
                await vendor.save()
            }
        }

        // Sync global status logic
        const allStatuses = order.vendorOrders.map(vo => vo.status)
        
        if (allStatuses.every(s => s === 'delivered')) {
            order.orderStatus = 'delivered'
        } else if (allStatuses.every(s => s === 'cancelled')) {
            order.orderStatus = 'cancelled'
        } else if (allStatuses.some(s => ['shipped', 'delivered', 'partially_shipped', 'partially_delivered'].includes(s))) {
            // Check if everything is at least shipped/delivered/cancelled
            const allHandled = allStatuses.every(s => ['shipped', 'delivered', 'cancelled', 'partially_shipped', 'partially_delivered'].includes(s))
            
            if (allHandled) {
                const someDelivered = allStatuses.some(s => s === 'delivered' || s === 'partially_delivered')
                if (someDelivered) {
                    order.orderStatus = 'partially_delivered'
                } else {
                    order.orderStatus = 'shipped'
                }
            } else {
                order.orderStatus = 'partially_shipped'
            }
        } else if (allStatuses.some(s => s === 'confirmed')) {
            order.orderStatus = 'confirmed'
        }

        await order.save()

        res.json({ 
            message: 'Status updated successfully', 
            vendorStatus: status,
            globalStatus: order.orderStatus 
        })
    } catch (error: any) {
        console.error('Update vendor order status error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// Vendor: Get analytics/dashboard data
router.get('/analytics/me', vendorAuth, async (req: AuthRequest, res) => {
    try {
        const vendor = await Vendor.findById(req.user?.vendorId)
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' })
        }

        // Get total products
        const totalProducts = await Product.countDocuments({
            vendorId: req.user?.vendorId,
            status: 'active'
        })

        // Get orders containing vendor's products
        const orders = await Order.find({
            'vendorOrders.vendorId': req.user?.vendorId,
            paymentStatus: 'completed'
        })

        let totalSales = 0
        let totalRevenue = 0
        let totalCommission = 0

        orders.forEach(order => {
            const vendorOrder = order.vendorOrders.find(
                vo => vo.vendorId.toString() === req.user?.vendorId
            )
            if (vendorOrder) {
                totalSales += vendorOrder.items.length
                totalRevenue += vendorOrder.vendorAmount
                totalCommission += vendorOrder.commission
            }
        })


        res.json({
            totalProducts,
            totalOrders: orders.length,
            totalSales,
            totalRevenue,
            totalCommission,
            pendingBalance: vendor.pendingBalance || 0,
            availableBalance: vendor.availableBalance || 0,
            totalEarned: vendor.totalEarned || 0,
            commissionRate: vendor.commissionRate,
            verificationStatus: vendor.verificationStatus
        })
    } catch (error: any) {
        console.error('Get vendor analytics error:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

export default router
