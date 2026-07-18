"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const Product_1 = require("./src/models/Product");
async function analyzeIssue() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB\n');
        const problematicSKU = 'asdasdasd';
        // Find products with this SKU
        const products = await Product_1.Product.find({ sku: problematicSKU });
        console.log('='.repeat(60));
        console.log(`CHECKING FOR SKU: "${problematicSKU}"`);
        console.log('='.repeat(60));
        if (products.length > 0) {
            console.log(`\n❌ FOUND ${products.length} PRODUCT(S) WITH THIS SKU:\n`);
            products.forEach((p, index) => {
                console.log(`Product ${index + 1}:`);
                console.log(`  ID:      ${p._id}`);
                console.log(`  Title:   ${p.title}`);
                console.log(`  SKU:     ${p.sku}`);
                console.log(`  Status:  ${p.status}`);
                console.log(`  Created: ${p.createdAt}`);
                console.log('');
            });
        }
        else {
            console.log('\n✅ No products currently exist with this SKU');
            console.log('   (It may have been deleted, but the unique index still prevents reuse)');
        }
        console.log('\n' + '='.repeat(60));
        console.log('SOLUTION OPTIONS');
        console.log('='.repeat(60));
        if (products.length > 0) {
            console.log('\nOption 1: UPDATE the existing product');
            console.log(`  Use: PUT /api/products/${products[0]._id}`);
            console.log('  This will modify the existing product instead of creating a new one');
            console.log('\nOption 2: DELETE the existing product first');
            console.log(`  Use: DELETE /api/products/${products[0]._id}`);
            console.log('  Then create a new product with the same SKU');
            console.log('\nOption 3: Use a DIFFERENT SKU');
            console.log('  Generate a unique SKU like: PROD-' + Date.now());
        }
        else {
            console.log('\nOption 1: Use a DIFFERENT SKU');
            console.log('  The SKU "asdasdasd" was likely used before and deleted');
            console.log('  Generate a unique SKU like: PROD-' + Date.now());
            console.log('  Or use a meaningful SKU like: PHONE-IP15-BLK-128GB');
        }
        process.exit(0);
    }
    catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
analyzeIssue();
