import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import { Category } from './src/models/Category'

async function checkModel() {
    try {
        await mongoose.connect(process.env.MONGO_URI || '')
        console.log('Connected')
        console.log('DB Name:', mongoose.connection.name)
        console.log('Collection Name:', Category.collection.name)

        const count = await Category.countDocuments()
        console.log('Count:', count)

        process.exit(0)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

checkModel()
