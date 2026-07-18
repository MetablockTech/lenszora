import dotenv from 'dotenv'
dotenv.config()
import { connectMongo } from './src/utils/mongo'
import { Category } from './src/models/Category'
import Product from './src/models/Product'

async function check() {
    try {
        await connectMongo(process.env.MONGO_URI || '')
        console.log('Connected to MongoDB')

        const categories = await Category.find({})
        console.log(`Total Categories: ${categories.length}`)
        console.log('Sample Categories:', categories.map(c => c.name).slice(0, 5))

        const products = await Product.find({})
        console.log(`Total Products: ${products.length}`)
        console.log('Sample Products:', products.map(p => p.title).slice(0, 5))

        process.exit(0)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

check()
