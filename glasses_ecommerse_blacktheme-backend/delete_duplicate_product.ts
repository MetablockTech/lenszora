import dotenv from 'dotenv'
dotenv.config()
import { connectMongo } from './src/utils/mongo'
import { Product } from './src/models/Product'

async function deleteProduct() {
    try {
        await connectMongo(process.env.MONGO_URI || '')
        console.log('Connected to MongoDB\n')

        const productId = '6958d2a88cdfaec92d43c713'

        // First, show the product details
        const product = await Product.findById(productId)

        if (!product) {
            console.log('❌ Product not found!')
            process.exit(1)
        }

        console.log('Product to be deleted:')
        console.log('  ID:     ', product._id)
        console.log('  Title:  ', product.title)
        console.log('  SKU:    ', product.sku)
        console.log('  Status: ', product.status)
        console.log('')

        // Delete the product
        const result = await Product.deleteOne({ _id: productId })

        if (result.deletedCount > 0) {
            console.log('✅ Product deleted successfully!')
            console.log('   You can now create a new product with SKU "asdasdasd"')
        } else {
            console.log('❌ Failed to delete product')
        }

        process.exit(0)
    } catch (err) {
        console.error('Error:', err)
        process.exit(1)
    }
}

deleteProduct()
