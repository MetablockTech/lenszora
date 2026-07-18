import mongoose from 'mongoose';
import { Product } from './src/models/Product';
import { Setting } from './src/models/Setting';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sunglasses';

async function testAutoApproval() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Test with Auto-Approval ON
    await Setting.findOneAndUpdate(
        { key: 'autoApproveVendorProducts' },
        { value: true, type: 'boolean', category: 'general' },
        { upsert: true }
    );
    console.log('Enabled Auto-Approval');

    // Simulate product creation logic (mocked because it relies on req.user)
    const isAutoApprove = (await Setting.findOne({ key: 'autoApproveVendorProducts' }))?.value === true;
    const testStatusOn = isAutoApprove ? 'active' : 'pending';
    console.log('Status with Auto-Approval ON:', testStatusOn);

    // 2. Test with Auto-Approval OFF
    await Setting.findOneAndUpdate(
        { key: 'autoApproveVendorProducts' },
        { value: false, type: 'boolean', category: 'general' },
        { upsert: true }
    );
    console.log('Disabled Auto-Approval');

    const isAutoApproveOff = (await Setting.findOne({ key: 'autoApproveVendorProducts' }))?.value === true;
    const testStatusOff = isAutoApproveOff ? 'active' : 'pending';
    console.log('Status with Auto-Approval OFF:', testStatusOff);

    await mongoose.disconnect();
}

testAutoApproval().catch(console.error);
