import { Router, Request, Response } from 'express'
import { Setting } from '../models/Setting'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

// Get all settings or by category
router.get('/', async (req: Request, res: Response) => {
    try {
        const { category } = req.query
        const query = category ? { category } : {}

        const settings = await Setting.find(query)
        res.json(settings)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// Get single setting by key
router.get('/:key', async (req: Request, res: Response) => {
    try {
        const setting = await Setting.findOne({ key: req.params.key })

        if (!setting) {
            return res.status(404).json({ message: 'Setting not found' })
        }

        res.json(setting)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// Update or create setting (admin only)
router.put('/:key', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const setting = await Setting.findOneAndUpdate(
            { key: req.params.key },
            { ...req.body, key: req.params.key },
            { new: true, upsert: true, runValidators: true }
        )

        res.json(setting)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
})

// Delete setting (admin only)
router.delete('/:key', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const setting = await Setting.findOneAndDelete({ key: req.params.key })

        if (!setting) {
            return res.status(404).json({ message: 'Setting not found' })
        }

        res.json({ message: 'Setting deleted successfully' })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

export default router
