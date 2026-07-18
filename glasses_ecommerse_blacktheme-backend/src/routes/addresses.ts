import express from 'express';
import { UserAddress } from '../models/UserAddress';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get all addresses for the logged-in user
router.get('/', async (req, res) => {
    try {
        const addresses = await UserAddress.find({ userId: req.user!.id }).sort({ isDefault: -1, createdAt: -1 });
        res.json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
});

// Create new address
router.post('/', async (req, res) => {
    try {
        const address = new UserAddress({
            ...req.body,
            userId: req.user!.id
        });
        await address.save();
        res.status(201).json(address);
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(500).json({ error: 'Failed to create address' });
    }
});

// Update address
router.put('/:id', async (req, res) => {
    try {
        const address = await UserAddress.findOne({
            _id: req.params.id,
            userId: req.user!.id
        });

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        Object.assign(address, req.body);
        await address.save();
        res.json(address);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Failed to update address' });
    }
});

// Delete address
router.delete('/:id', async (req, res) => {
    try {
        const address = await UserAddress.findOneAndDelete({
            _id: req.params.id,
            userId: req.user!.id
        });

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ error: 'Failed to delete address' });
    }
});

// Set address as default
router.patch('/:id/default', async (req, res) => {
    try {
        const address = await UserAddress.findOne({
            _id: req.params.id,
            userId: req.user!.id
        });

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        address.isDefault = true;
        await address.save();
        res.json(address);
    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({ error: 'Failed to set default address' });
    }
});

export default router;
