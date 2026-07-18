"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Product_1 = require("./src/models/Product");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sunglasses';
async function testRejectionReason() {
    await mongoose_1.default.connect(MONGODB_URI);
    // Find a product to test with
    const product = await Product_1.Product.findOne();
    if (!product) {
        console.log('No product found to test');
        await mongoose_1.default.disconnect();
        return;
    }
    console.log('Testing with product:', product.title);
    // Simulate rejection with reason
    const newStatus = 'rejected';
    const reason = 'Test rejection reason: Quality issues';
    await Product_1.Product.findByIdAndUpdate(product._id, {
        status: newStatus,
        rejectionReason: reason
    });
    const updated = await Product_1.Product.findById(product._id);
    console.log('Updated Status:', updated?.status);
    console.log('Rejection Reason:', updated?.rejectionReason);
    await mongoose_1.default.disconnect();
}
testRejectionReason().catch(console.error);
