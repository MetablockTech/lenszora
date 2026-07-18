import dotenv from 'dotenv'
dotenv.config()
import { connectMongo } from './src/utils/mongo'
import { Product } from './src/models/Product'

async function findProduct() {
    try {
        await connectMongo(process.env.MONGO_URI || '')

        const sku = 'asdasdasd'
        const product = await Product.findOne({ sku })

        if (product) {
            console.log(JSON.stringify({
                _id: product._id,
                title: product.title,
                sku: product.sku,
                status: product.status,
                createdAt: product.createdAt
            }, null, 2))
        } else {
            console.log('NOT_FOUND')
        }

        process.exit(0)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

findProduct()
