import { Router, Request, Response } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { Product } from '../models/Product'
import { User } from '../models/User'
import { Order } from '../models/Order'


const router = Router()

// Get dashboard stats (admin only)
router.get('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        // Get counts
        const [
            totalUsers,
            totalProducts,
            totalOrders
        ] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments()
        ])

        // Get revenue stats
        const revenueStats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' }
                }
            }
        ])

        const totalRevenue = revenueStats[0]?.totalRevenue || 0
        const averageOrderValue = revenueStats[0]?.averageOrderValue || 0

        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name email')
            .select('orderNumber total orderStatus createdAt')

        // Get order status breakdown
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ])

        // Get low stock products
        const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
            .sort({ stock: 1 })
            .limit(5)
            .select('title stock price images')

        // Get monthly revenue (last 6 months)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                    orderStatus: { $in: ['delivered', 'shipped'] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])

        res.json({
            overview: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue,
                averageOrderValue
            },
            recentOrders,
            ordersByStatus,
            lowStockProducts,
            monthlyRevenue
        })
    } catch (error: any) {
        console.error('Dashboard Error:', error)
        res.status(500).json({ message: error.message, stack: error.stack })
    }
})

export default router
