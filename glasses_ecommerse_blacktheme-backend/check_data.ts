import dotenv from 'dotenv'
dotenv.config()

import { connectMongo } from './src/utils/mongo'
import { Product } from './src/models/Product'
import { Category } from './src/models/Category'
import { Brand } from './src/models/Brand'
import { Vendor } from './src/models/Vendor'

async function checkData() {
    try {
        await connectMongo(process.env.MONGO_URI || '')
        console.log('Connected to MongoDB\n')

        const productCount = await Product.countDocuments()
        const categoryCount = await Category.countDocuments()
        const brandCount = await Brand.countDocuments()
        const vendorCount = await Vendor.countDocuments()

        console.log('📊 Database Statistics:')
        console.log('=======================')
        console.log(`Products: ${productCount}`)
        console.log(`Categories: ${categoryCount}`)
        console.log(`Brands: ${brandCount}`)
        console.log(`Vendors: ${vendorCount}`)
        console.log('')

        // Show some sample products
        const sampleProducts = await Product.find().limit(5).select('title price category brand')
        console.log('📦 Sample Products:')
        console.log('===================')
        sampleProducts.forEach((p, i) => {
            console.log(`${i + 1}. ${p.title} - ₹${p.price}`)
        })

        process.exit(0)
    } catch (error: any) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

checkData()
