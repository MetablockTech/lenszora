import dotenv from 'dotenv'
dotenv.config()
import { connectMongo } from './src/utils/mongo'
import { LensType } from './src/models/LensType'
import { LensPackage } from './src/models/LensPackage'
import { Vendor } from './src/models/Vendor'

async function check() {
    try {
        await connectMongo(process.env.MONGO_URI || '')
        console.log('--- DATABASE LENS VERIFICATION ---')

        const vendors = await Vendor.find({})
        console.log(`Found ${vendors.length} vendors.\n`)

        for (const vendor of vendors) {
            const types = await LensType.find({ vendorId: vendor._id })
            const pkgs = await LensPackage.find({ vendorId: vendor._id })
            console.log(`Vendor: ${vendor.businessName} (ID: ${vendor._id})`)
            console.log(` - Lens Types: ${types.length}`)
            console.log(` - Lens Packages: ${pkgs.length}`)
            if (types.length > 0) {
                console.log(` - Sample Types: ${types.map(t => t.name).join(', ')}`)
            }
            console.log('---------------------------')
        }

        const globalTypes = await LensType.find({ vendorId: null })
        const globalPkgs = await LensPackage.find({ vendorId: null })
        console.log(`Platform Global (vendorId: null)`)
        console.log(` - Lens Types: ${globalTypes.length}`)
        console.log(` - Lens Packages: ${globalPkgs.length}`)
        console.log('---------------------------')

        process.exit(0)
    } catch (error) {
        console.error('Check error:', error)
        process.exit(1)
    }
}

check()
