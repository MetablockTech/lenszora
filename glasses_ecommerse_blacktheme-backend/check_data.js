"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const Product_1 = require("./src/models/Product");
const Category_1 = require("./src/models/Category");
const Brand_1 = require("./src/models/Brand");
const Vendor_1 = require("./src/models/Vendor");
async function checkData() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB\n');
        const productCount = await Product_1.Product.countDocuments();
        const categoryCount = await Category_1.Category.countDocuments();
        const brandCount = await Brand_1.Brand.countDocuments();
        const vendorCount = await Vendor_1.Vendor.countDocuments();
        console.log('📊 Database Statistics:');
        console.log('=======================');
        console.log(`Products: ${productCount}`);
        console.log(`Categories: ${categoryCount}`);
        console.log(`Brands: ${brandCount}`);
        console.log(`Vendors: ${vendorCount}`);
        console.log('');
        // Show some sample products
        const sampleProducts = await Product_1.Product.find().limit(5).select('title price category brand');
        console.log('📦 Sample Products:');
        console.log('===================');
        sampleProducts.forEach((p, i) => {
            console.log(`${i + 1}. ${p.title} - ₹${p.price}`);
        });
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}
checkData();
