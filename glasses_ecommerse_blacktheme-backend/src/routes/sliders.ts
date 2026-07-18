import express from 'express';
import { Slider } from '../models/Slider';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Get all active sliders
router.get('/', async (req, res) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ order: 1 });
    res.json(sliders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all sliders (including inactive)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ order: 1 });
    res.json(sliders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create slider
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    // If this is a Footer Banner and it's being published, unpublish others
    if (req.body.bannerType === 'Footer Banner' && req.body.published) {
      await Slider.updateMany(
        { bannerType: 'Footer Banner' },
        { $set: { published: false } }
      )
    }

    const slider = new Slider(req.body)
    await slider.save()
    res.status(201).json(slider);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update slider
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // If this is a Footer Banner and it's being published, unpublish others
    if (req.body.bannerType === 'Footer Banner' && req.body.published) {
      await Slider.updateMany(
        { bannerType: 'Footer Banner', _id: { $ne: req.params.id } },
        { $set: { published: false } }
      )
    }

    const slider = await Slider.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!slider) return res.status(404).json({ message: 'Slider not found' })
    res.json(slider);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete slider
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let slider = null;

    try {
      // Standard Mongoose deletion logic (expects ObjectId)
      slider = await Slider.findByIdAndDelete(id);
    } catch (e) {
      // Ignore CastErrors (e.g., when ID is a seeded custom string instead of a 24 char hex)
    }
    
    // If not found, it might be a custom string ID that bypassed casting during seeding
    if (!slider) {
      const result = await Slider.collection.deleteOne({ _id: id } as any);
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Slider not found' });
      }
    }
    
    res.json({ ok: true });
  } catch (err: any) {
    console.error("Slider Delete Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
