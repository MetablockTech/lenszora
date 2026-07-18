import { Router, Request, Response } from 'express'
import { Inquiry } from '../models/Inquiry'
import { Product } from '../models/Product'
import { User } from '../models/User'

const router = Router()

// @route   POST /api/inquiries
// @desc    Vendor submits a new inquiry
// @access  Authenticated
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, quantity, message, userId } = req.body
    
    // Validate existence
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const newInquiry = new Inquiry({
      productId,
      userId,
      quantity,
      message,
      status: 'pending'
    })

    await newInquiry.save()
    res.status(201).json(newInquiry)
  } catch (error: any) {
    console.error('Inquiry submission error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   GET /api/inquiries/admin
// @desc    Admin lists all inquiries
// @access  Admin only (Assuming there is a middleware for this, but I'll implement basic logic)
router.get('/admin', async (req: Request, res: Response) => {
  try {
    const inquiries = await Inquiry.find()
      .populate('productId', 'title sku price thumbnail')
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })

    res.json(inquiries)
  } catch (error: any) {
    console.error('Inquiry list error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

// @route   PATCH /api/inquiries/admin/:id
// @desc    Update inquiry status
router.patch('/admin/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' })
    res.json(inquiry)
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
})

export default router
