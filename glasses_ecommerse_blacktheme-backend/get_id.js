"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const Product_1 = require("./src/models/Product");
async function getIds() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        const product = await Product_1.Product.findOne({ title: 'iPhone 15 Pro Max' });
        if (product) {
            console.log(`PRODUCT_ID: ${product._id}`);
        }
        else {
            console.log('Product not found');
        }
        process.exit(0);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}
getIds();
