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
            fs.appendFileSync('subsub_details.txt', msg + '\n', 'utf8');
        };
        if (fs.existsSync('subsub_details.txt'))
            fs.unlinkSync('subsub_details.txt');
        const genderCats = await db.collection('categories').find({
            level: 'sub',
            name: { $in: genderNames }
        }).toArray();
        for (const cat of genderCats) {
            const parent = await db.collection('categories').findOne({ _id: cat.parentId });
            log(`Container: "${cat.name}" (Sub) inside "${parent ? parent.name : 'Unknown'}"`);
            const children = await db.collection('categories').find({ parentId: cat._id }).toArray();
            log(`  Children (${children.length}):`);
            children.forEach(c => {
                log(`    - "${c.name}" (Level: ${c.level}, _id: ${c._id})`);
            });
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
