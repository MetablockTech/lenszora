import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import { Category } from './src/models/Category'
import Product from './src/models/Product'

async function debugBD() {
    try {
        const uri = process.env.MONGO_URI || 'not set'
        console.log(`Connecting to: ${uri}`)
        await mongoose.connect(uri)
        console.log('Connected to MongoDB')

        const catCount = await Category.countDocuments()
        const prodCount = await Product.countDocuments()

        console.log(`Categories count: ${catCount}`)
        console.log(`Products count: ${prodCount}`)

        if (catCount > 0) {
            const sampleCat = await Category.findOne()
            console.log('Sample Category:', sampleCat?.name)
        }

        process.exit(0)
    } catch (err) {
        console.error('Debug script failed:', err)
        process.exit(1)
    }
}

debugBD()
