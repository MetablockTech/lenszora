"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const Product_1 = require("./src/models/Product");
async function findProduct() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        const sku = 'asdasdasd';
        const product = await Product_1.Product.findOne({ sku });
        if (product) {
            console.log(JSON.stringify({
                _id: product._id,
                title: product.title,
                sku: product.sku,
                status: product.status,
                createdAt: product.createdAt
            }, null, 2));
        }
        else {
            console.log('NOT_FOUND');
        }
        process.exit(0);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}
findProduct();
