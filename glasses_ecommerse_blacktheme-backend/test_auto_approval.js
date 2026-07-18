"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Setting_1 = require("./src/models/Setting");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sunglasses';
async function testAutoApproval() {
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    // 1. Test with Auto-Approval ON
    await Setting_1.Setting.findOneAndUpdate({ key: 'autoApproveVendorProducts' }, { value: true, type: 'boolean', category: 'general' }, { upsert: true });
    console.log('Enabled Auto-Approval');
    // Simulate product creation logic (mocked because it relies on req.user)
    const isAutoApprove = (await Setting_1.Setting.findOne({ key: 'autoApproveVendorProducts' }))?.value === true;
    const testStatusOn = isAutoApprove ? 'active' : 'pending';
    console.log('Status with Auto-Approval ON:', testStatusOn);
    // 2. Test with Auto-Approval OFF
    await Setting_1.Setting.findOneAndUpdate({ key: 'autoApproveVendorProducts' }, { value: false, type: 'boolean', category: 'general' }, { upsert: true });
    console.log('Disabled Auto-Approval');
    const isAutoApproveOff = (await Setting_1.Setting.findOne({ key: 'autoApproveVendorProducts' }))?.value === true;
    const testStatusOff = isAutoApproveOff ? 'active' : 'pending';
    console.log('Status with Auto-Approval OFF:', testStatusOff);
    await mongoose_1.default.disconnect();
}
testAutoApproval().catch(console.error);
