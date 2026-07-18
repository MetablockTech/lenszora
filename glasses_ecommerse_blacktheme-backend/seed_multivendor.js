"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongo_1 = require("./src/utils/mongo");
const User_1 = require("./src/models/User");
const Category_1 = require("./src/models/Category");
const Brand_1 = require("./src/models/Brand");
const Product_1 = require("./src/models/Product");
const Vendor_1 = require("./src/models/Vendor");
const Commission_1 = require("./src/models/Commission");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seed() {
    try {
        await (0, mongo_1.connectMongo)(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB');
        // Clear existing data
        await User_1.User.deleteMany({});
        await Category_1.Category.deleteMany({});
        await Brand_1.Brand.deleteMany({});
        await Product_1.Product.deleteMany({});
        await Vendor_1.Vendor.deleteMany({});
        await Commission_1.Commission.deleteMany({});
        console.log('Cleared existing data');
        // Create Admin User
        const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
        const admin = await User_1.User.create({
            email: 'admin@sunglasses.com',
            password: adminPassword,
            name: 'Admin',
            role: 'admin'
        });
        console.log('✓ Created admin user');
        // Create Admin Vendor (for platform-owned products)
        const adminVendor = await Vendor_1.Vendor.create({
            userId: admin._id,
            businessName: 'Platform Store',
            slug: 'platform-store',
            description: 'Official platform store',
            email: 'admin@sunglasses.com',
            phone: '1234567890',
            address: {
                street: '123 Main St',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400001',
                country: 'India'
            },
            bankDetails: {
                accountHolderName: 'Platform Store',
                accountNumber: '1234567890',
                bankName: 'HDFC Bank',
                ifscCode: 'HDFC0000123'
            },
            verificationStatus: 'approved',
            commissionRate: 0
        });
        admin.vendorId = adminVendor._id;
        await admin.save();
        console.log('✓ Created admin vendor');
        // Create Sample Vendors
        const vendor1Password = await bcryptjs_1.default.hash('vendor123', 10);
        const vendor1User = await User_1.User.create({
            email: 'rayban@vendor.com',
            password: vendor1Password,
            name: 'Ray-Ban India',
            phone: '9876543210',
            role: 'vendor'
        });
        const vendor1 = await Vendor_1.Vendor.create({
            userId: vendor1User._id,
            businessName: 'Ray-Ban Official Store',
            slug: 'rayban-official',
            description: 'Authorized Ray-Ban dealer offering authentic sunglasses and eyewear',
            email: 'rayban@vendor.com',
            phone: '9876543210',
            address: {
                street: '456 Fashion St',
                city: 'Delhi',
                state: 'Delhi',
                zipCode: '110001',
                country: 'India'
            },
            bankDetails: {
                accountHolderName: 'Ray-Ban India Pvt Ltd',
                accountNumber: '9876543210',
                bankName: 'ICICI Bank',
                ifscCode: 'ICIC0000456'
            },
            verificationStatus: 'approved',
            commissionRate: 12
        });
        vendor1User.vendorId = vendor1._id;
        await vendor1User.save();
        const vendor2Password = await bcryptjs_1.default.hash('vendor123', 10);
        const vendor2User = await User_1.User.create({
            email: 'oakley@vendor.com',
            password: vendor2Password,
            name: 'Oakley Store',
            phone: '9123456789',
            role: 'vendor'
        });
        const vendor2 = await Vendor_1.Vendor.create({
            userId: vendor2User._id,
            businessName: 'Oakley Sports Eyewear',
            slug: 'oakley-sports',
            description: 'Premium sports sunglasses and performance eyewear',
            email: 'oakley@vendor.com',
            phone: '9123456789',
            address: {
                street: '789 Sports Complex',
                city: 'Bangalore',
                state: 'Karnataka',
                zipCode: '560001',
                country: 'India'
            },
            bankDetails: {
                accountHolderName: 'Oakley India',
                accountNumber: '5555666677',
                bankName: 'Axis Bank',
                ifscCode: 'UTIB0000789'
            },
            verificationStatus: 'approved',
            commissionRate: 15
        });
        vendor2User.vendorId = vendor2._id;
        await vendor2User.save();
        console.log('✓ Created sample vendors');
        // Create Commission Settings
        await Commission_1.Commission.create({
            defaultRate: 15,
            categoryRates: [],
            vendorRates: []
        });
        console.log('✓ Created commission settings');
        // Create Eyewear Categories (3-level hierarchy)
        // MAIN CATEGORIES
        const eyewearMain = await Category_1.Category.create({
            name: 'Eyeglasses',
            slug: 'eyeglasses',
            level: 'main',
            description: 'Prescription and non-prescription eyeglasses',
            showFrameDetails: true,
            allowLensSelection: true
        });
        const sunglassesMain = await Category_1.Category.create({
            name: 'Sunglasses',
            slug: 'sunglasses',
            level: 'main',
            description: 'UV protection sunglasses for men, women, and kids',
            showFrameDetails: true,
            allowLensSelection: true
        });
        const contactLensesMain = await Category_1.Category.create({
            name: 'Contact Lenses',
            slug: 'contact-lenses',
            level: 'main',
            description: 'Daily, monthly, and colored contact lenses',
            showFrameDetails: false,
            allowLensSelection: false
        });
        const accessoriesMain = await Category_1.Category.create({
            name: 'Accessories',
            slug: 'accessories',
            level: 'main',
            description: 'Eyewear accessories and care products',
            showFrameDetails: false,
            allowLensSelection: false
        });
        // EYEGLASSES SUBCATEGORIES
        const eyeglassesMen = await Category_1.Category.create({
            name: 'Men',
            slug: 'men-eyeglasses',
            level: 'sub',
            parentId: eyewearMain._id,
            showFrameDetails: true,
            allowLensSelection: true
        });
        const eyeglassesWomen = await Category_1.Category.create({
            name: 'Women',
            slug: 'women-eyeglasses',
            level: 'sub',
            parentId: eyewearMain._id,
            showFrameDetails: true,
            allowLensSelection: true
        });
        const eyeglassesKids = await Category_1.Category.create({
            name: 'Kids',
            slug: 'kids-eyeglasses',
            level: 'sub',
            parentId: eyewearMain._id,
            showFrameDetails: true,
            allowLensSelection: true
        });
        // SUNGLASSES SUBCATEGORIES
        const sunglassesMen = await Category_1.Category.create({
            name: 'Men',
            slug: 'men-sunglasses',
            level: 'sub',
            parentId: sunglassesMain._id,
            showFrameDetails: true,
            allowLensSelection: true
        });
        const sunglassesWomen = await Category_1.Category.create({
            name: 'Women',
            slug: 'women-sunglasses',
            level: 'sub',
            parentId: sunglassesMain._id,
            showFrameDetails: true,
            allowLensSelection: true
        });
        const sunglassesKids = await Category_1.Category.create({
            name: 'Kids',
            slug: 'kids-sunglasses',
            level: 'sub',
            parentId: sunglassesMain._id,
            showFrameDetails: true,
            allowLensSelection: true
        });
        const sportsSunglasses = await Category_1.Category.create({
            name: 'Sports',
            slug: 'sports-sunglasses',
            level: 'sub',
            parentId: sunglassesMain._id,
            showFrameDetails: true,
            allowLensSelection: true
        });
        // EYEGLASSES SUB-SUBCATEGORIES
        // Men
        const prescriptionMen = await Category_1.Category.create({
            name: 'Prescription Glasses',
            slug: 'prescription-glasses-men',
            level: 'subsub',
            parentId: eyeglassesMen._id,
            showFrameDetails: true,
            allowLensSelection: true
        });
        const zeroPowerMen = await Category_1.Category.create({
            name: 'Zero Power (Fashion)',
            slug: 'zero-power-fashion-men',
            level: 'subsub',
            parentId: eyeglassesMen._id,
            showFrameDetails: true,
            allowLensSelection: true
        });
        const computerGlassesMen = await Category_1.Category.create({
            name: 'Computer Glasses',
            slug: 'computer-glasses-men',
            level: 'subsub',
            parentId: eyeglassesMen._id,
            showFrameDetails: true,
            allowLensSelection: true
        });
        const readingMen = await Category_1.Category.create({
            name: 'Reading Glasses',
            slug: 'reading-glasses-men',
            level: 'subsub',
            parentId: eyeglassesMen._id
        });
        // Women
        const prescriptionWomen = await Category_1.Category.create({
            name: 'Prescription Glasses',
            slug: 'prescription-glasses-women',
            level: 'subsub',
            parentId: eyeglassesWomen._id
        });
        const zeroPowerWomen = await Category_1.Category.create({
            name: 'Zero Power (Fashion)',
            slug: 'zero-power-fashion-women',
            level: 'subsub',
            parentId: eyeglassesWomen._id
        });
        const computerWomen = await Category_1.Category.create({
            name: 'Computer / Blue-Light',
            slug: 'computer-blue-light-women',
            level: 'subsub',
            parentId: eyeglassesWomen._id
        });
        const readingWomen = await Category_1.Category.create({
            name: 'Reading Glasses',
            slug: 'reading-glasses-women',
            level: 'subsub',
            parentId: eyeglassesWomen._id
        });
        // SUNGLASSES SUB-SUBCATEGORIES (by type)
        // Men Sunglasses
        const normalMen = await Category_1.Category.create({
            name: 'Normal Sunglasses',
            slug: 'normal-sunglasses-men',
            level: 'subsub',
            parentId: sunglassesMen._id,
            description: 'Regular sunglasses for everyday use'
        });
        const polarizedMen = await Category_1.Category.create({
            name: 'Polarized Sunglasses',
            slug: 'polarized-sunglasses-men',
            level: 'subsub',
            parentId: sunglassesMen._id,
            description: 'Polarized lenses for reduced glare'
        });
        const uvProtectionMen = await Category_1.Category.create({
            name: 'UV Protection',
            slug: 'uv-protection-men',
            level: 'subsub',
            parentId: sunglassesMen._id,
            description: '100% UV protection sunglasses'
        });
        const sportsMen = await Category_1.Category.create({
            name: 'Sports Sunglasses',
            slug: 'sports-sunglasses-men',
            level: 'subsub',
            parentId: sunglassesMen._id,
            description: 'Sunglasses for sports and outdoor activities'
        });
        const drivingMen = await Category_1.Category.create({
            name: 'Driving Sunglasses',
            slug: 'driving-sunglasses-men',
            level: 'subsub',
            parentId: sunglassesMen._id,
            description: 'Sunglasses optimized for driving'
        });
        // Women Sunglasses
        const normalWomen = await Category_1.Category.create({
            name: 'Normal Sunglasses',
            slug: 'normal-sunglasses-women',
            level: 'subsub',
            parentId: sunglassesWomen._id,
            description: 'Regular sunglasses for everyday use'
        });
        const polarizedWomen = await Category_1.Category.create({
            name: 'Polarized Sunglasses',
            slug: 'polarized-sunglasses-women',
            level: 'subsub',
            parentId: sunglassesWomen._id,
            description: 'Polarized lenses for reduced glare'
        });
        const uvProtectionWomen = await Category_1.Category.create({
            name: 'UV Protection',
            slug: 'uv-protection-women',
            level: 'subsub',
            parentId: sunglassesWomen._id,
            description: '100% UV protection sunglasses'
        });
        const sportsWomen = await Category_1.Category.create({
            name: 'Sports Sunglasses',
            slug: 'sports-sunglasses-women',
            level: 'subsub',
            parentId: sunglassesWomen._id,
            description: 'Sunglasses for sports and outdoor activities'
        });
        const fashionWomen = await Category_1.Category.create({
            name: 'Fashion Sunglasses',
            slug: 'fashion-sunglasses-women',
            level: 'subsub',
            parentId: sunglassesWomen._id,
            description: 'Trendy and stylish sunglasses'
        });
        // Kids Sunglasses
        const normalKids = await Category_1.Category.create({
            name: 'Normal Sunglasses',
            slug: 'normal-sunglasses-kids',
            level: 'subsub',
            parentId: sunglassesKids._id,
            description: 'Regular sunglasses for kids'
        });
        const uvProtectionKids = await Category_1.Category.create({
            name: 'UV Protection',
            slug: 'uv-protection-kids',
            level: 'subsub',
            parentId: sunglassesKids._id,
            description: '100% UV protection for kids'
        });
        const sportsKids = await Category_1.Category.create({
            name: 'Sports Sunglasses',
            slug: 'sports-sunglasses-kids',
            level: 'subsub',
            parentId: sunglassesKids._id,
            description: 'Durable sunglasses for active kids'
        });
        // CONTACT LENSES SUBCATEGORIES
        const dailyDisposable = await Category_1.Category.create({
            name: 'Daily Disposable',
            slug: 'daily-disposable',
            level: 'sub',
            parentId: contactLensesMain._id
        });
        const monthlyDisposable = await Category_1.Category.create({
            name: 'Monthly Disposable',
            slug: 'monthly-disposable',
            level: 'sub',
            parentId: contactLensesMain._id
        });
        const solutionsCare = await Category_1.Category.create({
            name: 'Solutions & Care',
            slug: 'solutions-care',
            level: 'sub',
            parentId: contactLensesMain._id
        });
        // CONTACT LENSES SUB-SUBCATEGORIES
        // Daily Disposable
        const dailyClear = await Category_1.Category.create({
            name: 'Clear Lenses',
            slug: 'daily-clear-lenses',
            level: 'subsub',
            parentId: dailyDisposable._id
        });
        const dailyColored = await Category_1.Category.create({
            name: 'Colored Lenses',
            slug: 'daily-colored-lenses',
            level: 'subsub',
            parentId: dailyDisposable._id
        });
        // Monthly Disposable
        const monthlyClear = await Category_1.Category.create({
            name: 'Clear Lenses',
            slug: 'monthly-clear-lenses',
            level: 'subsub',
            parentId: monthlyDisposable._id
        });
        const monthlyColored = await Category_1.Category.create({
            name: 'Colored Lenses',
            slug: 'monthly-colored-lenses',
            level: 'subsub',
            parentId: monthlyDisposable._id
        });
        const monthlyToric = await Category_1.Category.create({
            name: 'Toric (Astigmatism)',
            slug: 'monthly-toric-lenses',
            level: 'subsub',
            parentId: monthlyDisposable._id
        });
        // Solutions & Care
        const lensSolutions = await Category_1.Category.create({
            name: 'Lens Solutions',
            slug: 'lens-solutions',
            level: 'subsub',
            parentId: solutionsCare._id
        });
        const eyeDrops = await Category_1.Category.create({
            name: 'Eye Drops',
            slug: 'eye-drops',
            level: 'subsub',
            parentId: solutionsCare._id
        });
        const lensCases = await Category_1.Category.create({
            name: 'Lens Cases',
            slug: 'lens-cases',
            level: 'subsub',
            parentId: solutionsCare._id
        });
        // ACCESSORIES SUBCATEGORIES
        const eyewearCases = await Category_1.Category.create({
            name: 'Eyewear Cases',
            slug: 'eyewear-cases',
            level: 'sub',
            parentId: accessoriesMain._id
        });
        const cleaningKits = await Category_1.Category.create({
            name: 'Cleaning Kits',
            slug: 'cleaning-kits',
            level: 'sub',
            parentId: accessoriesMain._id
        });
        const chainsStraps = await Category_1.Category.create({
            name: 'Chains & Straps',
            slug: 'chains-straps',
            level: 'sub',
            parentId: accessoriesMain._id
        });
        // ACCESSORIES SUB-SUBCATEGORIES
        // Eyewear Cases
        const hardCases = await Category_1.Category.create({
            name: 'Hard Cases',
            slug: 'hard-cases',
            level: 'subsub',
            parentId: eyewearCases._id
        });
        const softPouches = await Category_1.Category.create({
            name: 'Soft Pouches',
            slug: 'soft-pouches',
            level: 'subsub',
            parentId: eyewearCases._id
        });
        // Cleaning Kits
        const sprayKits = await Category_1.Category.create({
            name: 'Spray & Cloth Kits',
            slug: 'spray-cloth-kits',
            level: 'subsub',
            parentId: cleaningKits._id
        });
        const microfiber = await Category_1.Category.create({
            name: 'Microfiber Cloths',
            slug: 'microfiber-cloths',
            level: 'subsub',
            parentId: cleaningKits._id
        });
        // Chains & Straps
        const metalChains = await Category_1.Category.create({
            name: 'Metal Chains',
            slug: 'metal-chains',
            level: 'subsub',
            parentId: chainsStraps._id
        });
        const beadedChains = await Category_1.Category.create({
            name: 'Beaded Chains',
            slug: 'beaded-chains',
            level: 'subsub',
            parentId: chainsStraps._id
        });
        console.log('✓ Created eyewear categories');
        // Create Brands
        const rayban = await Brand_1.Brand.create({
            name: 'Ray-Ban',
            slug: 'rayban',
            description: 'Iconic American-Italian brand of sunglasses and eyeglasses'
        });
        const oakley = await Brand_1.Brand.create({
            name: 'Oakley',
            slug: 'oakley',
            description: 'Premium sports performance eyewear'
        });
        const vogue = await Brand_1.Brand.create({
            name: 'Vogue',
            slug: 'vogue',
            description: 'Fashion-forward eyewear for women'
        });
        const carrera = await Brand_1.Brand.create({
            name: 'Carrera',
            slug: 'carrera',
            description: 'Sporty and stylish eyewear'
        });
        const vincente = await Brand_1.Brand.create({
            name: 'Vincent Chase',
            slug: 'vincent-chase',
            description: 'Affordable and trendy eyewear'
        });
        console.log('✓ Created brands');
        // Helper function for creating variants
        const createVariants = (colors, sizes = ['Standard']) => {
            const variants = [];
            for (const color of colors) {
                for (const size of sizes) {
                    variants.push({
                        color,
                        size,
                        stock: Math.floor(Math.random() * 40) + 15,
                        sku: `${color.substring(0, 3).toUpperCase()}-${size.substring(0, 2).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                    });
                }
            }
            return variants;
        };
        // Create Sample Products - 60 Products Total
        const products = [
            // === EYEGLASSES - MEN'S PRESCRIPTION (5) ===
            {
                title: 'Classic Aviator Eyeglasses',
                slug: 'classic-aviator-eyeglasses-men',
                description: 'Timeless aviator style prescription eyeglasses with premium metal frame',
                price: 2499,
                images: ['https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500'],
                category: prescriptionMen._id,
                brand: rayban._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Gold', 'Silver', 'Black']),
                eyewearDetails: {
                    frameShape: 'Aviator',
                    frameMaterial: 'Metal',
                    frameColor: 'Gold',
                    frameWidth: 140,
                    lensWidth: 56,
                    bridgeWidth: 14,
                    templeLength: 140,
                    gender: 'Men',
                    faceShape: ['Oval', 'Square', 'Heart'],
                    prescriptionAvailable: true,
                    features: ['Lightweight', 'Adjustable Nose Pads']
                },
                directLensOptions: [
                    { name: 'Single Vision', price: 500, description: 'Standard prescription lenses' },
                    { name: 'Progressive', price: 1500, description: 'Multi-focal lenses' }
                ]
            },
            {
                title: 'Modern Square Frame Glasses',
                slug: 'modern-square-frame-glasses',
                description: 'Contemporary square frame design for professional look',
                price: 1999,
                images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'],
                category: prescriptionMen._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Tortoise', 'Blue']),
                eyewearDetails: {
                    frameShape: 'Square',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    frameWidth: 145,
                    lensWidth: 52,
                    bridgeWidth: 18,
                    templeLength: 145,
                    gender: 'Men',
                    faceShape: ['Round', 'Oval'],
                    prescriptionAvailable: true,
                    features: ['Durable', 'Comfortable Fit']
                },
                directLensOptions: [
                    { name: 'Single Vision', price: 500, description: 'Standard prescription lenses' },
                    { name: 'Blue Light Blocking', price: 800, description: 'Reduces eye strain' }
                ]
            },
            {
                title: 'Round Vintage Eyeglasses',
                slug: 'round-vintage-eyeglasses',
                description: 'Classic round frame with vintage appeal',
                price: 1799,
                images: ['https://images.unsplash.com/photo-1577803645773-f96470509666?w=500'],
                category: prescriptionMen._id,
                brand: vincente._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Brown', 'Clear']),
                eyewearDetails: {
                    frameShape: 'Round',
                    frameMaterial: 'Metal',
                    frameColor: 'Black',
                    frameWidth: 138,
                    lensWidth: 48,
                    bridgeWidth: 20,
                    templeLength: 142,
                    gender: 'Men',
                    faceShape: ['Square', 'Diamond'],
                    prescriptionAvailable: true,
                    features: ['Retro Style', 'Lightweight']
                },
                directLensOptions: [
                    { name: 'Single Vision', price: 500, description: 'Standard prescription lenses' }
                ]
            },
            {
                title: 'Executive Rectangular Frames',
                slug: 'executive-rectangular-frames',
                description: 'Professional rectangular frames for business professionals',
                price: 2999,
                images: ['https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=500'],
                category: prescriptionMen._id,
                brand: carrera._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Gunmetal', 'Brown'], ['Standard', 'Large']),
                eyewearDetails: {
                    frameShape: 'Rectangle',
                    frameMaterial: 'Titanium',
                    frameColor: 'Black',
                    frameWidth: 142,
                    lensWidth: 54,
                    bridgeWidth: 16,
                    templeLength: 140,
                    gender: 'Men',
                    faceShape: ['Oval', 'Round', 'Square'],
                    prescriptionAvailable: true,
                    features: ['Premium Titanium', 'Flexible Temples']
                },
                directLensOptions: [
                    { name: 'Single Vision', price: 500, description: 'Standard prescription lenses' },
                    { name: 'Progressive', price: 1500, description: 'Multi-focal lenses' },
                    { name: 'Photochromic', price: 1200, description: 'Transitions lenses' }
                ]
            },
            {
                title: 'Sporty Wraparound Glasses',
                slug: 'sporty-wraparound-glasses',
                description: 'Athletic wraparound design for active lifestyle',
                price: 2299,
                images: ['https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500'],
                category: prescriptionMen._id,
                brand: oakley._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Blue', 'Red']),
                eyewearDetails: {
                    frameShape: 'Wraparound',
                    frameMaterial: 'TR90',
                    frameColor: 'Black',
                    frameWidth: 148,
                    lensWidth: 58,
                    bridgeWidth: 15,
                    templeLength: 135,
                    gender: 'Men',
                    faceShape: ['Oval', 'Square'],
                    prescriptionAvailable: true,
                    features: ['Sport Design', 'Impact Resistant']
                },
                directLensOptions: [
                    { name: 'Single Vision', price: 500, description: 'Standard prescription lenses' }
                ]
            },
            // === EYEGLASSES - WOMEN'S PRESCRIPTION (5) ===
            {
                title: 'Cat-Eye Fashion Frames',
                slug: 'cat-eye-fashion-frames',
                description: 'Elegant cat-eye frames with modern twist',
                price: 2199,
                images: ['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500'],
                category: prescriptionWomen._id,
                brand: vogue._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Red', 'Tortoise', 'Pink']),
                eyewearDetails: {
                    frameShape: 'Cat-Eye',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    frameWidth: 140,
                    lensWidth: 53,
                    bridgeWidth: 17,
                    templeLength: 140,
                    gender: 'Women',
                    faceShape: ['Round', 'Oval', 'Heart'],
                    prescriptionAvailable: true,
                    features: ['Fashion Forward', 'Elegant Design']
                },
                directLensOptions: [
                    { name: 'Single Vision', price: 500, description: 'Standard prescription lenses' },
                    { name: 'Progressive', price: 1500, description: 'Multi-focal lenses' }
                ]
            },
            {
                title: 'Oval Classic Eyeglasses',
                slug: 'oval-classic-eyeglasses-women',
                description: 'Timeless oval frames for everyday elegance',
                price: 1899,
                images: ['https://images.unsplash.com/photo-1614715838608-dd527c46231d?w=500'],
                category: prescriptionWomen._id,
                brand: vincente._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Brown', 'Purple']),
                eyewearDetails: {
                    frameShape: 'Oval',
                    frameMaterial: 'Metal',
                    frameColor: 'Black',
                    frameWidth: 135,
                    lensWidth: 50,
                    bridgeWidth: 18,
                    templeLength: 138,
                    gender: 'Women',
                    faceShape: ['Square', 'Diamond', 'Oval'],
                    prescriptionAvailable: true,
                    features: ['Classic Style', 'Lightweight']
                },
                directLensOptions: [
                    { name: 'Single Vision', price: 500, description: 'Standard prescription lenses' }
                ]
            },
            {
                title: 'Butterfly Oversized Frames',
                slug: 'butterfly-oversized-frames',
                description: 'Bold butterfly frames for statement look',
                price: 2499,
                images: ['https://images.unsplash.com/photo-1606999420134-2e95d8b1e5e5?w=500'],
                category: prescriptionWomen._id,
                brand: vogue._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Tortoise', 'Blue', 'Clear']),
                eyewearDetails: {
                    frameShape: 'Butterfly',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    frameWidth: 145,
                    lensWidth: 56,
                    bridgeWidth: 16,
                    templeLength: 142,
                    gender: 'Women',
                    faceShape: ['Round', 'Oval'],
                    prescriptionAvailable: true,
                    features: ['Oversized', 'Fashion Statement']
                },
                directLensOptions: [
                    { name: 'Single Vision', price: 500, description: 'Standard prescription lenses' },
                    { name: 'Blue Light Blocking', price: 800, description: 'Reduces eye strain' }
                ]
            },
            {
                title: 'Rectangular Professional Glasses',
                slug: 'rectangular-professional-glasses-women',
                description: 'Sleek rectangular frames for professional women',
                price: 2099,
                images: ['https://images.unsplash.com/photo-1622445275992-5f3b5e5d9e5e?w=500'],
                category: prescriptionWomen._id,
                brand: carrera._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Brown', 'Navy']),
                eyewearDetails: {
                    frameShape: 'Rectangle',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    frameWidth: 138,
                    lensWidth: 52,
                    bridgeWidth: 17,
                    templeLength: 140,
                    gender: 'Women',
                    faceShape: ['Round', 'Oval', 'Heart'],
                    prescriptionAvailable: true,
                    features: ['Professional', 'Comfortable']
                },
                directLensOptions: [
                    { name: 'Single Vision', price: 500, description: 'Standard prescription lenses' },
                    { name: 'Progressive', price: 1500, description: 'Multi-focal lenses' }
                ]
            },
            {
                title: 'Round Minimalist Frames',
                slug: 'round-minimalist-frames-women',
                description: 'Minimalist round frames for modern style',
                price: 1699,
                images: ['https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500'],
                category: prescriptionWomen._id,
                brand: vincente._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Gold', 'Silver', 'Rose Gold']),
                eyewearDetails: {
                    frameShape: 'Round',
                    frameMaterial: 'Metal',
                    frameColor: 'Gold',
                    frameWidth: 136,
                    lensWidth: 48,
                    bridgeWidth: 20,
                    templeLength: 140,
                    gender: 'Women',
                    faceShape: ['Square', 'Diamond'],
                    prescriptionAvailable: true,
                    features: ['Minimalist', 'Ultra Lightweight']
                },
                directLensOptions: [
                    { name: 'Single Vision', price: 500, description: 'Standard prescription lenses' }
                ]
            },
            // === COMPUTER GLASSES (4) ===
            {
                title: 'Blue Light Blocking Computer Glasses',
                slug: 'blue-light-blocking-computer-glasses',
                description: 'Protect your eyes from digital screen strain',
                price: 1499,
                images: ['https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500'],
                category: computerGlassesMen._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Clear', 'Tortoise']),
                eyewearDetails: {
                    frameShape: 'Rectangle',
                    frameMaterial: 'TR90',
                    frameColor: 'Black',
                    frameWidth: 142,
                    lensWidth: 52,
                    bridgeWidth: 18,
                    templeLength: 140,
                    gender: 'Unisex',
                    faceShape: ['Oval', 'Round', 'Square'],
                    prescriptionAvailable: false,
                    features: ['Blue Light Filter', 'Anti-Glare']
                }
            },
            {
                title: 'Gaming Computer Eyewear',
                slug: 'gaming-computer-eyewear',
                description: 'Specialized gaming glasses for extended screen time',
                price: 1799,
                images: ['https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=500'],
                category: computerWomen._id,
                brand: oakley._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Red', 'Blue']),
                eyewearDetails: {
                    frameShape: 'Rectangle',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    frameWidth: 145,
                    lensWidth: 54,
                    bridgeWidth: 16,
                    templeLength: 142,
                    gender: 'Unisex',
                    faceShape: ['Oval', 'Square'],
                    prescriptionAvailable: false,
                    features: ['Gaming Optimized', 'Blue Light Protection']
                }
            },
            {
                title: 'Office Professional Computer Glasses',
                slug: 'office-professional-computer-glasses',
                description: 'Stylish computer glasses for office professionals',
                price: 1599,
                images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'],
                category: computerGlassesMen._id,
                brand: carrera._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Brown', 'Gray']),
                eyewearDetails: {
                    frameShape: 'Square',
                    frameMaterial: 'Metal',
                    frameColor: 'Black',
                    frameWidth: 140,
                    lensWidth: 51,
                    bridgeWidth: 19,
                    templeLength: 140,
                    gender: 'Unisex',
                    faceShape: ['Round', 'Oval'],
                    prescriptionAvailable: false,
                    features: ['Professional Look', 'Blue Light Filter']
                }
            },
            {
                title: 'Lightweight Reading Computer Glasses',
                slug: 'lightweight-reading-computer-glasses',
                description: 'Ultra-light computer glasses for all-day comfort',
                price: 1299,
                images: ['https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500'],
                category: computerWomen._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Purple', 'Pink']),
                eyewearDetails: {
                    frameShape: 'Oval',
                    frameMaterial: 'TR90',
                    frameColor: 'Black',
                    frameWidth: 138,
                    lensWidth: 50,
                    bridgeWidth: 18,
                    templeLength: 138,
                    gender: 'Unisex',
                    faceShape: ['Oval', 'Round', 'Square'],
                    prescriptionAvailable: false,
                    features: ['Ultra Lightweight', 'Comfortable']
                }
            },
            // === SUNGLASSES - MEN'S (8) ===
            {
                title: 'Classic Wayfarer Sunglasses',
                slug: 'classic-wayfarer-sunglasses',
                description: 'Iconic wayfarer style sunglasses',
                price: 3499,
                images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'],
                category: normalMen._id,
                brand: rayban._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Tortoise', 'Blue']),
                eyewearDetails: {
                    frameShape: 'Wayfarer',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    glassColor: 'Dark Gray',
                    frameWidth: 145,
                    lensWidth: 50,
                    bridgeWidth: 22,
                    templeLength: 150,
                    gender: 'Men',
                    faceShape: ['Round', 'Oval', 'Diamond'],
                    features: ['UV Protection', 'Classic Style']
                }
            },
            {
                title: 'Aviator Gold Sunglasses',
                slug: 'aviator-gold-sunglasses',
                description: 'Timeless aviator sunglasses with gold frame',
                price: 3999,
                images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'],
                category: normalMen._id,
                brand: rayban._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Gold', 'Silver', 'Black']),
                eyewearDetails: {
                    frameShape: 'Aviator',
                    frameMaterial: 'Metal',
                    frameColor: 'Gold',
                    glassColor: 'Green',
                    frameWidth: 140,
                    lensWidth: 58,
                    bridgeWidth: 14,
                    templeLength: 135,
                    gender: 'Men',
                    faceShape: ['Oval', 'Square', 'Heart'],
                    features: ['UV400', 'Iconic Design']
                }
            },
            {
                title: 'Square Modern Sunglasses',
                slug: 'square-modern-sunglasses',
                description: 'Contemporary square frame sunglasses',
                price: 2799,
                images: ['https://images.unsplash.com/photo-1577803645773-f96470509666?w=500'],
                category: normalMen._id,
                brand: carrera._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Gray', 'Brown']),
                eyewearDetails: {
                    frameShape: 'Square',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    glassColor: 'Gray',
                    frameWidth: 143,
                    lensWidth: 52,
                    bridgeWidth: 20,
                    templeLength: 145,
                    gender: 'Men',
                    faceShape: ['Round', 'Oval'],
                    features: ['UV Protection', 'Modern Design']
                }
            },
            {
                title: 'Round Vintage Sunglasses',
                slug: 'round-vintage-sunglasses-men',
                description: 'Retro round sunglasses for vintage lovers',
                price: 2499,
                images: ['https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500'],
                category: normalMen._id,
                brand: vincente._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Gold', 'Silver']),
                eyewearDetails: {
                    frameShape: 'Round',
                    frameMaterial: 'Metal',
                    frameColor: 'Black',
                    glassColor: 'Brown',
                    frameWidth: 138,
                    lensWidth: 48,
                    bridgeWidth: 21,
                    templeLength: 140,
                    gender: 'Men',
                    faceShape: ['Square', 'Diamond'],
                    features: ['Retro Style', 'UV Protection']
                }
            },
            {
                title: 'Clubmaster Sunglasses',
                slug: 'clubmaster-sunglasses',
                description: 'Classic clubmaster style with browline',
                price: 3299,
                images: ['https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=500'],
                category: normalMen._id,
                brand: rayban._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Tortoise']),
                eyewearDetails: {
                    frameShape: 'Clubmaster',
                    frameMaterial: 'Acetate/Metal',
                    frameColor: 'Black',
                    glassColor: 'Green',
                    frameWidth: 140,
                    lensWidth: 51,
                    bridgeWidth: 21,
                    templeLength: 145,
                    gender: 'Men',
                    faceShape: ['Oval', 'Round', 'Square'],
                    features: ['Iconic Browline', 'UV400']
                }
            },
            {
                title: 'Wraparound Sport Sunglasses',
                slug: 'wraparound-sport-sunglasses',
                description: 'Athletic wraparound sunglasses for active lifestyle',
                price: 2999,
                images: ['https://images.unsplash.com/photo-1614715838608-dd527c46231d?w=500'],
                category: normalMen._id,
                brand: oakley._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Blue', 'Red']),
                eyewearDetails: {
                    frameShape: 'Wraparound',
                    frameMaterial: 'TR90',
                    frameColor: 'Black',
                    glassColor: 'Black',
                    frameWidth: 148,
                    lensWidth: 60,
                    bridgeWidth: 15,
                    templeLength: 130,
                    gender: 'Men',
                    faceShape: ['Oval', 'Square'],
                    features: ['Sport Design', 'Impact Resistant']
                }
            },
            {
                title: 'Polarized Driving Sunglasses',
                slug: 'polarized-driving-sunglasses-men',
                description: 'Polarized sunglasses perfect for driving',
                price: 3799,
                images: ['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500'],
                category: drivingMen._id,
                brand: carrera._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Gray', 'Brown']),
                eyewearDetails: {
                    frameShape: 'Rectangle',
                    frameMaterial: 'Metal',
                    frameColor: 'Black',
                    glassColor: 'Gray',
                    frameWidth: 142,
                    lensWidth: 56,
                    bridgeWidth: 16,
                    templeLength: 140,
                    gender: 'Men',
                    faceShape: ['Oval', 'Square', 'Round'],
                    features: ['Polarized', 'Anti-Glare', 'UV400']
                }
            },
            {
                title: 'Sports Performance Sunglasses',
                slug: 'sports-performance-sunglasses',
                description: 'High-performance sunglasses for athletes',
                price: 4299,
                images: ['https://images.unsplash.com/photo-1606999420134-2e95d8b1e5e5?w=500'],
                category: sportsMen._id,
                brand: oakley._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'White', 'Red']),
                eyewearDetails: {
                    frameShape: 'Sport',
                    frameMaterial: 'O Matter',
                    frameColor: 'Black',
                    glassColor: 'Black Iridium',
                    frameWidth: 140,
                    lensWidth: 59,
                    bridgeWidth: 12,
                    templeLength: 133,
                    gender: 'Men',
                    faceShape: ['Oval', 'Square'],
                    features: ['Impact Resistant', 'Anti-Fog', 'UV400']
                }
            },
            // === SUNGLASSES - WOMEN'S (8) ===
            {
                title: 'Cat-Eye Fashion Sunglasses',
                slug: 'cat-eye-fashion-sunglasses',
                description: 'Stylish cat-eye sunglasses for fashionistas',
                price: 2899,
                images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'],
                category: normalWomen._id,
                brand: vogue._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Red', 'Tortoise', 'Pink']),
                eyewearDetails: {
                    frameShape: 'Cat-Eye',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    glassColor: 'Gray',
                    frameWidth: 142,
                    lensWidth: 54,
                    bridgeWidth: 18,
                    templeLength: 140,
                    gender: 'Women',
                    faceShape: ['Round', 'Oval', 'Heart'],
                    features: ['Fashion Forward', 'UV Protection']
                }
            },
            {
                title: 'Oversized Glamour Sunglasses',
                slug: 'oversized-glamour-sunglasses',
                description: 'Oversized sunglasses for glamorous look',
                price: 3199,
                images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'],
                category: normalWomen._id,
                brand: vogue._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Brown', 'Tortoise']),
                eyewearDetails: {
                    frameShape: 'Oversized',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    glassColor: 'Brown',
                    frameWidth: 148,
                    lensWidth: 58,
                    bridgeWidth: 16,
                    templeLength: 145,
                    gender: 'Women',
                    faceShape: ['Oval', 'Round', 'Heart'],
                    features: ['Oversized', 'UV400']
                }
            },
            {
                title: 'Round Retro Sunglasses',
                slug: 'round-retro-sunglasses-women',
                description: 'Vintage-inspired round sunglasses',
                price: 2599,
                images: ['https://images.unsplash.com/photo-1577803645773-f96470509666?w=500'],
                category: normalWomen._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Gold', 'Rose Gold']),
                eyewearDetails: {
                    frameShape: 'Round',
                    frameMaterial: 'Metal',
                    frameColor: 'Gold',
                    glassColor: 'Brown',
                    frameWidth: 136,
                    lensWidth: 50,
                    bridgeWidth: 20,
                    templeLength: 140,
                    gender: 'Women',
                    faceShape: ['Square', 'Diamond'],
                    features: ['Retro Style', 'UV Protection']
                }
            },
            {
                title: 'Square Modern Sunglasses',
                slug: 'square-modern-sunglasses-women',
                description: 'Contemporary square sunglasses',
                price: 2799,
                images: ['https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500'],
                category: normalWomen._id,
                brand: carrera._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Blue', 'Purple']),
                eyewearDetails: {
                    frameShape: 'Square',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    glassColor: 'Gray',
                    frameWidth: 140,
                    lensWidth: 52,
                    bridgeWidth: 19,
                    templeLength: 142,
                    gender: 'Women',
                    faceShape: ['Round', 'Oval'],
                    features: ['Modern Design', 'UV400']
                }
            },
            {
                title: 'Butterfly Elegant Sunglasses',
                slug: 'butterfly-elegant-sunglasses',
                description: 'Elegant butterfly frame sunglasses',
                price: 2999,
                images: ['https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=500'],
                category: normalWomen._id,
                brand: vogue._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Tortoise', 'Clear']),
                eyewearDetails: {
                    frameShape: 'Butterfly',
                    frameMaterial: 'Acetate',
                    frameColor: 'Black',
                    glassColor: 'Brown',
                    frameWidth: 144,
                    lensWidth: 56,
                    bridgeWidth: 17,
                    templeLength: 140,
                    gender: 'Women',
                    faceShape: ['Round', 'Oval'],
                    features: ['Elegant', 'UV Protection']
                }
            },
            {
                title: 'Aviator Women Sunglasses',
                slug: 'aviator-women-sunglasses',
                description: 'Classic aviator style for women',
                price: 3299,
                images: ['https://images.unsplash.com/photo-1614715838608-dd527c46231d?w=500'],
                category: normalWomen._id,
                brand: rayban._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Gold', 'Silver', 'Rose Gold']),
                eyewearDetails: {
                    frameShape: 'Aviator',
                    frameMaterial: 'Metal',
                    frameColor: 'Gold',
                    glassColor: 'Green',
                    frameWidth: 138,
                    lensWidth: 55,
                    bridgeWidth: 14,
                    templeLength: 135,
                    gender: 'Women',
                    faceShape: ['Oval', 'Square', 'Heart'],
                    features: ['Classic Aviator', 'UV400']
                }
            },
            {
                title: 'Polarized Driving Sunglasses Women',
                slug: 'polarized-driving-sunglasses-women',
                description: 'Polarized sunglasses for comfortable driving',
                price: 3599,
                images: ['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500'],
                category: polarizedWomen._id,
                brand: carrera._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Brown', 'Gray']),
                eyewearDetails: {
                    frameShape: 'Rectangle',
                    frameMaterial: 'Metal',
                    frameColor: 'Black',
                    glassColor: 'Gray',
                    frameWidth: 140,
                    lensWidth: 54,
                    bridgeWidth: 17,
                    templeLength: 140,
                    gender: 'Women',
                    faceShape: ['Oval', 'Round', 'Square'],
                    features: ['Polarized', 'Anti-Glare', 'UV400']
                }
            },
            {
                title: 'Sport Active Sunglasses Women',
                slug: 'sport-active-sunglasses-women',
                description: 'Athletic sunglasses for active women',
                price: 3899,
                images: ['https://images.unsplash.com/photo-1606999420134-2e95d8b1e5e5?w=500'],
                category: sportsWomen._id,
                brand: oakley._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Pink', 'White']),
                eyewearDetails: {
                    frameShape: 'Sport',
                    frameMaterial: 'TR90',
                    frameColor: 'Black',
                    glassColor: 'Black',
                    frameWidth: 138,
                    lensWidth: 56,
                    bridgeWidth: 14,
                    templeLength: 130,
                    gender: 'Women',
                    faceShape: ['Oval', 'Square'],
                    features: ['Sport Design', 'Impact Resistant', 'UV400']
                }
            },
            // === SUNGLASSES - KIDS (4) ===
            {
                title: 'Kids Colorful Sunglasses',
                slug: 'kids-colorful-sunglasses',
                description: 'Fun and colorful sunglasses for kids',
                price: 999,
                images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'],
                category: normalKids._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Red', 'Blue', 'Pink', 'Green']),
                eyewearDetails: {
                    frameShape: 'Round',
                    frameMaterial: 'Plastic',
                    frameColor: 'Red',
                    glassColor: 'Gray',
                    frameWidth: 120,
                    lensWidth: 45,
                    bridgeWidth: 16,
                    templeLength: 120,
                    gender: 'Kids',
                    faceShape: ['Oval', 'Round'],
                    features: ['Durable', 'UV Protection', 'Colorful']
                }
            },
            {
                title: 'Kids Sport Sunglasses',
                slug: 'kids-sport-sunglasses',
                description: 'Durable sport sunglasses for active kids',
                price: 1299,
                images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'],
                category: sportsKids._id,
                brand: oakley._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Blue', 'Red']),
                eyewearDetails: {
                    frameShape: 'Sport',
                    frameMaterial: 'TR90',
                    frameColor: 'Black',
                    glassColor: 'Gray',
                    frameWidth: 125,
                    lensWidth: 48,
                    bridgeWidth: 15,
                    templeLength: 125,
                    gender: 'Kids',
                    faceShape: ['Oval', 'Round'],
                    features: ['Impact Resistant', 'UV Protection', 'Flexible']
                }
            },
            {
                title: 'Kids Aviator Sunglasses',
                slug: 'kids-aviator-sunglasses',
                description: 'Classic aviator style for kids',
                price: 1199,
                images: ['https://images.unsplash.com/photo-1577803645773-f96470509666?w=500'],
                category: normalKids._id,
                brand: rayban._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Gold', 'Silver']),
                eyewearDetails: {
                    frameShape: 'Aviator',
                    frameMaterial: 'Metal',
                    frameColor: 'Gold',
                    glassColor: 'Green',
                    frameWidth: 122,
                    lensWidth: 50,
                    bridgeWidth: 14,
                    templeLength: 120,
                    gender: 'Kids',
                    faceShape: ['Oval', 'Square'],
                    features: ['Classic Style', 'UV Protection']
                }
            },
            {
                title: 'Kids Wayfarer Sunglasses',
                slug: 'kids-wayfarer-sunglasses',
                description: 'Cool wayfarer sunglasses for kids',
                price: 1099,
                images: ['https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500'],
                category: normalKids._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Blue', 'Pink']),
                eyewearDetails: {
                    frameShape: 'Wayfarer',
                    frameMaterial: 'Plastic',
                    frameColor: 'Black',
                    glassColor: 'Gray',
                    frameWidth: 125,
                    lensWidth: 46,
                    bridgeWidth: 18,
                    templeLength: 125,
                    gender: 'Kids',
                    faceShape: ['Round', 'Oval'],
                    features: ['Durable', 'UV Protection', 'Lightweight']
                }
            },
            // === CONTACT LENSES (10) ===
            {
                title: 'Daily Disposable Clear Lenses - Premium',
                slug: 'daily-disposable-clear-premium',
                description: 'Premium daily disposable contact lenses for clear vision',
                price: 899,
                images: ['https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=500'],
                category: dailyClear._id,
                brand: vincente._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: [
                    { color: 'Clear', size: '-1.00', stock: 50, sku: 'DCL-P-100' },
                    { color: 'Clear', size: '-2.00', stock: 45, sku: 'DCL-P-200' },
                    { color: 'Clear', size: '-3.00', stock: 40, sku: 'DCL-P-300' },
                    { color: 'Clear', size: '-4.00', stock: 35, sku: 'DCL-P-400' }
                ],
            },
            {
                title: 'Daily Disposable Clear Lenses - Standard',
                slug: 'daily-disposable-clear-standard',
                description: 'Affordable daily disposable contact lenses',
                price: 699,
                images: ['https://images.unsplash.com/photo-1614715838608-dd527c46231d?w=500'],
                category: dailyClear._id,
                brand: vincente._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: [
                    { color: 'Clear', size: '-1.00', stock: 60, sku: 'DCL-S-100' },
                    { color: 'Clear', size: '-2.00', stock: 55, sku: 'DCL-S-200' },
                    { color: 'Clear', size: '-3.00', stock: 50, sku: 'DCL-S-300' }
                ],
            },
            {
                title: 'Daily Colored Lenses - Blue',
                slug: 'daily-colored-lenses-blue',
                description: 'Beautiful blue colored contact lenses',
                price: 1299,
                images: ['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500'],
                category: dailyColored._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: [
                    { color: 'Blue', size: '0.00', stock: 40, sku: 'DCB-000' },
                    { color: 'Blue', size: '-1.00', stock: 35, sku: 'DCB-100' },
                    { color: 'Blue', size: '-2.00', stock: 30, sku: 'DCB-200' }
                ],
            },
            {
                title: 'Daily Colored Lenses - Green',
                slug: 'daily-colored-lenses-green',
                description: 'Stunning green colored contact lenses',
                price: 1299,
                images: ['https://images.unsplash.com/photo-1606999420134-2e95d8b1e5e5?w=500'],
                category: dailyColored._id,
                brand: vincente._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: [
                    { color: 'Green', size: '0.00', stock: 40, sku: 'DCG-000' },
                    { color: 'Green', size: '-1.00', stock: 35, sku: 'DCG-100' }
                ],
            },
            {
                title: 'Monthly Disposable Clear Lenses - Premium',
                slug: 'monthly-disposable-clear-premium',
                description: 'Premium monthly disposable contact lenses',
                price: 1499,
                images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'],
                category: monthlyClear._id,
                brand: vincente._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: [
                    { color: 'Clear', size: '-1.00', stock: 45, sku: 'MCL-P-100' },
                    { color: 'Clear', size: '-2.00', stock: 40, sku: 'MCL-P-200' },
                    { color: 'Clear', size: '-3.00', stock: 35, sku: 'MCL-P-300' },
                    { color: 'Clear', size: '-4.00', stock: 30, sku: 'MCL-P-400' },
                    { color: 'Clear', size: '-5.00', stock: 25, sku: 'MCL-P-500' }
                ],
            },
            {
                title: 'Monthly Disposable Clear Lenses - Standard',
                slug: 'monthly-disposable-clear-standard',
                description: 'Affordable monthly disposable contact lenses',
                price: 1199,
                images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'],
                category: monthlyClear._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: [
                    { color: 'Clear', size: '-1.00', stock: 50, sku: 'MCL-S-100' },
                    { color: 'Clear', size: '-2.00', stock: 45, sku: 'MCL-S-200' },
                    { color: 'Clear', size: '-3.00', stock: 40, sku: 'MCL-S-300' }
                ],
            },
            {
                title: 'Monthly Colored Lenses - Gray',
                slug: 'monthly-colored-lenses-gray',
                description: 'Elegant gray colored monthly lenses',
                price: 1799,
                images: ['https://images.unsplash.com/photo-1577803645773-f96470509666?w=500'],
                category: monthlyColored._id,
                brand: vincente._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: [
                    { color: 'Gray', size: '0.00', stock: 35, sku: 'MCG-000' },
                    { color: 'Gray', size: '-1.00', stock: 30, sku: 'MCG-100' }
                ],
            },
            {
                title: 'Monthly Colored Lenses - Brown',
                slug: 'monthly-colored-lenses-brown',
                description: 'Natural brown colored monthly lenses',
                price: 1799,
                images: ['https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500'],
                category: monthlyColored._id,
                brand: vincente._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: [
                    { color: 'Brown', size: '0.00', stock: 35, sku: 'MCB-000' },
                    { color: 'Brown', size: '-1.00', stock: 30, sku: 'MCB-100' }
                ],
            },
            {
                title: 'Multipurpose Contact Lens Solution',
                slug: 'multipurpose-contact-lens-solution',
                description: 'All-in-one contact lens cleaning solution',
                price: 399,
                images: ['https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=500'],
                category: solutionsCare._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['360ml', '500ml']),
            },
            {
                title: 'Contact Lens Case Set',
                slug: 'contact-lens-case-set',
                description: 'Premium contact lens storage case',
                price: 199,
                images: ['https://images.unsplash.com/photo-1614715838608-dd527c46231d?w=500'],
                category: solutionsCare._id,
                brand: vincente._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Blue', 'Pink', 'Black', 'White']),
            },
            // === ACCESSORIES (10) ===
            {
                title: 'Premium Hard Eyewear Case',
                slug: 'premium-hard-eyewear-case',
                description: 'Durable hard case for eyewear protection',
                price: 499,
                images: ['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500'],
                category: hardCases._id,
                brand: vincente._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Brown', 'Blue', 'Red']),
            },
            {
                title: 'Soft Eyewear Pouch',
                slug: 'soft-eyewear-pouch',
                description: 'Soft microfiber pouch for glasses',
                price: 199,
                images: ['https://images.unsplash.com/photo-1606999420134-2e95d8b1e5e5?w=500'],
                category: softPouches._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Gray', 'Blue', 'Purple']),
            },
            {
                title: 'Designer Eyewear Case',
                slug: 'designer-eyewear-case',
                description: 'Stylish designer case for premium eyewear',
                price: 799,
                images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'],
                category: hardCases._id,
                brand: rayban._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Brown']),
            },
            {
                title: 'Eyewear Cleaning Spray Kit',
                slug: 'eyewear-cleaning-spray-kit',
                description: 'Professional cleaning spray with microfiber cloth',
                price: 299,
                images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'],
                category: sprayKits._id,
                brand: vincente._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['50ml', '100ml']),
            },
            {
                title: 'Disposable Cleaning Wipes Pack',
                slug: 'disposable-cleaning-wipes-pack',
                description: 'Pre-moistened lens cleaning wipes',
                price: 249,
                images: ['https://images.unsplash.com/photo-1577803645773-f96470509666?w=500'],
                category: microfiber._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['30 Pack', '60 Pack', '100 Pack']),
            },
            {
                title: 'Metal Chain Eyewear Holder',
                slug: 'metal-chain-eyewear-holder',
                description: 'Elegant metal chain for eyewear',
                price: 399,
                images: ['https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500'],
                category: metalChains._id,
                brand: vincente._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Gold', 'Silver', 'Rose Gold']),
            },
            {
                title: 'Beaded Chain Eyewear Strap',
                slug: 'beaded-chain-eyewear-strap',
                description: 'Stylish beaded chain for glasses',
                price: 299,
                images: ['https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=500'],
                category: beadedChains._id,
                brand: vincente._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Blue', 'Red', 'Multi']),
            },
            {
                title: 'Leather Eyewear Strap',
                slug: 'leather-eyewear-strap',
                description: 'Premium leather strap for eyewear',
                price: 499,
                images: ['https://images.unsplash.com/photo-1614715838608-dd527c46231d?w=500'],
                category: beadedChains._id,
                brand: vincente._id,
                vendorId: vendor2._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Black', 'Brown', 'Tan']),
            },
            {
                title: 'Eyewear Repair Kit',
                slug: 'eyewear-repair-kit',
                description: 'Complete repair kit with screws and tools',
                price: 349,
                images: ['https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500'],
                category: hardCases._id,
                brand: vincente._id,
                vendorId: adminVendor._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Standard']),
            },
            {
                title: 'Nose Pad Replacement Set',
                slug: 'nose-pad-replacement-set',
                description: 'Universal nose pad replacement kit',
                price: 199,
                images: ['https://images.unsplash.com/photo-1606999420134-2e95d8b1e5e5?w=500'],
                category: hardCases._id,
                brand: vincente._id,
                vendorId: vendor1._id,
                sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                unit: 'piece',
                variations: createVariants(['Clear', 'Black']),
            },
            // Men's Sunglasses - UV Protection
            {
                title: 'Ray-Ban Aviator Classic',
                slug: 'rayban-aviator-classic',
                description: 'The iconic Ray-Ban Aviator sunglasses with gold frame and green classic lenses',
                price: 8990,
                images: ['/placeholder-sunglasses.jpg'],
                category: uvProtectionMen._id,
                brand: rayban._id,
                vendorId: vendor1._id,
                stock: 50,
                sku: 'RB-AV-001',
                unit: 'piece',
                searchTags: ['aviator', 'classic', 'men', 'sunglasses', 'gold'],
                eyewearDetails: {
                    frameShape: 'Aviator',
                    frameMaterial: 'Metal',
                    lensType: 'UV Protection',
                    lensColor: 'Green',
                    lensMaterial: 'Glass',
                    frameWidth: 140,
                    lensWidth: 58,
                    bridgeWidth: 14,
                    templeLength: 135,
                    gender: 'Men',
                    faceShape: ['Oval', 'Square', 'Heart'],
                    uvProtection: 'UV400',
                    polarized: false,
                    features: ['UV Protection', 'Scratch Resistant']
                }
            },
            // Men's Sunglasses - Normal
            {
                title: 'Ray-Ban Wayfarer',
                slug: 'rayban-wayfarer',
                description: 'Classic black Wayfarer sunglasses with timeless design',
                price: 7990,
                images: ['/placeholder-sunglasses.jpg'],
                category: normalMen._id,
                brand: rayban._id,
                vendorId: vendor1._id,
                stock: 40,
                sku: 'RB-WF-001',
                unit: 'piece',
                searchTags: ['wayfarer', 'classic', 'men', 'sunglasses', 'black'],
                eyewearDetails: {
                    frameShape: 'Wayfarer',
                    frameMaterial: 'Acetate',
                    lensType: 'UV Protection',
                    lensColor: 'Dark Gray',
                    lensMaterial: 'Polycarbonate',
                    frameWidth: 145,
                    lensWidth: 50,
                    bridgeWidth: 22,
                    templeLength: 150,
                    gender: 'Men',
                    faceShape: ['Round', 'Oval', 'Diamond'],
                    uvProtection: 'UV400',
                    polarized: false,
                    features: ['UV Protection', 'Lightweight']
                }
            },
            // Men's Polarized Sports
            {
                title: 'Oakley Flak 2.0 XL Polarized',
                slug: 'oakley-flak-polarized',
                description: 'High-performance polarized sports sunglasses for athletes',
                price: 12990,
                images: ['/placeholder-sunglasses.jpg'],
                category: polarizedMen._id,
                brand: oakley._id,
                vendorId: vendor2._id,
                stock: 30,
                sku: 'OK-FL-001',
                unit: 'piece',
                searchTags: ['oakley', 'sports', 'polarized', 'men', 'performance'],
                eyewearDetails: {
                    frameShape: 'Sport',
                    frameMaterial: 'O Matter',
                    lensType: 'Polarized',
                    lensColor: 'Black Iridium',
                    lensMaterial: 'Plutonite',
                    frameWidth: 138,
                    lensWidth: 59,
                    bridgeWidth: 12,
                    templeLength: 133,
                    gender: 'Men',
                    faceShape: ['Oval', 'Square'],
                    uvProtection: 'UV400',
                    polarized: true,
                    features: ['Polarized', 'Impact Resistant', 'Anti-glare', 'Lightweight']
                }
            },
            // Women's Sunglasses - Fashion
            {
                title: 'Vogue Cat-Eye Sunglasses',
                slug: 'vogue-cat-eye',
                description: 'Elegant cat-eye sunglasses perfect for fashion-forward women',
                price: 5990,
                images: ['/placeholder-sunglasses.jpg'],
                category: fashionWomen._id,
                brand: vogue._id,
                vendorId: adminVendor._id,
                stock: 45,
                sku: 'VG-CE-001',
                unit: 'piece',
                searchTags: ['vogue', 'cat-eye', 'women', 'fashion', 'sunglasses'],
                eyewearDetails: {
                    frameShape: 'Cat-Eye',
                    frameMaterial: 'Acetate',
                    lensType: 'UV Protection',
                    lensColor: 'Brown Gradient',
                    lensMaterial: 'Polycarbonate',
                    frameWidth: 142,
                    lensWidth: 55,
                    bridgeWidth: 16,
                    templeLength: 140,
                    gender: 'Women',
                    faceShape: ['Round', 'Oval', 'Heart'],
                    uvProtection: 'UV400',
                    polarized: false,
                    features: ['UV Protection', 'Fashion Forward']
                }
            },
            // Women's Polarized
            {
                title: 'Carrera Oversized Sunglasses',
                slug: 'carrera-oversized',
                description: 'Bold oversized sunglasses with modern design',
                price: 8490,
                images: ['/placeholder-sunglasses.jpg'],
                category: polarizedWomen._id,
                brand: carrera._id,
                vendorId: adminVendor._id,
                stock: 35,
                sku: 'CR-OS-001',
                unit: 'piece',
                searchTags: ['carrera', 'oversized', 'women', 'bold', 'sunglasses'],
                eyewearDetails: {
                    frameShape: 'Oversized',
                    frameMaterial: 'Acetate',
                    lensType: 'UV Protection',
                    lensColor: 'Dark Brown',
                    lensMaterial: 'Polycarbonate',
                    frameWidth: 148,
                    lensWidth: 60,
                    bridgeWidth: 15,
                    templeLength: 145,
                    gender: 'Women',
                    faceShape: ['Oval', 'Square', 'Diamond'],
                    uvProtection: 'UV400',
                    polarized: false,
                    features: ['UV Protection', 'Oversized Design']
                }
            },
            // Men's Eyeglasses - Prescription
            {
                title: 'Vincent Chase Prescription Rectangle',
                slug: 'vincent-chase-prescription',
                description: 'Classic prescription eyeglasses with blue light protection',
                price: 2990,
                images: ['/placeholder-glasses.jpg'],
                category: prescriptionMen._id,
                brand: vincente._id,
                vendorId: adminVendor._id,
                stock: 60,
                sku: 'VC-PR-001',
                unit: 'piece',
                searchTags: ['vincent chase', 'prescription', 'men', 'eyeglasses', 'blue light'],
                eyewearDetails: {
                    frameShape: 'Rectangle',
                    frameMaterial: 'TR90',
                    lensType: 'Blue Light',
                    lensColor: 'Clear',
                    lensMaterial: 'Polycarbonate',
                    frameWidth: 138,
                    lensWidth: 52,
                    bridgeWidth: 18,
                    templeLength: 142,
                    prescriptionAvailable: true,
                    gender: 'Men',
                    faceShape: ['Oval', 'Round', 'Diamond'],
                    features: ['Blue Light Protection', 'Lightweight', 'Flexible']
                }
            },
            // Women's Eyeglasses - Prescription
            {
                title: 'Vogue Prescription Eyeglasses',
                slug: 'vogue-prescription-glasses',
                description: 'Stylish prescription eyeglasses for women',
                price: 4490,
                images: ['/placeholder-glasses.jpg'],
                category: prescriptionWomen._id,
                brand: vogue._id,
                vendorId: adminVendor._id,
                stock: 40,
                sku: 'VG-PR-EG-001',
                unit: 'piece',
                searchTags: ['vogue', 'prescription', 'women', 'eyeglasses'],
                eyewearDetails: {
                    frameShape: 'Rectangle',
                    frameMaterial: 'Acetate',
                    lensType: 'Prescription',
                    lensColor: 'Clear',
                    lensMaterial: 'CR-39',
                    frameWidth: 140,
                    lensWidth: 53,
                    bridgeWidth: 17,
                    templeLength: 140,
                    prescriptionAvailable: true,
                    gender: 'Women',
                    faceShape: ['Round', 'Oval', 'Heart'],
                    features: ['Prescription Ready', 'Fashion Forward']
                }
            }
        ];
        for (const productData of products) {
            await Product_1.Product.create(productData);
        }
        console.log('✓ Created sample products');
        console.log('\n✅ Seed completed successfully!');
        console.log('\nLogin Credentials:');
        console.log('Admin: admin@sunglasses.com / admin123');
        console.log('Vendor 1: rayban@vendor.com / vendor123');
        console.log('Vendor 2: oakley@vendor.com / vendor123');
        process.exit(0);
    }
    catch (error) {
        console.error('Seed error:', error);
        console.error('Error message:', error?.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
}
seed();
