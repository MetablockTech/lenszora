import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Product schema (matching your existing schema)
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

const Product = mongoose.model('Product', productSchema);
const Category = mongoose.model('Category');

// Sample product data with variants
const productsData = [
    // Electronics - Smartphones
    {
        title: "iPhone 15 Pro",
        description: "Latest iPhone with A17 Pro chip and titanium design",
        category: "Electronics",
        brand: "Apple",
        sku: "IPHONE-15-PRO",
        price: 129900,
        stock: 0,
        colors: ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"],
        attributes: [{ name: "Storage", values: ["128GB", "256GB", "512GB", "1TB"] }],
        searchTags: ["smartphone", "iphone", "apple", "5g"],
        thumbnail: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500",
        images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800"]
    },
    {
        title: "Samsung Galaxy S24 Ultra",
        description: "Flagship Samsung phone with S Pen and AI features",
        category: "Electronics",
        brand: "Samsung",
        sku: "GALAXY-S24-ULTRA",
        price: 124999,
        stock: 0,
        colors: ["Titanium Gray", "Titanium Black", "Titanium Violet"],
        attributes: [{ name: "Storage", values: ["256GB", "512GB", "1TB"] }],
        searchTags: ["smartphone", "samsung", "galaxy", "android"],
        thumbnail: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500",
        images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800"]
    },

    // Fashion - T-Shirts
    {
        title: "Premium Cotton T-Shirt",
        description: "100% organic cotton comfortable t-shirt",
        category: "Fashion",
        brand: "Nike",
        sku: "TSHIRT-COTTON-001",
        price: 1299,
        stock: 0,
        colors: ["Black", "White", "Navy Blue", "Red", "Gray"],
        attributes: [{ name: "Size", values: ["S", "M", "L", "XL", "XXL"] }],
        searchTags: ["tshirt", "cotton", "casual", "mens"],
        thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"]
    },
    {
        title: "Polo Collar T-Shirt",
        description: "Classic polo t-shirt for smart casual look",
        category: "Fashion",
        brand: "Adidas",
        sku: "POLO-TSHIRT-001",
        price: 1799,
        stock: 0,
        colors: ["Black", "White", "Navy", "Maroon"],
        attributes: [{ name: "Size", values: ["M", "L", "XL", "XXL"] }],
        searchTags: ["polo", "tshirt", "casual", "collar"],
        thumbnail: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500",
        images: ["https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800"]
    },

    // Fashion - Shoes
    {
        title: "Running Shoes Pro",
        description: "Professional running shoes with advanced cushioning",
        category: "Fashion",
        brand: "Nike",
        sku: "SHOES-RUN-PRO",
        price: 4999,
        stock: 0,
        colors: ["Black", "White", "Blue", "Red"],
        attributes: [{ name: "Size", values: ["7", "8", "9", "10", "11"] }],
        searchTags: ["shoes", "running", "sports", "nike"],
        thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]
    },
    {
        title: "Casual Sneakers",
        description: "Comfortable sneakers for everyday wear",
        category: "Fashion",
        brand: "Adidas",
        sku: "SNEAKERS-CASUAL",
        price: 3499,
        stock: 0,
        colors: ["White", "Black", "Gray"],
        attributes: [{ name: "Size", values: ["7", "8", "9", "10", "11"] }],
        searchTags: ["sneakers", "casual", "shoes", "adidas"],
        thumbnail: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
        images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800"]
    },

    // Home & Kitchen - Furniture
    {
        title: "Ergonomic Office Chair",
        description: "Comfortable office chair with lumbar support",
        category: "Home & Kitchen",
        brand: "IKEA",
        sku: "CHAIR-OFFICE-ERG",
        price: 12999,
        stock: 0,
        colors: ["Black", "Gray", "Blue"],
        attributes: [{ name: "Material", values: ["Mesh", "Leather"] }],
        searchTags: ["chair", "office", "furniture", "ergonomic"],
        thumbnail: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500",
        images: ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800"]
    },
    {
        title: "Study Table with Drawer",
        description: "Wooden study table with storage drawer",
        category: "Home & Kitchen",
        brand: "IKEA",
        sku: "TABLE-STUDY-001",
        price: 8999,
        stock: 0,
        colors: ["Brown", "White", "Black"],
        attributes: [{ name: "Size", values: ["Small", "Medium", "Large"] }],
        searchTags: ["table", "study", "furniture", "desk"],
        thumbnail: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500",
        images: ["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800"]
    },

    // Electronics - Laptops
    {
        title: "MacBook Pro 14-inch",
        description: "Apple MacBook Pro with M3 chip",
        category: "Electronics",
        brand: "Apple",
        sku: "MACBOOK-PRO-14",
        price: 199900,
        stock: 0,
        colors: ["Space Gray", "Silver"],
        attributes: [
            { name: "RAM", values: ["16GB", "32GB", "64GB"] },
            { name: "Storage", values: ["512GB", "1TB", "2TB"] }
        ],
        searchTags: ["laptop", "macbook", "apple", "pro"],
        thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
        images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"]
    },
    {
        title: "Dell XPS 15",
        description: "Premium Windows laptop with InfinityEdge display",
        category: "Electronics",
        brand: "Dell",
        sku: "DELL-XPS-15",
        price: 149999,
        stock: 0,
        colors: ["Platinum Silver", "Frost White"],
        attributes: [
            { name: "RAM", values: ["16GB", "32GB"] },
            { name: "Storage", values: ["512GB", "1TB"] }
        ],
        searchTags: ["laptop", "dell", "xps", "windows"],
        thumbnail: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500",
        images: ["https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800"]
    }
];

// Add more products to reach 40-50
const additionalProducts = [
    // More Fashion items
    { title: "Denim Jeans", category: "Fashion", brand: "Levi's", sku: "JEANS-DENIM-001", price: 2999, colors: ["Blue", "Black", "Gray"], attributes: [{ name: "Size", values: ["30", "32", "34", "36"] }] },
    { title: "Formal Shirt", category: "Fashion", brand: "Van Heusen", sku: "SHIRT-FORMAL-001", price: 1899, colors: ["White", "Blue", "Pink"], attributes: [{ name: "Size", values: ["M", "L", "XL"] }] },
    { title: "Leather Jacket", category: "Fashion", brand: "Zara", sku: "JACKET-LEATHER", price: 8999, colors: ["Black", "Brown"], attributes: [{ name: "Size", values: ["M", "L", "XL"] }] },
    { title: "Sports Shorts", category: "Fashion", brand: "Puma", sku: "SHORTS-SPORTS", price: 999, colors: ["Black", "Blue", "Red"], attributes: [{ name: "Size", values: ["M", "L", "XL"] }] },

    // Electronics
    { title: "Wireless Earbuds", category: "Electronics", brand: "Apple", sku: "AIRPODS-PRO-2", price: 24900, colors: ["White"], attributes: [{ name: "Type", values: ["Standard", "Pro"] }] },
    { title: "Smart Watch", category: "Electronics", brand: "Apple", sku: "WATCH-SERIES-9", price: 42900, colors: ["Midnight", "Starlight", "Silver"], attributes: [{ name: "Size", values: ["41mm", "45mm"] }] },
    { title: "Tablet 10-inch", category: "Electronics", brand: "Samsung", sku: "TAB-S9", price: 54999, colors: ["Gray", "Pink"], attributes: [{ name: "Storage", values: ["128GB", "256GB"] }] },
    { title: "Gaming Mouse", category: "Electronics", brand: "Logitech", sku: "MOUSE-GAMING", price: 4999, colors: ["Black", "White"], attributes: [{ name: "DPI", values: ["12000", "16000"] }] },

    // Home & Kitchen
    { title: "Coffee Maker", category: "Home & Kitchen", brand: "Philips", sku: "COFFEE-MAKER", price: 3999, colors: ["Black", "Silver"], attributes: [{ name: "Capacity", values: ["4 Cup", "6 Cup"] }] },
    { title: "Blender Pro", category: "Home & Kitchen", brand: "Philips", sku: "BLENDER-PRO", price: 2999, colors: ["Black", "White"], attributes: [{ name: "Power", values: ["500W", "750W"] }] },
    { title: "Bed Sheet Set", category: "Home & Kitchen", brand: "IKEA", sku: "BEDSHEET-SET", price: 1499, colors: ["White", "Blue", "Gray"], attributes: [{ name: "Size", values: ["Single", "Double", "King"] }] },
    { title: "Curtains", category: "Home & Kitchen", brand: "IKEA", sku: "CURTAINS-001", price: 899, colors: ["White", "Beige", "Gray"], attributes: [{ name: "Length", values: ["5ft", "7ft", "9ft"] }] }
];

// Combine all products
const allProducts = [...productsData, ...additionalProducts.map(p => ({
    ...p,
    description: `High quality ${p.title.toLowerCase()} for your needs`,
    stock: 0,
    searchTags: p.title.toLowerCase().split(' '),
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"]
}))];

async function seedProducts() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('Connected to MongoDB');

        // Clear existing products
        console.log('Clearing existing products...');
        await Product.deleteMany({});

        // Get categories
        const categories = await Category.find({});
        const categoryMap = new Map();
        categories.forEach(cat => categoryMap.set(cat.name, cat._id));

        console.log(`Found ${categories.length} categories`);

        let createdCount = 0;

        for (const productData of allProducts) {
            const categoryId = categoryMap.get(productData.category);
            if (!categoryId) {
                console.log(`Category not found: ${productData.category}, skipping ${productData.title}`);
                continue;
            }

            // Generate variants
            const variants = [];
            const colors = productData.colors || [];
            const attributes = productData.attributes || [];

            if (colors.length > 0 && attributes.length > 0) {
                let variantIndex = 1;
                for (const color of colors) {
                    for (const attr of attributes) {
                        for (const value of attr.values) {
                            variants.push({
                                sku: `${productData.sku}-${variantIndex}`,
                                price: productData.price,
                                stock: Math.floor(Math.random() * 50) + 10,
                                images: [productData.thumbnail],
                                variantValues: {
                                    Color: color,
                                    [attr.name]: value
                                },
                                isDefault: variantIndex === 1
                            });
                            variantIndex++;
                        }
                    }
                }
            } else if (colors.length > 0) {
                colors.forEach((color, index) => {
                    variants.push({
                        sku: `${productData.sku}-${index + 1}`,
                        price: productData.price,
                        stock: Math.floor(Math.random() * 50) + 10,
                        images: [productData.thumbnail],
                        variantValues: { Color: color },
                        isDefault: index === 0
                    });
                });
            }

            const product = new Product({
                ...productData,
                category: categoryId,
                hasVariants: variants.length > 0,
                variants: variants,
                stock: variants.reduce((sum, v) => sum + v.stock, 0)
            });

            await product.save();
            createdCount++;
            console.log(`Created: ${product.title} with ${variants.length} variants`);
        }

        console.log(`\n✅ Successfully created ${createdCount} products!`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts();
