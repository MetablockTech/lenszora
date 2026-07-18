import dotenv from 'dotenv'
dotenv.config()
import { connectMongo } from './src/utils/mongo'
import { Product } from './src/models/Product'

async function getIds() {
    try {
        await connectMongo(process.env.MONGO_URI || '')
        const product = await Product.findOne({ title: 'iPhone 15 Pro Max' })
        if (product) {
            console.log(`PRODUCT_ID: ${product._id}`)
        } else {
            console.log('Product not found')
        }
        process.exit(0)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

getIds()
