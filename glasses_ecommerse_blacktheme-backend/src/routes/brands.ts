import express from 'express'
import { Brand } from '../models/Brand'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find().lean()
    res.json(brands)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, slug, logo, banner, horizontalBanner, tagline, bgColor, isTrending, showHorizontalSlider } = req.body
    if (!name) return res.status(400).json({ error: 'Missing name' })
    const b = new Brand({ name, slug, logo, banner, horizontalBanner, tagline, bgColor, isTrending, showHorizontalSlider })
    await b.save()
    res.json(b)
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Duplicate brand slug' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err: any) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid brand ID format' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Brand.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (err: any) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid brand ID format' })
    }
    res.status(500).json({ error: err.message })
  }
})

export default router
