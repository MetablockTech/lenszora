"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fs = __importStar(require("fs"));
async function run() {
    try {
        await mongoose_1.default.connect('mongodb://localhost:27017/sunglasses-marketplace');
        const db = mongoose_1.default.connection.db;
        const genderNames = ['Men', 'Women', 'Kids', 'Unisex'];
        const log = (msg) => {
            console.log(msg);
            fs.appendFileSync('research_results.txt', msg + '\n', 'utf8');
        };
        if (fs.existsSync('research_results.txt'))
            fs.unlinkSync('research_results.txt');
        log('Connected to MongoDB');
        const categories = await db.collection('categories').find({
            name: { $in: genderNames }
        }).toArray();
        log(`Found ${categories.length} categories matching gender names.`);
        for (const cat of categories) {
            const childrenCount = await db.collection('categories').countDocuments({ parentId: cat._id });
            const productsCount = await db.collection('products').countDocuments({ category: cat._id });
            // Find parent name
            let parentName = 'None';
            if (cat.parentId) {
                const parent = await db.collection('categories').findOne({ _id: cat.parentId });
                parentName = parent ? parent.name : 'Unknown';
            }
            log(`- Cat: "${cat.name}"`);
            log(`  _id: ${cat._id}`);
            log(`  Level: ${cat.level}`);
            log(`  Parent: ${parentName} (${cat.parentId})`);
            log(`  Children count: ${childrenCount}`);
            log(`  Products count: ${productsCount}`);
            if (productsCount > 0) {
                // Peek at some products to see if they have eyewearDetails.gender set
                const products = await db.collection('products').find({ category: cat._id }).limit(5).toArray();
                log(`  Peeking at products:`);
                products.forEach(p => {
                    const genderSet = p.eyewearDetails && p.eyewearDetails.gender;
                    log(`    * Product: "${p.title}", gender attribute: ${genderSet || 'NOT SET'}`);
                });
            }
            log('---');
        }
    }
    catch (err) {
        console.error(err);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
run();
