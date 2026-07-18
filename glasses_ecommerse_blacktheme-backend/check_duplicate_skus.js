"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const Product_1 = require("./src/models/Product");
async function checkDuplicateSKUs() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB');
        // Find all products
        const products = await Product_1.Product.find({});
        console.log(`\nTotal Products: ${products.length}`);
        // Group products by SKU
        const skuMap = new Map();
        products.forEach(product => {
            const sku = product.sku;
            if (!skuMap.has(sku)) {
                skuMap.set(sku, []);
            }
            skuMap.get(sku).push({
                _id: product._id,
                title: product.title,
                sku: product.sku,
                createdAt: product.createdAt
            });
        });
        // Find duplicates
        console.log('\n=== CHECKING FOR DUPLICATE SKUs ===\n');
        let duplicateCount = 0;
        skuMap.forEach((products, sku) => {
            if (products.length > 1) {
                duplicateCount++;
                console.log(`❌ DUPLICATE SKU: "${sku}" (${products.length} products)`);
                products.forEach((p, index) => {
                    console.log(`   ${index + 1}. ID: ${p._id} | Title: ${p.title} | Created: ${p.createdAt}`);
                });
                console.log('');
            }
        });
        if (duplicateCount === 0) {
            console.log('✅ No duplicate SKUs found!');
        }
        else {
            console.log(`\n⚠️  Found ${duplicateCount} duplicate SKU(s)`);
            console.log('\nTo fix this issue, you need to:');
            console.log('1. Delete the duplicate products OR');
            console.log('2. Update the SKUs to be unique');
        }
        // Check for the specific SKU mentioned in the error
        const problematicSKU = 'asdasdasd';
        const productsWithSKU = products.filter(p => p.sku === problematicSKU);
        if (productsWithSKU.length > 0) {
            console.log(`\n=== PRODUCTS WITH SKU "${problematicSKU}" ===`);
            productsWithSKU.forEach(p => {
                console.log(`ID: ${p._id} | Title: ${p.title}`);
            });
        }
        // Check indexes
        console.log('\n=== CHECKING INDEXES ===');
        const indexes = await Product_1.Product.collection.getIndexes();
        console.log('Current indexes on Product collection:');
        Object.keys(indexes).forEach(indexName => {
            console.log(`  - ${indexName}: ${JSON.stringify(indexes[indexName])}`);
        });
        process.exit(0);
    }
    catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
checkDuplicateSKUs();
