"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const EyewearAttribute_1 = require("./src/models/EyewearAttribute");
dotenv_1.default.config();
const DEFAULT_ATTRIBUTES = [
    // Frame Shapes
    { type: 'frameShape', name: 'Round' },
    { type: 'frameShape', name: 'Square' },
    { type: 'frameShape', name: 'Aviator' },
    { type: 'frameShape', name: 'Cat-Eye' },
    { type: 'frameShape', name: 'Wayfarer' },
    { type: 'frameShape', name: 'Rectangle' },
    { type: 'frameShape', name: 'Oval' },
    { type: 'frameShape', name: 'Hexagonal' },
    { type: 'frameShape', name: 'Geometric' },
    // Frame Materials
    { type: 'frameMaterial', name: 'Plastic' },
    { type: 'frameMaterial', name: 'Metal' },
    { type: 'frameMaterial', name: 'Titanium' },
    { type: 'frameMaterial', name: 'Acetate' },
    { type: 'frameMaterial', name: 'TR90' },
    { type: 'frameMaterial', name: 'Wood' },
    { type: 'frameMaterial', name: 'Carbon Fiber' },
    // Lens Types
    { type: 'lensType', name: 'Polarized' },
    { type: 'lensType', name: 'UV Protection' },
    { type: 'lensType', name: 'Blue Light' },
    { type: 'lensType', name: 'Photochromic' },
    { type: 'lensType', name: 'Normal' },
    { type: 'lensType', name: 'Mirrored' },
    { type: 'lensType', name: 'Gradient' },
    // Genders
    { type: 'gender', name: 'Men' },
    { type: 'gender', name: 'Women' },
    { type: 'gender', name: 'Unisex' },
    { type: 'gender', name: 'Kids' }
];
async function seed() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sunglasses';
        console.log('Connecting to:', mongoUri);
        await mongoose_1.default.connect(mongoUri);
        console.log('Clearing existing attributes...');
        await EyewearAttribute_1.EyewearAttribute.deleteMany({});
        console.log('Seeding default attributes...');
        await EyewearAttribute_1.EyewearAttribute.insertMany(DEFAULT_ATTRIBUTES);
        console.log('Successfully seeded attributes!');
        process.exit(0);
    }
    catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}
seed();
