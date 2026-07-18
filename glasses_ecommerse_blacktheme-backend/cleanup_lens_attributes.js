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
    type: String,
    name: String
}, { timestamps: true });
const EyewearAttribute = mongoose_1.default.model('EyewearAttribute', EyewearAttributeSchema);
async function cleanup() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sunglasses';
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB');
        const typesToRemove = ['lensType', 'lensColor', 'lensMaterial'];
        const result = await EyewearAttribute.deleteMany({
            type: { $in: typesToRemove }
        });
        console.log(`Deleted ${result.deletedCount} lens-related attributes.`);
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
    catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}
cleanup();
