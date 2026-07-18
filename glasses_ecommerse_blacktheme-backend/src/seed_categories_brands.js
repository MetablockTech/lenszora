const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Category schema
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    level: { type: String, enum: ['main', 'sub', 'subsub'], default: 'main' },
    description: { type: String }
}, { timestamps: true });

// Brand schema
const brandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, index: true },
    logo: { type: String },
    description: { type: String }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
const Brand = mongoose.model('Brand', brandSchema);

// Categories data
const categoriesData = [
    // Main Categories
    { name: 'Electronics', level: 'main', slug: 'electronics' },
    { name: 'Fashion', level: 'main', slug: 'fashion' },
    { name: 'Home & Kitchen', level: 'main', slug: 'home-kitchen' },
    { name: 'Beauty & Personal Care', level: 'main', slug: 'beauty-personal-care' },
    { name: 'Sports & Fitness', level: 'main', slug: 'sports-fitness' },
    { name: 'Books & Media', level: 'main', slug: 'books-media' },
    { name: 'Toys & Games', level: 'main', slug: 'toys-games' },
    { name: 'Automotive', level: 'main', slug: 'automotive' }
];

// Subcategories (will be added after main categories)
const subCategoriesData = {
    'Electronics': ['Mobiles', 'Laptops', 'Tablets', 'Cameras', 'Audio', 'Wearables'],
    'Fashion': ['Men', 'Women', 'Kids', 'Footwear', 'Accessories'],
    'Home & Kitchen': ['Furniture', 'Kitchen Appliances', 'Home Decor', 'Bedding'],
    'Beauty & Personal Care': ['Skincare', 'Makeup', 'Haircare', 'Fragrances'],
    'Sports & Fitness': ['Gym Equipment', 'Sports Wear', 'Outdoor', 'Yoga']
};

// Sub-subcategories
const subSubCategoriesData = {
    'Mobiles': ['Smartphones', 'Feature Phones', 'Accessories'],
    'Laptops': ['Gaming Laptops', 'Business Laptops', 'Ultrabooks'],
    'Men': ['T-Shirts', 'Shirts', 'Jeans', 'Jackets'],
    'Women': ['Dresses', 'Tops', 'Jeans', 'Ethnic Wear'],
    'Footwear': ['Casual Shoes', 'Formal Shoes', 'Sports Shoes', 'Sandals']
};

// Brands data
const brandsData = [
    { name: 'Apple', slug: 'apple', logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200' },
    { name: 'Samsung', slug: 'samsung', logo: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200' },
    { name: 'Nike', slug: 'nike', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200' },
    { name: 'Adidas', slug: 'adidas', logo: 'https://images.unsplash.com/photo-1556906781-9cba4a6f5a4f?w=200' },
    { name: 'Sony', slug: 'sony', logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200' },
    { name: 'Dell', slug: 'dell', logo: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=200' },
    { name: 'HP', slug: 'hp', logo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200' },
    { name: 'Lenovo', slug: 'lenovo', logo: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=200' },
    { name: 'Puma', slug: 'puma', logo: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200' },
    { name: 'Zara', slug: 'zara', logo: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200' },
    { name: 'H&M', slug: 'hm', logo: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200' },
    { name: 'IKEA', slug: 'ikea', logo: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200' },
    { name: 'Philips', slug: 'philips', logo: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=200' },
    { name: "Levi's", slug: 'levis', logo: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200' },
    { name: 'Canon', slug: 'canon', logo: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=200' }
];

async function seedCategoriesAndBrands() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected\n');

        // Clear existing
        console.log('🗑️  Clearing existing categories and brands...');
        await Category.deleteMany({});
        await Brand.deleteMany({});
        console.log('✅ Cleared\n');

        // Create main categories
        console.log('📁 Creating main categories...');
        const mainCats = [];
        for (const cat of categoriesData) {
            const category = await Category.create(cat);
            mainCats.push(category);
            console.log(`  ✅ ${category.name}`);
        }

        // Create subcategories
        console.log('\n📂 Creating subcategories...');
        const subCats = [];
        for (const [mainName, subs] of Object.entries(subCategoriesData)) {
            const mainCat = mainCats.find(c => c.name === mainName);
            if (mainCat) {
                for (const subName of subs) {
                    const subCat = await Category.create({
                        name: subName,
                        slug: subName.toLowerCase().replace(/\s+/g, '-'),
                        parentId: mainCat._id,
                        level: 'sub'
                    });
                    subCats.push(subCat);
                    console.log(`  ✅ ${mainName} → ${subName}`);
                }
            }
        }

        // Create sub-subcategories
        console.log('\n📑 Creating sub-subcategories...');
        for (const [subName, subSubs] of Object.entries(subSubCategoriesData)) {
            const subCat = subCats.find(c => c.name === subName);
            if (subCat) {
                for (const subSubName of subSubs) {
                    await Category.create({
                        name: subSubName,
                        slug: subSubName.toLowerCase().replace(/\s+/g, '-'),
                        parentId: subCat._id,
                        level: 'subsub'
                    });
                    console.log(`  ✅ ${subName} → ${subSubName}`);
                }
            }
        }

        // Create brands
        console.log('\n🏷️  Creating brands...');
        for (const brand of brandsData) {
            await Brand.create(brand);
            console.log(`  ✅ ${brand.name}`);
        }

        const totalCategories = await Category.countDocuments();
        const totalBrands = await Brand.countDocuments();

        console.log(`\n🎉 Successfully created:`);
        console.log(`   📁 ${totalCategories} categories`);
        console.log(`   🏷️  ${totalBrands} brands`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedCategoriesAndBrands();
