"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const Product_1 = require("./src/models/Product");
async function deleteProduct() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB\n');
        const productId = '6958d2a88cdfaec92d43c713';
        // First, show the product details
        const product = await Product_1.Product.findById(productId);
        if (!product) {
            console.log('❌ Product not found!');
            process.exit(1);
        }
        console.log('Product to be deleted:');
        console.log('  ID:     ', product._id);
        console.log('  Title:  ', product.title);
        console.log('  SKU:    ', product.sku);
        console.log('  Status: ', product.status);
        console.log('');
        // Delete the product
        const result = await Product_1.Product.deleteOne({ _id: productId });
        if (result.deletedCount > 0) {
            console.log('✅ Product deleted successfully!');
            console.log('   You can now create a new product with SKU "asdasdasd"');
        }
        else {
            console.log('❌ Failed to delete product');
        }
        process.exit(0);
    }
    catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
deleteProduct();
