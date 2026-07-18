import express from 'express'
import { EyewearAttribute } from '../models/EyewearAttribute'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = express.Router()

// Get all attributes
router.get('/', async (req, res) => {
    try {
        const attributes = await EyewearAttribute.find().sort({ type: 1, name: 1 })
        res.json(attributes)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Get attributes by type
router.get('/type/:type', async (req, res) => {
    try {
        const attributes = await EyewearAttribute.find({ type: req.params.type }).sort({ name: 1 })
        res.json(attributes)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Create attribute (Admin Only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { type, name, image } = req.body
        if (!type || !name) {
            return res.status(400).json({ error: 'Type and Name are required' })
        }

        const attribute = new EyewearAttribute({ type, name, image })
        await attribute.save()
        res.status(201).json(attribute)
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Attribute already exists for this type' })
        }
        res.status(500).json({ error: error.message })
    }
})

// Update attribute (Admin Only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { type, name, image } = req.body
        const attribute = await EyewearAttribute.findByIdAndUpdate(
            req.params.id,
            { type, name, image },
            { new: true, runValidators: true }
        )
        if (!attribute) return res.status(404).json({ error: 'Attribute not found' })
        res.json(attribute)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Delete attribute (Admin Only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const attribute = await EyewearAttribute.findByIdAndDelete(req.params.id)
        if (!attribute) return res.status(404).json({ error: 'Attribute not found' })
        res.json({ message: 'Attribute deleted successfully' })
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

export default router
