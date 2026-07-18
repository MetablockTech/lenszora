import express from 'express'
import { User } from '../models/User'
import { Product } from '../models/Product'
import { requireAuth } from '../middleware/auth'

const router = express.Router()

// Get user's wishlist
router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findById((req as any).user.id).populate('wishlist')
        if (!user) return res.status(404).json({ error: 'User not found' })
        return res.json(user.wishlist)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// Toggle product in wishlist
router.post('/toggle', requireAuth, async (req, res) => {
    const { productId } = req.body
    if (!productId) return res.status(400).json({ error: 'Product ID is required' })

    try {
        const user = await User.findById((req as any).user.id)
        if (!user) return res.status(404).json({ error: 'User not found' })

        const index = user.wishlist.indexOf(productId)
        if (index > -1) {
            // Remove from wishlist
            user.wishlist.splice(index, 1)
            await user.save()
            // Decrement wishlistCount on product
            await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: -1 } })
            return res.json({ message: 'Removed from wishlist', isWishlisted: false })
        } else {
            // Add to wishlist
            user.wishlist.push(productId)
            await user.save()
            // Increment wishlistCount on product
            await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: 1 } })
            return res.json({ message: 'Added to wishlist', isWishlisted: true })
        }
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router
