"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const Category_1 = require("./src/models/Category");
const Product_1 = __importDefault(require("./src/models/Product"));
async function check() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB');
        const categories = await Category_1.Category.find({});
        console.log(`Total Categories: ${categories.length}`);
        console.log('Sample Categories:', categories.map(c => c.name).slice(0, 5));
        const products = await Product_1.default.find({});
        console.log(`Total Products: ${products.length}`);
        console.log('Sample Products:', products.map(p => p.title).slice(0, 5));
        process.exit(0);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
