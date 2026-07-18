"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const Category_1 = require("./src/models/Category");
async function checkModel() {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI || '');
        console.log('Connected');
        console.log('DB Name:', mongoose_1.default.connection.name);
        console.log('Collection Name:', Category_1.Category.collection.name);
        const count = await Category_1.Category.countDocuments();
        console.log('Count:', count);
        process.exit(0);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkModel();
