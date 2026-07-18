import mongoose from 'mongoose';
import { Product } from './src/models/Product';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sunglasses';

async function testRejectionReason() {
    await mongoose.connect(MONGODB_URI);

    // Find a product to test with
    const product = await Product.findOne();
    if (!product) {
        console.log('No product found to test');
        await mongoose.disconnect();
        return;
    }

    console.log('Testing with product:', product.title);

    // Simulate rejection with reason
    const newStatus = 'rejected';
    const reason = 'Test rejection reason: Quality issues';

    await Product.findByIdAndUpdate(product._id, {
        status: newStatus,
        rejectionReason: reason
    });

    const updated = await Product.findById(product._id);
    console.log('Updated Status:', updated?.status);
    console.log('Rejection Reason:', updated?.rejectionReason);

    await mongoose.disconnect();
}

testRejectionReason().catch(console.error);
