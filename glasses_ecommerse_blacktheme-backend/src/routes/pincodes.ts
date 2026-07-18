import express from 'express';
import { Pincode } from '../models/Pincode';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Public route - Check if pincode is serviceable
router.get('/check/:pincode', async (req, res) => {
    try {
        const { pincode } = req.params;
        const pincodeData = await Pincode.findOne({ pincode, isServiceable: true });

        if (!pincodeData) {
            return res.json({
                serviceable: false,
                message: 'Delivery not available for this pincode'
            });
        }

        res.json({
            serviceable: true,
            city: pincodeData.city,
            state: pincodeData.state,
            estimatedDeliveryDays: pincodeData.estimatedDeliveryDays,
            deliveryRules: pincodeData.deliveryRules,
            message: `Delivery available in ${pincodeData.estimatedDeliveryDays} days`
        });
    } catch (error) {
        console.error('Error checking pincode:', error);
        res.status(500).json({ error: 'Failed to check pincode' });
    }
});

// Admin routes
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { search, serviceable } = req.query;
        const query: any = {};

        if (search) {
            query.$or = [
                { pincode: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { state: { $regex: search, $options: 'i' } }
            ];
        }

        if (serviceable !== undefined) {
            query.isServiceable = serviceable === 'true';
        }

        const pincodes = await Pincode.find(query).sort({ pincode: 1 });
        res.json(pincodes);
    } catch (error) {
        console.error('Error fetching pincodes:', error);
        res.status(500).json({ error: 'Failed to fetch pincodes' });
    }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const pincode = new Pincode(req.body);
        await pincode.save();
        res.status(201).json(pincode);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Pincode already exists' });
        }
        console.error('Error creating pincode:', error);
        res.status(500).json({ error: 'Failed to create pincode' });
    }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const pincode = await Pincode.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!pincode) {
            return res.status(404).json({ error: 'Pincode not found' });
        }

        res.json(pincode);
    } catch (error) {
        console.error('Error updating pincode:', error);
        res.status(500).json({ error: 'Failed to update pincode' });
    }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const pincode = await Pincode.findByIdAndDelete(req.params.id);

        if (!pincode) {
            return res.status(404).json({ error: 'Pincode not found' });
        }

        res.json({ message: 'Pincode deleted successfully' });
    } catch (error) {
        console.error('Error deleting pincode:', error);
        res.status(500).json({ error: 'Failed to delete pincode' });
    }
});

// Bulk upload pincodes
router.post('/bulk', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { pincodes } = req.body;

        if (!Array.isArray(pincodes) || pincodes.length === 0) {
            return res.status(400).json({ error: 'Invalid pincodes array' });
        }

        const results = await Pincode.insertMany(pincodes, { ordered: false });
        res.json({
            message: `Successfully added ${results.length} pincodes`,
            count: results.length
        });
    } catch (error: any) {
        if (error.code === 11000) {
            const inserted = error.insertedDocs?.length || 0;
            return res.json({
                message: `Added ${inserted} pincodes. Some duplicates were skipped.`,
                count: inserted
            });
        }
        console.error('Error bulk uploading pincodes:', error);
        res.status(500).json({ error: 'Failed to upload pincodes' });
    }
});

export default router;
