const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const productVariantSchema = new mongoose.Schema({
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    images: [String],
    variantValues: { type: Map, of: String },
    isDefault: { type: Boolean, default: false }
});

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    productType: { type: String, enum: ['physical', 'digital'], default: 'physical' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: String,
    sku: { type: String, required: true, unique: true },
    unit: { type: String, default: 'pc' },
    searchTags: [String],
    price: { type: Number, required: true },
    minOrderQuantity: { type: Number, default: 1 },
    stock: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['flat', 'percent'], default: 'flat' },
    shippingCost: { type: Number, default: 0 },
    shippingCostMultiply: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    colors: [String],
    attributes: [{
        name: String,
        values: [String]
    }],
    variants: [productVariantSchema],
    hasVariants: { type: Boolean, default: false },
    thumbnail: { type: String, required: true },
    images: [String]
}, { timestamps: true });

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

const Product = mongoose.model('Product', productSchema);
const Category = mongoose.model('Category', categorySchema);
const Brand = mongoose.model('Brand', brandSchema);

// Variant-specific images for different colors
const variantImages = {
    // T-Shirts
    "Black": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500",
    "White": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    "Navy": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500",
    "Red": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500",
    "Gray": "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=500",

    // Phones
    "Natural Titanium": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500",
    "Blue Titanium": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500",
    "White Titanium": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500",
    "Black Titanium": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500",
    "Titanium Gray": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500",
    "Titanium Black": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500",

    // Shoes
    "Blue": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",

    // Laptops
    "Space Gray": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
    "Silver": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500"
};

const productsData = [
    // Electronics - Smartphones (Apple, Samsung)
    {
        title: "iPhone 15 Pro",
        description: "Latest iPhone with A17 Pro chip and titanium design",
        category: "Smartphones",
        brand: "Apple",
        sku: "IPHONE-15-PRO",
        price: 129900,
        colors: ["Natural Titanium", "Blue Titanium", "Black Titanium"],
        attributes: [{ name: "Storage", values: ["128GB", "256GB", "512GB"] }],
        searchTags: ["smartphone", "iphone", "apple", "5g"],
        thumbnail: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500"
    },
    {
        title: "Samsung Galaxy S24 Ultra",
        description: "Flagship Samsung phone with S Pen",
        category: "Smartphones",
        brand: "Samsung",
        sku: "GALAXY-S24",
        price: 124999,
        colors: ["Titanium Gray", "Titanium Black"],
        attributes: [{ name: "Storage", values: ["256GB", "512GB"] }],
        searchTags: ["smartphone", "samsung", "android"],
        thumbnail: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500"
    },
    {
        title: "iPhone 14",
        description: "A total powerhouse.",
        category: "Smartphones",
        brand: "Apple",
        sku: "IPHONE-14",
        price: 69900,
        colors: ["Blue", "Purple", "Midnight"],
        attributes: [{ name: "Storage", values: ["128GB", "256GB"] }],
        searchTags: ["smartphone", "iphone", "apple"],
        thumbnail: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=500"
    },

    // Electronics - Laptops (Apple, Dell, HP, Lenovo)
    {
        title: "MacBook Pro 14",
        description: "Apple MacBook Pro with M3 chip",
        category: "Laptops",
        brand: "Apple",
        sku: "MACBOOK-14",
        price: 199900,
        colors: ["Space Gray", "Silver"],
        attributes: [{ name: "RAM", values: ["16GB", "32GB"] }],
        searchTags: ["laptop", "macbook", "apple"],
        thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500"
    },
    {
        title: "Dell XPS 15",
        description: "High performance laptop for creators",
        category: "Laptops",
        brand: "Dell",
        sku: "DELL-XPS-15",
        price: 185000,
        colors: ["Silver"],
        attributes: [{ name: "RAM", values: ["16GB", "32GB"] }, { name: "Storage", values: ["512GB", "1TB"] }],
        searchTags: ["laptop", "dell", "windows"],
        thumbnail: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500"
    },
    {
        title: "HP Spectre x360",
        description: "Convertible laptop with stunning design",
        category: "Laptops",
        brand: "HP",
        sku: "HP-SPECTRE",
        price: 145000,
        colors: ["Nightfall Black", "Poseidon Blue"],
        attributes: [{ name: "Processor", values: ["i7", "i9"] }],
        searchTags: ["laptop", "hp", "convertible"],
        thumbnail: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500"
    },
    {
        title: "Lenovo ThinkPad X1",
        description: "Business laptop with legendary durability",
        category: "Laptops",
        brand: "Lenovo",
        sku: "THINKPAD-X1",
        price: 160000,
        colors: ["Black"],
        attributes: [{ name: "Screen", values: ["FHD", "4K"] }],
        searchTags: ["laptop", "lenovo", "business"],
        thumbnail: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500"
    },

    // Electronics - Audio/Cameras (Sony, Canon)
    {
        title: "Sony WH-1000XM5",
        description: "Wireless Noise Cancelling Headphones",
        category: "Audio",
        brand: "Sony",
        sku: "SONY-XM5",
        price: 29990,
        colors: ["Black", "Silver"],
        attributes: [{ name: "Type", values: ["Over-Ear"] }],
        searchTags: ["headphones", "sony", "audio"],
        thumbnail: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500"
    },
    {
        title: "Canon EOS R5",
        description: "Full-frame mirrorless camera",
        category: "Cameras",
        brand: "Canon",
        sku: "CANON-R5",
        price: 339995,
        colors: ["Black"],
        attributes: [{ name: "Kit", values: ["Body Only", "With Lens"] }],
        searchTags: ["camera", "canon", "mirrorless"],
        thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500"
    },

    // Fashion - Men (Nike, Adidas, Puma, Zara, Levi's)
    {
        title: "Premium Cotton T-Shirt",
        description: "100% organic cotton t-shirt",
        category: "T-Shirts",
        brand: "Nike",
        sku: "TSHIRT-001",
        price: 1299,
        colors: ["Black", "White", "Navy", "Red"],
        attributes: [{ name: "Size", values: ["S", "M", "L", "XL"] }],
        searchTags: ["tshirt", "cotton", "casual"],
        thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"
    },
    {
        title: "Slim Fit Jeans",
        description: "Classic denim jeans",
        category: "Jeans",
        brand: "Levi's",
        sku: "LEVIS-511",
        price: 3599,
        colors: ["Blue", "Black"],
        attributes: [{ name: "Size", values: ["30", "32", "34", "36"] }],
        searchTags: ["jeans", "denim", "levis"],
        thumbnail: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"
    },
    {
        title: "Sporty Jacket",
        description: "Lightweight running jacket",
        category: "Jackets",
        brand: "Puma",
        sku: "PUMA-JACKET",
        price: 4999,
        colors: ["Black", "Red"],
        attributes: [{ name: "Size", values: ["M", "L", "XL"] }],
        searchTags: ["jacket", "sports", "puma"],
        thumbnail: "https://images.unsplash.com/photo-1551488852-0801751ac1f9?w=500"
    },
    {
        title: "Formal Shirt",
        description: "Crisp white formal shirt",
        category: "Shirts",
        brand: "Zara",
        sku: "ZARA-SHIRT",
        price: 2290,
        colors: ["White", "Blue"],
        attributes: [{ name: "Size", values: ["38", "40", "42", "44"] }],
        searchTags: ["shirt", "formal", "zara"],
        thumbnail: "https://images.unsplash.com/photo-1620799140408-ed5341cd2431?w=500"
    },

    // Fashion - Women (H&M, Zara)
    {
        title: "Summer Floral Dress",
        description: "Light and breezy dress for summer",
        category: "Dresses",
        brand: "H&M",
        sku: "HM-DRESS-01",
        price: 1999,
        colors: ["Red", "Yellow"],
        attributes: [{ name: "Size", values: ["XS", "S", "M", "L"] }],
        searchTags: ["dress", "summer", "h&m"],
        thumbnail: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500"
    },
    {
        title: "Ethnic Kurta",
        description: "Traditional embroidered kurta",
        category: "Ethnic Wear",
        brand: "FabIndia", // Note: FabIndia wasn't in seed_categories_brands, might default to no brand or need handling
        sku: "ETHNIC-KURTA",
        price: 1599,
        colors: ["Pink", "Green"],
        attributes: [{ name: "Size", values: ["S", "M", "L"] }],
        searchTags: ["ethnic", "kurta", "women"],
        thumbnail: "https://images.unsplash.com/photo-1583391733958-d02442d77157?w=500"
    },

    // Fashion - Footwear (Nike, Adidas, Puma)
    {
        title: "Running Shoes Pro",
        description: "Professional running shoes",
        category: "Sports Shoes",
        brand: "Nike",
        sku: "SHOES-RUN",
        price: 4999,
        colors: ["Black", "White", "Blue"],
        attributes: [{ name: "Size", values: ["7", "8", "9", "10"] }],
        searchTags: ["shoes", "running", "sports"],
        thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"
    },
    {
        title: "Ultraboost",
        description: "Energy return running shoes",
        category: "Sports Shoes",
        brand: "Adidas",
        sku: "ADIDAS-UB",
        price: 17999,
        colors: ["White", "Black"],
        attributes: [{ name: "Size", values: ["7", "8", "9", "10", "11"] }],
        searchTags: ["shoes", "running", "adidas"],
        thumbnail: "https://images.unsplash.com/photo-1587563871167-1ee9c731aef4?w=500"
    },
    {
        title: "Classic Sneakers",
        description: "Everyday casual sneakers",
        category: "Casual Shoes",
        brand: "Puma",
        sku: "PUMA-SNEAKER",
        price: 3999,
        colors: ["White", "Green"],
        attributes: [{ name: "Size", values: ["7", "8", "9", "10"] }],
        searchTags: ["sneakers", "casual", "puma"],
        thumbnail: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500"
    },

    // Home & Kitchen (IKEA, Philips)
    {
        title: "Modern Sofa",
        description: "3-seater comfortable sofa",
        category: "Furniture",
        brand: "IKEA",
        sku: "IKEA-SOFA",
        price: 25000,
        colors: ["Gray", "Blue"],
        attributes: [{ name: "Material", values: ["Fabric", "Velvet"] }],
        searchTags: ["sofa", "furniture", "ikea"],
        thumbnail: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500"
    },
    {
        title: "Air Fryer",
        description: "Healthy frying with little to no oil",
        category: "Kitchen Appliances",
        brand: "Philips",
        sku: "PHILIPS-AF",
        price: 8999,
        colors: ["Black"],
        attributes: [{ name: "Capacity", values: ["4L", "6L"] }],
        searchTags: ["air fryer", "kitchen", "philips"],
        thumbnail: "https://images.unsplash.com/photo-1626146663363-4f9e8e663406?w=500"
    },
    {
        title: "Smart LED Bulb",
        description: "Wi-Fi enabled smart bulb",
        category: "Home Decor",
        brand: "Philips",
        sku: "PHILIPS-HUE",
        price: 1999,
        colors: ["White"],
        attributes: [{ name: "Pack", values: ["1", "2"] }],
        searchTags: ["light", "smart", "philips"],
        thumbnail: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500"
    },
    {
        title: "Study Desk",
        description: "Minimalist wooden study desk",
        category: "Furniture",
        brand: "IKEA",
        sku: "IKEA-DESK",
        price: 6999,
        colors: ["White", "Brown"],
        attributes: [{ name: "Size", values: ["Small", "Large"] }],
        searchTags: ["desk", "study", "ikea"],
        thumbnail: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500"
    }
];

async function seedProducts() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected\n');

        console.log('🗑️  Deleting ALL existing products...');
        const deleteResult = await Product.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.deletedCount} products\n`);

        const categories = await Category.find({});
        const categoryMap = new Map();
        categories.forEach(cat => categoryMap.set(cat.name, cat._id));
        console.log(`📁 Found ${categories.length} categories\n`);

        const brands = await Brand.find({});
        const brandMap = new Map();
        brands.forEach(brand => brandMap.set(brand.name, brand._id));
        console.log(`🏷️  Found ${brands.length} brands\n`);

        let created = 0;

        for (const data of productsData) {
            const categoryId = categoryMap.get(data.category);
            if (!categoryId) {
                console.log(`⚠️  Skipping ${data.title} - category not found`);
                continue;
            }

            const brandId = brandMap.get(data.brand);
            // If brand not found, we can either skip or create without brand. 
            // Given the error was casting string to ObjectId, we must provide an ObjectId or null/undefined if optional.
            // The schema says brand: Types.ObjectId (ref), so it expects an ID.

            if (!brandId) {
                console.log(`⚠️  Brand not found for ${data.title}: ${data.brand}`);
                // You might want to skip or handle this. For now, let's proceed but log it.
            }

            const variants = [];
            let variantIndex = 1;

            for (const color of data.colors) {
                for (const attr of data.attributes) {
                    for (const value of attr.values) {
                        // Get variant-specific image based on color
                        const variantImage = variantImages[color] || data.thumbnail;

                        variants.push({
                            sku: `${data.sku}-${variantIndex}`,
                            price: data.price,
                            stock: Math.floor(Math.random() * 50) + 10,
                            images: [variantImage], // Unique image for each variant
                            variantValues: new Map([
                                ['Color', color],
                                [attr.name, value]
                            ]),
                            isDefault: variantIndex === 1
                        });
                        variantIndex++;
                    }
                }
            }

            const product = new Product({
                title: data.title,
                description: data.description,
                category: categoryId,
                brand: brandId, // Use the ID, not the string name
                sku: data.sku,
                unit: 'pc',
                searchTags: data.searchTags,
                price: data.price,
                minOrderQuantity: 1,
                stock: variants.reduce((sum, v) => sum + v.stock, 0),
                discountAmount: 0,
                discountType: 'flat',
                shippingCost: 0,
                shippingCostMultiply: false,
                status: 'active',
                productType: 'physical',
                colors: data.colors,
                attributes: data.attributes,
                hasVariants: true,
                variants: variants,
                thumbnail: data.thumbnail,
                images: [data.thumbnail]
            });

            await product.save();
            created++;
            console.log(`✅ ${data.title} - ${variants.length} variants (each with unique image)`);
        }

        console.log(`\n🎉 Successfully created ${created} products with variant-specific images!`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedProducts();
