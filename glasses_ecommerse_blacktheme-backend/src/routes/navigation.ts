import express from 'express'
import { Category } from '../models/Category'
import { Brand } from '../models/Brand'

const router = express.Router()

// Get navigation structure for header mega menu
router.get('/navigation', async (req, res) => {
    try {
        // Get all categories
        const allCategories = await Category.find().lean()

        // Get all brands
        const allBrands = await Brand.find().lean()

        // Get custom navigation config
        const { Setting } = await import('../models/Setting')
        const navConfig = await Setting.findOne({ key: 'navigation_config' }).lean()

        // Build hierarchical structure
        const mainCategories = allCategories.filter(cat => cat.level === 'main')

        const navigation = mainCategories.map(mainCat => {
            // Get subcategories (e.g., Men, Women, Kids)
            const subCategories = allCategories.filter(
                cat => cat.level === 'sub' && cat.parentId?.toString() === mainCat._id.toString()
            )

            // For each subcategory, get sub-subcategories
            const subCategoriesWithChildren = subCategories.map(subCat => {
                const subSubCategories = allCategories.filter(
                    cat => cat.level === 'subsub' && cat.parentId?.toString() === subCat._id.toString()
                )

                return {
                    _id: subCat._id,
                    name: subCat.name,
                    slug: subCat.slug,
                    subcategories: subSubCategories.map(ssc => ({
                        _id: ssc._id,
                        name: ssc.name,
                        slug: ssc.slug,
                    }))
                }
            })

            return {
                _id: mainCat._id,
                name: mainCat.name,
                slug: mainCat.slug,
                description: mainCat.description,
                subcategories: subCategoriesWithChildren
            }
        })

        res.json({
            categories: navigation,
            brands: allBrands.map(b => ({
                _id: b._id,
                name: b.name,
                slug: b.slug
            })),
            navConfig: navConfig?.value || {}
        })
    } catch (error) {
        console.error('Error fetching navigation:', error)
        res.status(500).json({ error: 'Failed to fetch navigation data' })
    }
})

export default router
