import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Product } from './models/Product';
import { Category } from './models/Category';

dotenv.config({ path: path.join(__dirname, '../.env') });

const productsData = [
    {
        title: "iPhone 15 Pro",
        description: "Latest iPhone with A17 Pro chip and titanium design",
        category: "Electronics",
        brand: "Apple",
        sku: "IPHONE-15-PRO",
        price: 129900,
        colors: ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"],
        attributes: [{ name: "Storage", values: ["128GB", "256GB", "512GB"] }],
        searchTags: ["smartphone", "iphone", "apple", "5g"],
        thumbnail: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500",
        images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800"]
    },
    {
        title: "Samsung Galaxy S24 Ultra",
        description: "Flagship Samsung phone with S Pen",
        category: "Electronics",
        brand: "Samsung",
        sku: "GALAXY-S24",
        price: 124999,
        colors: ["Titanium Gray", "Titanium Black"],
        attributes: [{ name: "Storage", values: ["256GB", "512GB"] }],
        searchTags: ["smartphone", "samsung", "android"],
        thumbnail: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500",
        images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800"]
    },
    {
        title: "Premium Cotton T-Shirt",
        description: "100% organic cotton t-shirt",
        category: "Fashion",
        brand: "Nike",
        sku: "TSHIRT-001",
        price: 1299,
        colors: ["Black", "White", "Navy", "Red"],
        attributes: [{ name: "Size", values: ["S", "M", "L", "XL"] }],
        searchTags: ["tshirt", "cotton", "casual"],
        thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"]
    },
    {
        title: "Running Shoes Pro",
        description: "Professional running shoes",
        category: "Fashion",
        brand: "Nike",
        sku: "SHOES-RUN",
        price: 4999,
        colors: ["Black", "White", "Blue"],
        attributes: [{ name: "Size", values: ["7", "8", "9", "10"] }],
        searchTags: ["shoes", "running", "sports"],
        thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]
    },
    {
        title: "MacBook Pro 14",
        description: "Apple MacBook Pro with M3 chip",
        category: "Electronics",
        brand: "Apple",
        sku: "MACBOOK-14",
        price: 199900,
        colors: ["Space Gray", "Silver"],
        attributes: [{ name: "RAM", values: ["16GB", "32GB"] }],
        searchTags: ["laptop", "macbook", "apple"],
        thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
        images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"]
    }
];

async function seedProducts() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('✅ Connected to MongoDB\n');

        console.log('🗑️  Clearing existing products...');
        await Product.deleteMany({});
        console.log('✅ Cleared\n');

        const categories = await Category.find({});
        const categoryMap = new Map();
        categories.forEach((cat: any) => categoryMap.set(cat.name, cat._id));
        console.log(`📁 Found ${categories.length} categories\n`);

        let created = 0;

        for (const data of productsData) {
            const categoryId = categoryMap.get(data.category);
            if (!categoryId) {
                console.log(`⚠️  Skipping ${data.title} - category not found`);
                continue;
            }

            const variants = [];
            let variantIndex = 1;

            for (const color of data.colors) {
                for (const attr of data.attributes) {
                    for (const value of attr.values) {
                        variants.push({
                            sku: `${data.sku}-${variantIndex}`,
                            price: data.price,
                            stock: Math.floor(Math.random() * 50) + 10,
                            images: [data.thumbnail],
                            variantValues: { Color: color, [attr.name]: value },
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
                brand: data.brand,
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
                images: data.images
            });

            await product.save();
            created++;
            console.log(`✅ ${data.title} - ${variants.length} variants`);
        }

        console.log(`\n🎉 Created ${created} products!`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedProducts();
