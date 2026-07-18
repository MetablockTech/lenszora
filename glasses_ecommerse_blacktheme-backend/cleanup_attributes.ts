
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const EyewearAttributeSchema = new mongoose.Schema({
    name: String,
    type: String,
    vendorId: mongoose.Schema.Types.ObjectId
});

const EyewearAttribute = mongoose.model('EyewearAttribute', EyewearAttributeSchema);

async function cleanupAttributes() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sunglasses');
        console.log('Connected to MongoDB');

        const typesToDelete = ['lensType', 'lensColor', 'lensMaterial'];

        const countBefore = await EyewearAttribute.countDocuments({ type: { $in: typesToDelete } });
        console.log(`Found ${countBefore} attributes to delete: ${typesToDelete.join(', ')}`);

        const result = await EyewearAttribute.deleteMany({ type: { $in: typesToDelete } });
        console.log(`Successfully deleted ${result.deletedCount} attributes.`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

cleanupAttributes();
