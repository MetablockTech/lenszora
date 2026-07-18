"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const Product_1 = require("./src/models/Product");
async function findAndFixSKU() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB\n');
        const problematicSKU = 'asdasdasd';
        // Find all products with this SKU
        const products = await Product_1.Product.find({ sku: problematicSKU });
        console.log(`=== PRODUCTS WITH SKU "${problematicSKU}" ===\n`);
        if (products.length === 0) {
            console.log('✅ No products found with this SKU');
            console.log('\nThis means the SKU was likely used in a previous product that was deleted,');
            console.log('but you may be trying to create a new product with the same SKU.');
            console.log('\nSOLUTION: Use a different, unique SKU for your new product.');
        }
        else {
            console.log(`Found ${products.length} product(s) with this SKU:\n`);
            products.forEach((p, index) => {
                console.log(`${index + 1}. Product Details:`);
                console.log(`   ID: ${p._id}`);
                console.log(`   Title: ${p.title}`);
                console.log(`   SKU: ${p.sku}`);
                console.log(`   Status: ${p.status}`);
                console.log(`   Created: ${p.createdAt}`);
                console.log('');
            });
            console.log('\n=== SOLUTIONS ===');
            console.log('1. If you want to UPDATE the existing product, use PUT /api/products/:id');
            console.log('2. If you want to CREATE a new product, use a different unique SKU');
            console.log('3. If you want to DELETE the old product first, use DELETE /api/products/:id');
            console.log('\nTo delete the product(s) above, you can run:');
            products.forEach(p => {
                console.log(`   DELETE /api/products/${p._id}`);
            });
        }
        // Show all SKUs in use
        console.log('\n\n=== ALL SKUs IN DATABASE ===');
        const allProducts = await Product_1.Product.find({}).select('sku title').limit(20);
        allProducts.forEach(p => {
            console.log(`  - SKU: "${p.sku}" | Title: ${p.title}`);
        });
        if (allProducts.length === 20) {
            const total = await Product_1.Product.countDocuments();
            console.log(`  ... and ${total - 20} more products`);
        }
        process.exit(0);
    }
    catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
findAndFixSKU();
