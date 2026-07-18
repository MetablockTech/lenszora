"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const Category_1 = require("./src/models/Category");
const Product_1 = __importDefault(require("./src/models/Product"));
async function debugBD() {
    try {
        const uri = process.env.MONGO_URI || 'not set';
        console.log(`Connecting to: ${uri}`);
        await mongoose_1.default.connect(uri);
        console.log('Connected to MongoDB');
        const catCount = await Category_1.Category.countDocuments();
        const prodCount = await Product_1.default.countDocuments();
        console.log(`Categories count: ${catCount}`);
        console.log(`Products count: ${prodCount}`);
        if (catCount > 0) {
            const sampleCat = await Category_1.Category.findOne();
            console.log('Sample Category:', sampleCat?.name);
        }
        process.exit(0);
    }
    catch (err) {
        console.error('Debug script failed:', err);
        process.exit(1);
    }
}
debugBD();
