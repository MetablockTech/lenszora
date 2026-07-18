import express, { Response } from 'express'
import { Review } from '../models/Review'
import { Product } from '../models/Product'
import { Order } from '../models/Order'
import { requireAuth, AuthRequest, AuthenticatedRequest } from '../middleware/auth'

const router = express.Router()

// Get reviews for a product
router.get('/product/:productId', async (req: express.Request, res: Response) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'email')
            .sort({ createdAt: -1 })
        return res.json(reviews)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// Submit a review
router.post('/', requireAuth, async (req, res: Response) => {
    const { productId, rating, title, comment } = req.body

    if (!productId || !rating || !title || !comment) {
        return res.status(400).json({ error: 'Missing required fields' })
    }

    try {
        // Check if user has purchased the product and order is delivered
        const order = await Order.findOne({
            userId: req.user!.id,
            'items.productId': productId,
            orderStatus: 'delivered'
        })

        const isVerified = !!order

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ user: req.user!.id, product: productId })
        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this product' })
        }

        const review = new Review({
            user: req.user!.id,
            product: productId,
            rating,
            title,
            comment,
            isVerified
        })

        await review.save()

        // Update product average rating and total reviews
        const allReviews = await Review.find({ product: productId })
        const totalReviews = allReviews.length
        const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews

        await Product.findByIdAndUpdate(productId, {
            averageRating,
            totalReviews
        })

        return res.json(review)
    } catch (err) {
        console.error('Review submission error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router
