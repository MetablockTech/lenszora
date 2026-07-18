import dotenv from 'dotenv'
dotenv.config()

import { connectMongo } from './src/utils/mongo'
import { User } from './src/models/User'
import { Category } from './src/models/Category'
import { Brand } from './src/models/Brand'
import { Product } from './src/models/Product'
import { Sale } from './src/models/Sale'
import { Setting } from './src/models/Setting'
import bcrypt from 'bcryptjs'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

async function downloadImage(url: string, filename: string): Promise<string> {
  try {
    const filepath = path.join(uploadsDir, filename)
    if (fs.existsSync(filepath)) {
      return `/uploads/${filename}`
    }
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    fs.writeFileSync(filepath, response.data)
    return `/uploads/${filename}`
  } catch (err) {
    console.error(`Failed to download image from ${url}:`, err)
    return ''
  }
}

const structure = [
  {
    name: 'Electronics',
    slug: 'electronics',
    subs: [
      {
        name: 'Mobiles',
        slug: 'mobiles',
        subs: [
          { name: 'Smartphones', slug: 'smartphones' },
          { name: 'Feature Phones', slug: 'feature-phones' },
          { name: 'Mobile Accessories', slug: 'mobile-accessories' }
        ]
      },
      {
        name: 'Laptops',
        slug: 'laptops',
        subs: [
          { name: 'Gaming Laptops', slug: 'gaming-laptops' },
          { name: 'Thin & Light', slug: 'thin-light-laptops' },
          { name: 'MacBooks', slug: 'macbooks' }
        ]
      },
      {
        name: 'Audio',
        slug: 'audio',
        subs: [
          { name: 'Headphones', slug: 'headphones' },
          { name: 'True Wireless Earbuds', slug: 'tws' },
          { name: 'Bluetooth Speakers', slug: 'speakers' }
        ]
      },
      {
        name: 'Cameras',
        slug: 'cameras',
        subs: [
          { name: 'DSLR', slug: 'dslr' },
          { name: 'Mirrorless', slug: 'mirrorless' },
          { name: 'Action Cameras', slug: 'action-cameras' }
        ]
      }
    ]
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    subs: [
      {
        name: 'Men',
        slug: 'men-fashion',
        subs: [
          { name: 'T-Shirts', slug: 'men-tshirts' },
          { name: 'Casual Shirts', slug: 'men-casual-shirts' },
          { name: 'Jeans', slug: 'men-jeans' },
          { name: 'Sneakers', slug: 'men-sneakers' },
          { name: 'Watches', slug: 'men-watches' }
        ]
      },
      {
        name: 'Women',
        slug: 'women-fashion',
        subs: [
          { name: 'Dresses', slug: 'women-dresses' },
          { name: 'Kurtas & Kurtis', slug: 'women-kurtas' },
          { name: 'Tops', slug: 'women-tops' },
          { name: 'Heels', slug: 'women-heels' },
          { name: 'Handbags', slug: 'women-handbags' }
        ]
      }
    ]
  },
  {
    name: 'Home & Furniture',
    slug: 'home-furniture',
    subs: [
      {
        name: 'Living Room',
        slug: 'living-room',
        subs: [
          { name: 'Sofas', slug: 'sofas' },
          { name: 'Coffee Tables', slug: 'coffee-tables' },
          { name: 'TV Units', slug: 'tv-units' }
        ]
      },
      {
        name: 'Bedroom',
        slug: 'bedroom',
        subs: [
          { name: 'Beds', slug: 'beds' },
          { name: 'Wardrobes', slug: 'wardrobes' },
          { name: 'Mattresses', slug: 'mattresses' }
        ]
      },
      {
        name: 'Kitchen',
        slug: 'kitchen',
        subs: [
          { name: 'Cookware', slug: 'cookware' },
          { name: 'Dinnerware', slug: 'dinnerware' }
        ]
      }
    ]
  },
  {
    name: 'Appliances',
    slug: 'appliances',
    subs: [
      {
        name: 'Televisions',
        slug: 'televisions',
        subs: [
          { name: 'Smart TVs', slug: 'smart-tvs' },
          { name: '4K UHD TVs', slug: '4k-tvs' }
        ]
      },
      {
        name: 'Large Appliances',
        slug: 'large-appliances',
        subs: [
          { name: 'Refrigerators', slug: 'refrigerators' },
          { name: 'Washing Machines', slug: 'washing-machines' },
          { name: 'Air Conditioners', slug: 'air-conditioners' }
        ]
      }
    ]
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty',
    subs: [
      {
        name: 'Makeup',
        slug: 'makeup',
        subs: [
          { name: 'Lipstick', slug: 'lipstick' },
          { name: 'Foundation', slug: 'foundation' }
        ]
      },
      {
        name: 'Skincare',
        slug: 'skincare',
        subs: [
          { name: 'Moisturizers', slug: 'moisturizers' },
          { name: 'Sunscreen', slug: 'sunscreen' }
        ]
      }
    ]
  }
]

const brandsData = [
  { name: 'Apple', slug: 'apple' },
  { name: 'Samsung', slug: 'samsung' },
  { name: 'Sony', slug: 'sony' },
  { name: 'Dell', slug: 'dell' },
  { name: 'HP', slug: 'hp' },
  { name: 'Lenovo', slug: 'lenovo' },
  { name: 'Asus', slug: 'asus' },
  { name: 'Nike', slug: 'nike' },
  { name: 'Adidas', slug: 'adidas' },
  { name: 'Puma', slug: 'puma' },
  { name: 'Zara', slug: 'zara' },
  { name: 'H&M', slug: 'h-m' },
  { name: 'Levi\'s', slug: 'levis' },
  { name: 'IKEA', slug: 'ikea' },
  { name: 'LG', slug: 'lg' },
  { name: 'Whirlpool', slug: 'whirlpool' },
  { name: 'L\'Oreal', slug: 'loreal' },
  { name: 'Maybelline', slug: 'maybelline' },
  { name: 'Canon', slug: 'canon' },
  { name: 'Nikon', slug: 'nikon' },
  { name: 'Bose', slug: 'bose' },
  { name: 'JBL', slug: 'jbl' },
  { name: 'OnePlus', slug: 'oneplus' },
  { name: 'Xiaomi', slug: 'xiaomi' },
  { name: 'Google', slug: 'google' },
  { name: 'Other', slug: 'other' }
]

async function seed() {
  try {
    await connectMongo(process.env.MONGO_URI || '')
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    await Category.deleteMany({})
    await Brand.deleteMany({})
    await Product.deleteMany({})
    await Sale.deleteMany({})
    await Setting.deleteMany({})
    console.log('Cleared existing data')

    // Create Users
    const adminPassword = await bcrypt.hash('admin123', 10)
    await User.create({
      email: 'admin@visionary.com',
      password: adminPassword,
      role: 'admin',
      name: 'Admin User'
    })

    const userPassword = await bcrypt.hash('user123', 10)
    await User.create({
      email: 'user@visionary.com',
      password: userPassword,
      role: 'user',
      name: 'Test User'
    })
    console.log('✓ Created users')

    // Create Brands
    const createdBrands = await Brand.insertMany(brandsData)
    console.log(`✓ Created ${createdBrands.length} brands`)

    const getBrand = (name: string) => createdBrands.find(b => b.name === name)?._id

    // Create Categories recursively
    const categoryMap: Record<string, any> = {}

    async function createCategories(list: any[], parentId: any = null, level: 'main' | 'sub' | 'subsub' = 'main') {
      for (const item of list) {
        const cat = await Category.create({
          name: item.name,
          slug: item.slug,
          parentId,
          level,
          description: `Best collection of ${item.name}`
        })
        categoryMap[item.slug] = cat._id

        if (item.subs) {
          const nextLevel = level === 'main' ? 'sub' : 'subsub'
          await createCategories(item.subs, cat._id, nextLevel)
        }
      }
    }

    await createCategories(structure)
    console.log('✓ Created category hierarchy')

    // Products Data
    const products = [
      // --- Electronics ---
      {
        title: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        description: 'The ultimate iPhone with titanium design, A17 Pro chip, and ProMotion display. Features advanced camera system with 5x optical zoom.',
        category: categoryMap['smartphones'],
        brand: getBrand('Apple'),
        price: 134900, // Base price (256GB)
        stock: 150, // Total stock across all variants
        sku: 'IP15PM-BASE',
        unit: 'pc',
        images: [
          'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
          'https://images.unsplash.com/photo-1678652508461-f2932e8ac5ff?w=800&q=80',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80'
        ],
        colors: ['Natural Titanium', 'Blue Titanium', 'Black Titanium'],
        attributes: [{ name: 'Storage', values: ['256GB', '512GB', '1TB'] }],
        hasVariants: true,
        variants: [
          // 256GB - Natural Titanium
          {
            sku: 'IP15PM-256-NAT',
            price: 134900,
            stock: 20,
            images: [
              'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
              'https://images.unsplash.com/photo-1678652508461-f2932e8ac5ff?w=800&q=80',
              'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
              'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=800&q=80'
            ],
            variantValues: { Storage: '256GB', Color: 'Natural Titanium' }
          },
          // 256GB - Blue Titanium
          {
            sku: 'IP15PM-256-BLU',
            price: 134900,
            stock: 15,
            images: [
              'https://images.unsplash.com/photo-1695048064774-54d0e0e7dc83?w=800&q=80',
              'https://images.unsplash.com/photo-1592286927505-b0c2369d7e5b?w=800&q=80',
              'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80',
              'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&q=80'
            ],
            variantValues: { Storage: '256GB', Color: 'Blue Titanium' }
          },
          // 256GB - Black Titanium
          {
            sku: 'IP15PM-256-BLK',
            price: 134900,
            stock: 18,
            images: [
              'https://images.unsplash.com/photo-1592286927505-b0c2369d7e5b?w=800&q=80',
              'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80',
              'https://images.unsplash.com/photo-1581993192008-63e896f4ea84?w=800&q=80',
              'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80'
            ],
            variantValues: { Storage: '256GB', Color: 'Black Titanium' }
          },
          // 512GB - Natural Titanium
          {
            sku: 'IP15PM-512-NAT',
            price: 154900,
            stock: 12,
            images: [
              'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
              'https://images.unsplash.com/photo-1678652508461-f2932e8ac5ff?w=800&q=80',
              'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
              'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=800&q=80'
            ],
            variantValues: { Storage: '512GB', Color: 'Natural Titanium' }
          },
          // 512GB - Blue Titanium
          {
            sku: 'IP15PM-512-BLU',
            price: 154900,
            stock: 10,
            images: [
              'https://images.unsplash.com/photo-1695048064774-54d0e0e7dc83?w=800&q=80',
              'https://images.unsplash.com/photo-1592286927505-b0c2369d7e5b?w=800&q=80',
              'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80',
              'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&q=80'
            ],
            variantValues: { Storage: '512GB', Color: 'Blue Titanium' }
          },
          // 512GB - Black Titanium (OUT OF STOCK for testing)
          {
            sku: 'IP15PM-512-BLK',
            price: 154900,
            stock: 0,
            images: [
              'https://images.unsplash.com/photo-1592286927505-b0c2369d7e5b?w=800&q=80',
              'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80',
              'https://images.unsplash.com/photo-1581993192008-63e896f4ea84?w=800&q=80',
              'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80'
            ],
            variantValues: { Storage: '512GB', Color: 'Black Titanium' }
          },
          // 1TB - Natural Titanium
          {
            sku: 'IP15PM-1TB-NAT',
            price: 174900,
            stock: 8,
            images: [
              'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
              'https://images.unsplash.com/photo-1678652508461-f2932e8ac5ff?w=800&q=80',
              'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
              'https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=800&q=80'
            ],
            variantValues: { Storage: '1TB', Color: 'Natural Titanium' }
          },
          // 1TB - Blue Titanium
          {
            sku: 'IP15PM-1TB-BLU',
            price: 174900,
            stock: 5,
            images: [
              'https://images.unsplash.com/photo-1695048064774-54d0e0e7dc83?w=800&q=80',
              'https://images.unsplash.com/photo-1592286927505-b0c2369d7e5b?w=800&q=80',
              'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80',
              'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&q=80'
            ],
            variantValues: { Storage: '1TB', Color: 'Blue Titanium' }
          },
          // 1TB - Black Titanium
          {
            sku: 'IP15PM-1TB-BLK',
            price: 174900,
            stock: 7,
            images: [
              'https://images.unsplash.com/photo-1592286927505-b0c2369d7e5b?w=800&q=80',
              'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&q=80',
              'https://images.unsplash.com/photo-1581993192008-63e896f4ea84?w=800&q=80',
              'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80'
            ],
            variantValues: { Storage: '1TB', Color: 'Black Titanium' }
          }
        ]
      },
      {
        title: 'Samsung Galaxy S24 Ultra',
        slug: 'samsung-s24-ultra',
        description: 'Galaxy AI is here. Welcome to the era of mobile AI.',
        category: categoryMap['smartphones'],
        brand: getBrand('Samsung'),
        price: 129999,
        stock: 45,
        sku: 'S24U-512',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1610945265078-3858a0b5d8f4?w=800&q=80'],
        colors: ['Titanium Gray', 'Titanium Black'],
        attributes: [{ name: 'Storage', values: ['256GB', '512GB'] }]
      },
      {
        title: 'OnePlus 12',
        slug: 'oneplus-12',
        description: 'Smooth Beyond Belief. Snapdragon 8 Gen 3.',
        category: categoryMap['smartphones'],
        brand: getBrand('OnePlus'),
        price: 64999,
        stock: 100,
        sku: 'OP12-256',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=800&q=80'],
        colors: ['Flowy Emerald', 'Silky Black'],
        attributes: [{ name: 'RAM', values: ['12GB', '16GB'] }]
      },
      {
        title: 'Google Pixel 8 Pro',
        slug: 'google-pixel-8-pro',
        description: 'The all-pro phone engineered by Google.',
        category: categoryMap['smartphones'],
        brand: getBrand('Other'),
        price: 106999,
        stock: 30,
        sku: 'PIXEL-8P',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80'],
        colors: ['Bay', 'Obsidian', 'Porcelain'],
        attributes: [{ name: 'Storage', values: ['128GB', '256GB'] }]
      },
      {
        title: 'MacBook Pro 14 M3',
        slug: 'macbook-pro-14-m3',
        description: 'Mind-blowing. Head-turning. With M3, M3 Pro, or M3 Max.',
        category: categoryMap['macbooks'],
        brand: getBrand('Apple'),
        price: 169900,
        stock: 30,
        sku: 'MBP14-M3',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=800&q=80'],
        colors: ['Space Black', 'Silver'],
        attributes: [{ name: 'Chip', values: ['M3', 'M3 Pro', 'M3 Max'] }]
      },
      {
        title: 'Dell Alienware m18',
        slug: 'alienware-m18',
        description: '18-inch gaming laptop with 13th Gen Intel Core processors.',
        category: categoryMap['gaming-laptops'],
        brand: getBrand('Dell'),
        price: 249990,
        stock: 10,
        sku: 'AW-M18-001',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&q=80'],
        colors: ['Dark Metallic Moon'],
        attributes: [{ name: 'RAM', values: ['32GB', '64GB'] }, { name: 'GPU', values: ['RTX 4080', 'RTX 4090'] }]
      },
      {
        title: 'Sony WH-1000XM5',
        slug: 'sony-xm5',
        description: 'Industry leading noise canceling headphones.',
        category: categoryMap['headphones'],
        brand: getBrand('Sony'),
        price: 29990,
        stock: 100,
        sku: 'SONY-XM5',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80'],
        colors: ['Black', 'Silver'],
        attributes: []
      },
      {
        title: 'Canon EOS R6 Mark II',
        slug: 'canon-r6-mark-ii',
        description: 'Master stills and motion with this hybrid full-frame mirrorless camera.',
        category: categoryMap['mirrorless'],
        brand: getBrand('Canon'),
        price: 215995,
        stock: 15,
        sku: 'CANON-R6M2',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'],
        colors: ['Black'],
        attributes: [{ name: 'Lens Kit', values: ['Body Only', '24-105mm Kit'] }]
      },
      {
        title: 'Nikon Z9',
        slug: 'nikon-z9',
        description: 'Unstoppable performance for professionals.',
        category: categoryMap['mirrorless'],
        brand: getBrand('Nikon'),
        price: 475000,
        stock: 5,
        sku: 'NIKON-Z9',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'],
        colors: ['Black'],
        attributes: []
      },

      // --- Fashion ---
      {
        title: 'Nike Sportswear Club Tee',
        slug: 'nike-club-tee',
        description: 'Everyday cotton comfort. Classic fit.',
        category: categoryMap['men-tshirts'],
        brand: getBrand('Nike'),
        price: 1495,
        stock: 200,
        sku: 'NIKE-TEE-001',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],
        colors: ['White', 'Black', 'Grey'],
        attributes: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }]
      },
      {
        title: 'Levi\'s Men\'s 511 Slim Fit Jeans',
        slug: 'levis-511',
        description: 'A modern slim with room to move.',
        category: categoryMap['men-jeans'],
        brand: getBrand('Levi\'s'),
        price: 2999,
        stock: 150,
        sku: 'LEVIS-511',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1542272617-08f086302542?w=800&q=80'],
        colors: ['Dark Blue', 'Light Blue'],
        attributes: [{ name: 'Size', values: ['30', '32', '34', '36'] }]
      },
      {
        title: 'Zara Floral Summer Dress',
        slug: 'zara-floral-dress',
        description: 'Flowy floral dress perfect for summer outings.',
        category: categoryMap['women-dresses'],
        brand: getBrand('Zara'),
        price: 3990,
        stock: 60,
        sku: 'ZARA-DRS-001',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80'],
        colors: ['Red', 'Blue'],
        attributes: [{ name: 'Size', values: ['XS', 'S', 'M', 'L'] }]
      },
      {
        title: 'Adidas Ultraboost Light',
        slug: 'adidas-ultraboost',
        description: 'Experience epic energy with the new Ultraboost Light.',
        category: categoryMap['men-sneakers'],
        brand: getBrand('Adidas'),
        price: 16999,
        stock: 80,
        sku: 'ADI-UB-LIGHT',
        unit: 'pair',
        images: ['https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=80'],
        colors: ['Core Black', 'Cloud White'],
        attributes: [{ name: 'Size', values: ['UK 7', 'UK 8', 'UK 9', 'UK 10'] }]
      },
      {
        title: 'Puma RS-X Efekt',
        slug: 'puma-rs-x',
        description: 'RS-X is back. The future-retro silhouette of this sneaker returns with a progressive aesthetic.',
        category: categoryMap['men-sneakers'],
        brand: getBrand('Puma'),
        price: 8999,
        stock: 120,
        sku: 'PUMA-RSX-01',
        unit: 'pair',
        images: ['https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=80'],
        colors: ['White-Black', 'Grey-Red'],
        attributes: [{ name: 'Size', values: ['UK 7', 'UK 8', 'UK 9', 'UK 10'] }]
      },

      // --- Home & Furniture ---
      {
        title: 'IKEA LANDSKRONA Sofa',
        slug: 'ikea-landskrona',
        description: 'Warm and welcoming, neat and stylish. Supporting seat cushions.',
        category: categoryMap['sofas'],
        brand: getBrand('IKEA'),
        price: 45990,
        stock: 15,
        sku: 'IKEA-SOFA-001',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'],
        colors: ['Gunnared Dark Grey', 'Gunnared Light Green'],
        attributes: [{ name: 'Seating', values: ['2-seat', '3-seat'] }]
      },
      {
        title: 'Wakefit Orthopedic Memory Foam Mattress',
        slug: 'wakefit-ortho',
        description: 'Scientific mattress design for back pain relief.',
        category: categoryMap['mattresses'],
        brand: getBrand('Other'),
        price: 12000,
        stock: 40,
        sku: 'WAKEFIT-MAT-01',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'],
        colors: ['White'],
        attributes: [{ name: 'Size', values: ['Queen', 'King'] }]
      },

      // --- Appliances ---
      {
        title: 'LG 55 inch 4K Ultra HD Smart LED TV',
        slug: 'lg-55-4k-tv',
        description: 'Stunning 4K visuals with AI Sound Pro.',
        category: categoryMap['smart-tvs'],
        brand: getBrand('LG'),
        price: 49990,
        stock: 25,
        sku: 'LG-55-4K',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80'],
        colors: ['Black'],
        attributes: [{ name: 'Screen Size', values: ['43', '55', '65'] }]
      },
      {
        title: 'Whirlpool 265 L Frost Free Double Door Refrigerator',
        slug: 'whirlpool-fridge',
        description: 'Convertible freezer with 5-in-1 modes.',
        category: categoryMap['refrigerators'],
        brand: getBrand('Whirlpool'),
        price: 27990,
        stock: 30,
        sku: 'WP-265L',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1571175443880-49e1d58b794a?w=800&q=80'],
        colors: ['Alpha Steel', 'Crystal Black'],
        attributes: []
      },

      // --- Beauty ---
      {
        title: 'L\'Oreal Paris Color Riche Lipstick',
        slug: 'loreal-lipstick',
        description: 'Luxurious lipstick with rich color and hydration.',
        category: categoryMap['lipstick'],
        brand: getBrand('L\'Oreal'),
        price: 799,
        stock: 500,
        sku: 'LOREAL-LIP-01',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80'],
        colors: ['Red Passion', 'Nude Ballet'],
        attributes: []
      },
      {
        title: 'Maybelline New York Fit Me Foundation',
        slug: 'maybelline-foundation',
        description: 'Matte + Poreless foundation for normal to oily skin.',
        category: categoryMap['foundation'],
        brand: getBrand('Maybelline'),
        price: 549,
        stock: 400,
        sku: 'MAY-FIT-ME',
        unit: 'pc',
        images: ['https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&q=80'],
        colors: ['128 Warm Nude', '220 Natural Beige'],
        attributes: [{ name: 'Shade', values: ['115', '128', '220', '310'] }]
      }
    ]

    // Create Products
    console.log('Creating products...')
    for (const p of products) {
      await Product.create({
        ...p,
        thumbnail: p.images[0]
      })
      console.log(`  ✓ Created: ${p.title}`)
    }

    // Get created products for sales
    const createdProducts = await Product.find({})
    const iphone = createdProducts.find(p => p.title.includes('iPhone'))
    const samsung = createdProducts.find(p => p.title.includes('Samsung'))
    const laptop = createdProducts.find(p => p.title.includes('Laptop'))
    const shoes = createdProducts.find(p => p.title.includes('Shoe') || p.title.includes('Nike'))
    const tshirt = createdProducts.find(p => p.title.includes('T-Shirt') || p.title.includes('shirt'))

    // Create Sales
    const salesData = [
      {
        title: 'Electronics Mega Sale',
        slug: 'electronics-mega-sale',
        description: 'Huge discounts on smartphones, laptops, and accessories!',
        type: 'flash-deal',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        discountType: 'percentage',
        discountValue: 25,
        products: [iphone?._id, samsung?._id, laptop?._id].filter(Boolean),
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
        isActive: true
      },
      {
        title: 'iPhone 15 Pro Max - Deal of the Day',
        slug: 'iphone-15-deal',
        description: 'Limited time offer on iPhone 15 Pro Max. Grab it before stock runs out!',
        type: 'deal-of-day',
        startDate: new Date(),
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        discountType: 'fixed',
        discountValue: 15000,
        products: [iphone?._id].filter(Boolean),
        image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
        isActive: true
      },
      {
        title: 'Fashion Blast - Featured Deal',
        slug: 'fashion-featured-deal',
        description: 'Trending fashion items at unbeatable prices!',
        type: 'featured-deal',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        discountType: 'percentage',
        discountValue: 40,
        products: [shoes?._id, tshirt?._id].filter(Boolean),
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
        isActive: true
      },
      {
        title: 'Year End Clearance Sale',
        slug: 'year-end-clearance',
        description: 'Clear out old stock with massive discounts across all categories!',
        type: 'clearance-sale',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        discountType: 'percentage',
        discountValue: 50,
        products: [samsung?._id, laptop?._id, shoes?._id].filter(Boolean),
        image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80',
        isActive: true
      },
      {
        title: 'New Year Special - 2000 OFF',
        slug: 'new-year-coupon',
        description: 'Use code NEWYEAR2025 to get flat ₹2000 off on orders above ₹10,000',
        type: 'coupon',
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        discountType: 'fixed',
        discountValue: 2000,
        products: createdProducts.slice(0, 10).map(p => p._id),
        image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80',
        isActive: true
      }
    ]

    await Sale.insertMany(salesData)
    console.log(`✓ Created ${salesData.length} sales/deals`)

    // Create social links setting
    await Setting.create({
      key: 'social_links',
      value: [
        { platform: 'Facebook', url: 'https://facebook.com', icon: 'facebook' },
        { platform: 'Instagram', url: 'https://instagram.com', icon: 'instagram' },
        { platform: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
        { platform: 'Youtube', url: 'https://youtube.com', icon: 'youtube' }
      ],
      type: 'array',
      category: 'social',
      description: 'Social media links'
    })
    console.log('✓ Created social links')

    // Create contact info setting
    await Setting.create({
      key: 'contact_info',
      value: {
        address: '123 Shopping Street, Mumbai, Maharashtra 400001',
        phone: '+91 1234567890',
        email: 'support@visionaryemporium.com'
      },
      type: 'json',
      category: 'general',
      description: 'Contact information'
    })
    console.log('✓ Created contact info')

    console.log('\n✅ Database seeding completed successfully!')
    console.log('\n📝 Admin Credentials:')
    console.log('   Email: admin@visionary.com')
    console.log('   Password: admin123')
    process.exit(0)

  } catch (err) {
    console.error('Seeding failed:', err)
    process.exit(1)
  }
}

seed()
