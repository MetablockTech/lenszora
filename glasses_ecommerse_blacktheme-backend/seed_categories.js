"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Category_1 = require("./src/models/Category");
const Brand_1 = require("./src/models/Brand");
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sunglasses';
async function seedCategories() {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        // Clear existing categories and brands
        await Category_1.Category.deleteMany({});
        await Brand_1.Brand.deleteMany({});
        console.log('Cleared existing categories and brands');
        // ==================== MAIN CATEGORIES ====================
        // 1. EYEGLASSES
        const eyeglasses = await Category_1.Category.create({
            name: 'Eyeglasses',
            slug: 'eyeglasses',
            level: 'main',
            description: 'Prescription and non-prescription eyeglasses'
        });
        // 2. SUNGLASSES
        const sunglasses = await Category_1.Category.create({
            name: 'Sunglasses',
            slug: 'sunglasses',
            level: 'main',
            description: 'UV protection sunglasses for all occasions'
        });
        // 3. CONTACT LENSES
        const contactLenses = await Category_1.Category.create({
            name: 'Contact Lenses',
            slug: 'contact-lenses',
            level: 'main',
            description: 'Daily and monthly disposable contact lenses'
        });
        console.log('Created main categories');
        // ==================== EYEGLASSES SUBCATEGORIES ====================
        const eyeglassesMen = await Category_1.Category.create({
            name: 'Men',
            slug: 'men-eyeglasses',
            level: 'sub',
            parentId: eyeglasses._id
        });
        const eyeglassesWomen = await Category_1.Category.create({
            name: 'Women',
            slug: 'women-eyeglasses',
            level: 'sub',
            parentId: eyeglasses._id
        });
        const eyeglassesKids = await Category_1.Category.create({
            name: 'Kids',
            slug: 'kids-eyeglasses',
            level: 'sub',
            parentId: eyeglasses._id
        });
        console.log('Created eyeglasses subcategories (Men, Women, Kids)');
        // ==================== EYEGLASSES SUB-SUBCATEGORIES ====================
        // For Men Eyeglasses
        await Category_1.Category.create([
            {
                name: 'Prescription Glasses',
                slug: 'prescription-glasses',
                level: 'subsub',
                parentId: eyeglassesMen._id,
                description: 'Prescription eyeglasses for vision correction'
            },
            {
                name: 'Zero Power (Fashion)',
                slug: 'zero-power-fashion',
                level: 'subsub',
                parentId: eyeglassesMen._id,
                description: 'Fashion eyeglasses without prescription'
            },
            {
                name: 'Computer / Blue-Light',
                slug: 'computer-blue-light',
                level: 'subsub',
                parentId: eyeglassesMen._id,
                description: 'Blue light blocking glasses for screen time'
            },
            {
                name: 'Reading Glasses',
                slug: 'reading-glasses',
                level: 'subsub',
                parentId: eyeglassesMen._id,
                description: 'Reading glasses for near vision'
            }
        ]);
        // For Women Eyeglasses
        await Category_1.Category.create([
            {
                name: 'Prescription Glasses',
                slug: 'prescription-glasses-women',
                level: 'subsub',
                parentId: eyeglassesWomen._id,
                description: 'Prescription eyeglasses for vision correction'
            },
            {
                name: 'Zero Power (Fashion)',
                slug: 'zero-power-fashion-women',
                level: 'subsub',
                parentId: eyeglassesWomen._id,
                description: 'Fashion eyeglasses without prescription'
            },
            {
                name: 'Computer / Blue-Light',
                slug: 'computer-blue-light-women',
                level: 'subsub',
                parentId: eyeglassesWomen._id,
                description: 'Blue light blocking glasses for screen time'
            },
            {
                name: 'Reading Glasses',
                slug: 'reading-glasses-women',
                level: 'subsub',
                parentId: eyeglassesWomen._id,
                description: 'Reading glasses for near vision'
            }
        ]);
        // For Kids Eyeglasses
        await Category_1.Category.create([
            {
                name: 'Prescription Glasses',
                slug: 'prescription-glasses-kids',
                level: 'subsub',
                parentId: eyeglassesKids._id,
                description: 'Prescription eyeglasses for kids'
            },
            {
                name: 'Zero Power (Fashion)',
                slug: 'zero-power-fashion-kids',
                level: 'subsub',
                parentId: eyeglassesKids._id,
                description: 'Fashion eyeglasses for kids'
            },
            {
                name: 'Computer / Blue-Light',
                slug: 'computer-blue-light-kids',
                level: 'subsub',
                parentId: eyeglassesKids._id,
                description: 'Blue light blocking glasses for kids'
            }
        ]);
        console.log('Created eyeglasses sub-subcategories');
        // ==================== SUNGLASSES SUBCATEGORIES ====================
        const sunglassesMen = await Category_1.Category.create({
            name: 'Men',
            slug: 'men-sunglasses',
            level: 'sub',
            parentId: sunglasses._id
        });
        const sunglassesWomen = await Category_1.Category.create({
            name: 'Women',
            slug: 'women-sunglasses',
            level: 'sub',
            parentId: sunglasses._id
        });
        const sunglassesKids = await Category_1.Category.create({
            name: 'Kids',
            slug: 'kids-sunglasses',
            level: 'sub',
            parentId: sunglasses._id
        });
        console.log('Created sunglasses subcategories (Men, Women, Kids)');
        // ==================== SUNGLASSES SUB-SUBCATEGORIES ====================
        // For Men Sunglasses
        await Category_1.Category.create([
            {
                name: 'Polarized Sunglasses',
                slug: 'polarized-sunglasses-men',
                level: 'subsub',
                parentId: sunglassesMen._id,
                description: 'Polarized lenses for reduced glare'
            },
            {
                name: 'UV Protection',
                slug: 'uv-protection-men',
                level: 'subsub',
                parentId: sunglassesMen._id,
                description: '100% UV protection sunglasses'
            },
            {
                name: 'Sports Sunglasses',
                slug: 'sports-sunglasses-men',
                level: 'subsub',
                parentId: sunglassesMen._id,
                description: 'Sunglasses for sports and outdoor activities'
            },
            {
                name: 'Driving Sunglasses',
                slug: 'driving-sunglasses-men',
                level: 'subsub',
                parentId: sunglassesMen._id,
                description: 'Sunglasses optimized for driving'
            }
        ]);
        // For Women Sunglasses
        await Category_1.Category.create([
            {
                name: 'Polarized Sunglasses',
                slug: 'polarized-sunglasses-women',
                level: 'subsub',
                parentId: sunglassesWomen._id,
                description: 'Polarized lenses for reduced glare'
            },
            {
                name: 'UV Protection',
                slug: 'uv-protection-women',
                level: 'subsub',
                parentId: sunglassesWomen._id,
                description: '100% UV protection sunglasses'
            },
            {
                name: 'Oversized Sunglasses',
                slug: 'oversized-sunglasses-women',
                level: 'subsub',
                parentId: sunglassesWomen._id,
                description: 'Fashion oversized sunglasses'
            },
            {
                name: 'Cat-Eye Sunglasses',
                slug: 'cat-eye-sunglasses-women',
                level: 'subsub',
                parentId: sunglassesWomen._id,
                description: 'Stylish cat-eye frame sunglasses'
            }
        ]);
        // For Kids Sunglasses
        await Category_1.Category.create([
            {
                name: 'UV Protection',
                slug: 'uv-protection-kids',
                level: 'subsub',
                parentId: sunglassesKids._id,
                description: '100% UV protection for kids'
            },
            {
                name: 'Sports Sunglasses',
                slug: 'sports-sunglasses-kids',
                level: 'subsub',
                parentId: sunglassesKids._id,
                description: 'Durable sunglasses for active kids'
            }
        ]);
        console.log('Created sunglasses sub-subcategories');
        // ==================== CONTACT LENSES SUBCATEGORIES ====================
        const dailyDisposable = await Category_1.Category.create({
            name: 'Daily Disposable',
            slug: 'daily-disposable',
            level: 'sub',
            parentId: contactLenses._id
        });
        const monthlyDisposable = await Category_1.Category.create({
            name: 'Monthly Disposable',
            slug: 'monthly-disposable',
            level: 'sub',
            parentId: contactLenses._id
        });
        const solutionsCare = await Category_1.Category.create({
            name: 'Solutions & Care',
            slug: 'solutions-care',
            level: 'sub',
            parentId: contactLenses._id
        });
        console.log('Created contact lenses subcategories');
        // ==================== CONTACT LENSES SUB-SUBCATEGORIES ====================
        // For Daily Disposable
        await Category_1.Category.create([
            {
                name: 'Clear Lenses',
                slug: 'daily-clear-lenses',
                level: 'subsub',
                parentId: dailyDisposable._id,
                description: 'Daily disposable clear contact lenses'
            },
            {
                name: 'Colored Lenses',
                slug: 'daily-colored-lenses',
                level: 'subsub',
                parentId: dailyDisposable._id,
                description: 'Daily disposable colored contact lenses'
            }
        ]);
        // For Monthly Disposable
        await Category_1.Category.create([
            {
                name: 'Clear Lenses',
                slug: 'monthly-clear-lenses',
                level: 'subsub',
                parentId: monthlyDisposable._id,
                description: 'Monthly disposable clear contact lenses'
            },
            {
                name: 'Colored Lenses',
                slug: 'monthly-colored-lenses',
                level: 'subsub',
                parentId: monthlyDisposable._id,
                description: 'Monthly disposable colored contact lenses'
            },
            {
                name: 'Toric (Astigmatism)',
                slug: 'monthly-toric-lenses',
                level: 'subsub',
                parentId: monthlyDisposable._id,
                description: 'Toric lenses for astigmatism correction'
            }
        ]);
        // For Solutions & Care
        await Category_1.Category.create([
            {
                name: 'Lens Solutions',
                slug: 'lens-solutions',
                level: 'subsub',
                parentId: solutionsCare._id,
                description: 'Contact lens cleaning solutions'
            },
            {
                name: 'Eye Drops',
                slug: 'eye-drops',
                level: 'subsub',
                parentId: solutionsCare._id,
                description: 'Lubricating eye drops'
            },
            {
                name: 'Lens Cases',
                slug: 'lens-cases',
                level: 'subsub',
                parentId: solutionsCare._id,
                description: 'Contact lens storage cases'
            }
        ]);
        console.log('Created contact lenses sub-subcategories');
        // ==================== BRANDS ====================
        await Brand_1.Brand.create([
            { name: 'Ray-Ban', slug: 'rayban' },
            { name: 'Oakley', slug: 'oakley' },
            { name: 'Vincent Chase', slug: 'vincent-chase' },
            { name: 'Lenskart Air', slug: 'lenskart-air' },
            { name: 'John Jacobs', slug: 'john-jacobs' },
            { name: 'Vogue', slug: 'vogue' },
            { name: 'Carrera', slug: 'carrera' },
            { name: 'Bausch & Lomb', slug: 'bausch-lomb' },
            { name: 'Acuvue', slug: 'acuvue' },
            { name: 'Freshlook', slug: 'freshlook' },
            { name: 'OJOS', slug: 'ojos' },
            { name: 'Lenskart STUDIO', slug: 'lenskart-studio' }
        ]);
        console.log('Created brands');
        // Display summary
        const totalCategories = await Category_1.Category.countDocuments();
        const mainCats = await Category_1.Category.countDocuments({ level: 'main' });
        const subCats = await Category_1.Category.countDocuments({ level: 'sub' });
        const subSubCats = await Category_1.Category.countDocuments({ level: 'subsub' });
        const totalBrands = await Brand_1.Brand.countDocuments();
        console.log('\n✅ Seeding completed successfully!');
        console.log('================================');
        console.log(`Total Categories: ${totalCategories}`);
        console.log(`  - Main: ${mainCats}`);
        console.log(`  - Sub: ${subCats}`);
        console.log(`  - Sub-Sub: ${subSubCats}`);
        console.log(`Total Brands: ${totalBrands}`);
        console.log('================================\n');
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
    catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
}
seedCategories();
