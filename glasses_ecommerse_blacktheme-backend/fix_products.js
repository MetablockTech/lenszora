import fs from 'fs'

// Read the seed file
let content = fs.readFileSync('seed_multivendor.ts', 'utf8')

// Add sku and unit fields after vendorId for products that don't have them
// This regex finds product objects and adds sku and unit if they're missing
content = content.replace(
    /(vendorId:\s*\w+\._id,)\s*\n(\s*)(variations:)/g,
    `$1\n$2sku: 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase(),\n$2unit: 'piece',\n$2$3`
)

// Write back
fs.writeFileSync('seed_multivendor.ts', content, 'utf8')

console.log('Added sku and unit fields to products')
