"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const Category_1 = require("./src/models/Category");
async function test() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB');
        // Clear categories
        await Category_1.Category.deleteMany({});
        console.log('Cleared categories');
        // Try creating a simple category
        const testCat = await Category_1.Category.create({
            name: 'Test Category',
            slug: 'test-category',
            level: 'main'
        });
        console.log('Created test category:', testCat);
        process.exit(0);
    }
    catch (error) {
        console.error('Full error:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        process.exit(1);
    }
}
test();
