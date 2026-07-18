import dotenv from 'dotenv'
dotenv.config()
import { connectMongo } from './src/utils/mongo'
import { Product } from './src/models/Product'

async function analyzeIssue() {
    try {
        await connectMongo(process.env.MONGO_URI || '')
        console.log('Connected to MongoDB\n')

        const problematicSKU = 'asdasdasd'

        // Find products with this SKU
        const products = await Product.find({ sku: problematicSKU })

        console.log('='.repeat(60))
        console.log(`CHECKING FOR SKU: "${problematicSKU}"`)
        console.log('='.repeat(60))

        if (products.length > 0) {
            console.log(`\n❌ FOUND ${products.length} PRODUCT(S) WITH THIS SKU:\n`)
            products.forEach((p, index) => {
                console.log(`Product ${index + 1}:`)
                console.log(`  ID:      ${p._id}`)
                console.log(`  Title:   ${p.title}`)
                console.log(`  SKU:     ${p.sku}`)
                console.log(`  Status:  ${p.status}`)
                console.log(`  Created: ${p.createdAt}`)
                console.log('')
            })
        } else {
            console.log('\n✅ No products currently exist with this SKU')
            console.log('   (It may have been deleted, but the unique index still prevents reuse)')
        }

        console.log('\n' + '='.repeat(60))
        console.log('SOLUTION OPTIONS')
        console.log('='.repeat(60))

        if (products.length > 0) {
            console.log('\nOption 1: UPDATE the existing product')
            console.log(`  Use: PUT /api/products/${products[0]._id}`)
            console.log('  This will modify the existing product instead of creating a new one')

            console.log('\nOption 2: DELETE the existing product first')
            console.log(`  Use: DELETE /api/products/${products[0]._id}`)
            console.log('  Then create a new product with the same SKU')

            console.log('\nOption 3: Use a DIFFERENT SKU')
            console.log('  Generate a unique SKU like: PROD-' + Date.now())
        } else {
            console.log('\nOption 1: Use a DIFFERENT SKU')
            console.log('  The SKU "asdasdasd" was likely used before and deleted')
            console.log('  Generate a unique SKU like: PROD-' + Date.now())
            console.log('  Or use a meaningful SKU like: PHONE-IP15-BLK-128GB')
        }

        process.exit(0)
    } catch (err) {
        console.error('Error:', err)
        process.exit(1)
    }
}

analyzeIssue()
