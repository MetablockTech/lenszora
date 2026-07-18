import { Router, Request, Response } from 'express'
import { LensType } from '../models/LensType'
import { LensPackage } from '../models/LensPackage'
import { auth, requireAdmin, requireVendor, requireVendorOrAdmin } from '../middleware/auth'

const router = Router()

// Public: Get all active lens types and their packages
router.get('/public', async (req: Request, res: Response) => {
    try {
        const { vendorId } = req.query
        const filter: any = { isActive: true }

        if (vendorId) {
            filter.vendorId = vendorId
        } else {
            filter.vendorId = null // Default platform lenses
        }

        const types = await LensType.find(filter)
        const typeIds = types.map(t => t._id)

        const packages = await LensPackage.find({
            isActive: true,
            lensTypeId: { $in: typeIds }
        }).sort({ price: 1 })

        res.json({ types, packages })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// ADMIN/GLOBAL ROUTES (Accessible by both for selecting types)
router.get('/admin/types', auth, requireVendorOrAdmin, async (req: Request, res: Response) => {
    try {
        const types = await LensType.find({ vendorId: null, isActive: true })
        res.json(types)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

router.get('/admin/packages', auth, requireVendorOrAdmin, async (req: Request, res: Response) => {
    try {
        const packages = await LensPackage.find({ vendorId: null }).populate('lensTypeId')
        res.json(packages)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// VENDOR ROUTES
router.get('/vendor/types', auth, requireVendor, async (req: Request, res: Response) => {
    try {
        const types = await LensType.find({ vendorId: (req as any).user.vendorId, isActive: true })
        res.json(types)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

router.post('/vendor/types', auth, requireVendor, async (req: Request, res: Response) => {
    try {
        const lensType = new LensType({ ...req.body, vendorId: (req as any).user.vendorId })
        await lensType.save()
        res.status(201).json(lensType)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
})

router.patch('/vendor/types/:id', auth, requireVendor, async (req: Request, res: Response) => {
    try {
        const lensType = await LensType.findOneAndUpdate(
            { _id: req.params.id, vendorId: (req as any).user.vendorId },
            req.body,
            { new: true }
        )
        if (!lensType) return res.status(404).json({ message: 'Lens type not found' })
        res.json(lensType)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
})

router.get('/vendor/packages', auth, requireVendor, async (req: Request, res: Response) => {
    try {
        const packages = await LensPackage.find({ vendorId: (req as any).user.vendorId }).populate('lensTypeId')
        res.json(packages)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

router.post('/vendor/packages', auth, requireVendor, async (req: Request, res: Response) => {
    try {
        const lensPackage = new LensPackage({ ...req.body, vendorId: (req as any).user.vendorId })
        await lensPackage.save()
        res.status(201).json(lensPackage)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
})

router.patch('/vendor/packages/:id', auth, requireVendor, async (req: Request, res: Response) => {
    try {
        const lensPackage = await LensPackage.findOneAndUpdate(
            { _id: req.params.id, vendorId: (req as any).user.vendorId },
            req.body,
            { new: true }
        )
        if (!lensPackage) return res.status(404).json({ message: 'Lens package not found' })
        res.json(lensPackage)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
})

// LEGACY ROUTES (Keeping for compatibility if needed, but updated to admin only)
router.get('/types', auth, requireAdmin, async (req: Request, res: Response) => {
    const types = await LensType.find({ vendorId: null })
    res.json(types)
})
router.post('/types', auth, requireAdmin, async (req: Request, res: Response) => {
    const lensType = new LensType({ ...req.body, vendorId: null })
    await lensType.save()
    res.status(201).json(lensType)
})
router.patch('/types/:id', auth, requireAdmin, async (req: Request, res: Response) => {
    const lensType = await LensType.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(lensType)
})
router.get('/packages', auth, requireAdmin, async (req: Request, res: Response) => {
    const packages = await LensPackage.find({ vendorId: null }).populate('lensTypeId')
    res.json(packages)
})
router.post('/packages', auth, requireAdmin, async (req: Request, res: Response) => {
    const lensPackage = new LensPackage({ ...req.body, vendorId: null })
    await lensPackage.save()
    res.status(201).json(lensPackage)
})
router.patch('/packages/:id', auth, requireAdmin, async (req: Request, res: Response) => {
    const lensPackage = await LensPackage.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(lensPackage)
})

// Delete global lens type
router.delete('/types/:id', auth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const deleted = await LensType.findByIdAndDelete(req.params.id)
        if (!deleted) return res.status(404).json({ message: 'Lens type not found' })
        await LensPackage.deleteMany({ lensTypeId: req.params.id })
        res.json({ message: 'Lens type and packages deleted successfully' })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// Delete global lens package
router.delete('/packages/:id', auth, requireAdmin, async (req: Request, res: Response) => {
    try {
        const deleted = await LensPackage.findByIdAndDelete(req.params.id)
        if (!deleted) return res.status(404).json({ message: 'Lens package not found' })
        res.json({ message: 'Lens package deleted successfully' })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// Delete vendor lens type
router.delete('/vendor/types/:id', auth, requireVendor, async (req: Request, res: Response) => {
    try {
        const deleted = await LensType.findOneAndDelete({ _id: req.params.id, vendorId: (req as any).user.vendorId })
        if (!deleted) return res.status(404).json({ message: 'Lens type not found or unauthorized' })
        await LensPackage.deleteMany({ lensTypeId: req.params.id, vendorId: (req as any).user.vendorId })
        res.json({ message: 'Vendor lens type and packages deleted successfully' })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// Delete vendor lens package
router.delete('/vendor/packages/:id', auth, requireVendor, async (req: Request, res: Response) => {
    try {
        const deleted = await LensPackage.findOneAndDelete({ _id: req.params.id, vendorId: (req as any).user.vendorId })
        if (!deleted) return res.status(404).json({ message: 'Lens package not found or unauthorized' })
        res.json({ message: 'Vendor lens package deleted successfully' })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

export default router
