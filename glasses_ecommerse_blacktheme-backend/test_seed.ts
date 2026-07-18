import dotenv from 'dotenv'
dotenv.config()

import { connectMongo } from './src/utils/mongo'
import { Category } from './src/models/Category'

async function test() {
    try {
        await connectMongo(process.env.MONGO_URI || '')
        console.log('Connected to MongoDB')

        // Clear categories
        await Category.deleteMany({})
        console.log('Cleared categories')

        // Try creating a simple category
        const testCat = await Category.create({
            name: 'Test Category',
            slug: 'test-category',
            level: 'main'
        })
        console.log('Created test category:', testCat)

        process.exit(0)
    } catch (error) {
        console.error('Full error:', JSON.stringify(error, null, 2))
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        process.exit(1)
    }
}

test()
