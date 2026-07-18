"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const LensType_1 = require("./src/models/LensType");
const LensPackage_1 = require("./src/models/LensPackage");
const Vendor_1 = require("./src/models/Vendor");
async function check() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        console.log('--- DATABASE LENS VERIFICATION ---');
        const vendors = await Vendor_1.Vendor.find({});
        console.log(`Found ${vendors.length} vendors.\n`);
        for (const vendor of vendors) {
            const types = await LensType_1.LensType.find({ vendorId: vendor._id });
            const pkgs = await LensPackage_1.LensPackage.find({ vendorId: vendor._id });
            console.log(`Vendor: ${vendor.businessName} (ID: ${vendor._id})`);
            console.log(` - Lens Types: ${types.length}`);
            console.log(` - Lens Packages: ${pkgs.length}`);
            if (types.length > 0) {
                console.log(` - Sample Types: ${types.map(t => t.name).join(', ')}`);
            }
            console.log('---------------------------');
        }
        const globalTypes = await LensType_1.LensType.find({ vendorId: null });
        const globalPkgs = await LensPackage_1.LensPackage.find({ vendorId: null });
        console.log(`Platform Global (vendorId: null)`);
        console.log(` - Lens Types: ${globalTypes.length}`);
        console.log(` - Lens Packages: ${globalPkgs.length}`);
        console.log('---------------------------');
        process.exit(0);
    }
    catch (error) {
        console.error('Check error:', error);
        process.exit(1);
    }
}
check();
