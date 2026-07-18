/**
 * Generate a unique SKU for products
 * Format: PROD-{timestamp}-{random}
 * Example: PROD-1736413200-A7B9
 */
export function generateUniqueSKU(): string {
    const timestamp = Date.now()
    const randomString = generateRandomString(4)
    return `PROD-${timestamp}-${randomString}`
}

/**
 * Generate a random alphanumeric string
 * @param length - Length of the random string
 */
function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/**
 * Generate a variant SKU based on the base product SKU
 * Format: {baseSKU}-VAR-{index}
 * Example: PROD-1736413200-A7B9-VAR-1
 */
export function generateVariantSKU(baseSKU: string, index: number): string {
    return `${baseSKU}-VAR-${index + 1}`
}
