import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const EyewearAttributeSchema = new mongoose.Schema({
    type: String,
    name: String
}, { timestamps: true });

const EyewearAttribute = mongoose.model('EyewearAttribute', EyewearAttributeSchema);

async function cleanup() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sunglasses';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const typesToRemove = ['lensType', 'lensColor', 'lensMaterial'];

        const result = await EyewearAttribute.deleteMany({
            type: { $in: typesToRemove }
        });

        console.log(`Deleted ${result.deletedCount} lens-related attributes.`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();
