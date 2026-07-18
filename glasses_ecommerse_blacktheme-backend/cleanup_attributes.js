"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '.env') });
const EyewearAttributeSchema = new mongoose_1.default.Schema({
    name: String,
    type: String,
    vendorId: mongoose_1.default.Schema.Types.ObjectId
});
const EyewearAttribute = mongoose_1.default.model('EyewearAttribute', EyewearAttributeSchema);
async function cleanupAttributes() {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sunglasses');
        console.log('Connected to MongoDB');
        const typesToDelete = ['lensType', 'lensColor', 'lensMaterial'];
        const countBefore = await EyewearAttribute.countDocuments({ type: { $in: typesToDelete } });
        console.log(`Found ${countBefore} attributes to delete: ${typesToDelete.join(', ')}`);
        const result = await EyewearAttribute.deleteMany({ type: { $in: typesToDelete } });
        console.log(`Successfully deleted ${result.deletedCount} attributes.`);
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
    catch (error) {
        console.error('Error during cleanup:', error);
    }
}
cleanupAttributes();
