import express from 'express'
import { Category } from '../models/Category'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { Types } from 'mongoose'

const router = express.Router()

// Helper function to auto-repair category hierarchy and naming errors in DB
async function ensureCleanCategoryStructure() {
  try {
    // 1. Ensure Accessories main category (slug: 'accessories') has name 'Accessories'
    const accCat = await Category.findOne({ slug: 'accessories' })
    if (accCat && (accCat.name.includes('EYEGLASSES') || accCat.name !== 'Accessories')) {
      accCat.name = 'Accessories'
      accCat.level = 'main'
      accCat.parentId = null
      await accCat.save()
    }

    // 2. Ensure Eyeglasses main category exists with slug 'eyeglasses'
    let eyeglassCat = await Category.findOne({ slug: 'eyeglasses', level: 'main' })
    if (!eyeglassCat) {
      eyeglassCat = await Category.findOne({ slug: 'eyeglasses' })
      if (eyeglassCat) {
        eyeglassCat.name = 'Eyeglasses'
        eyeglassCat.level = 'main'
        eyeglassCat.parentId = null
        await eyeglassCat.save()
      } else {
        eyeglassCat = new Category({
          name: 'Eyeglasses',
          slug: 'eyeglasses',
          level: 'main',
          parentId: null,
          allowLensSelection: true,
          showFrameDetails: true
        })
        await eyeglassCat.save()
      }
    }

    // 3. Ensure Men, Women, Kids subcategories for Eyeglasses point to Eyeglasses main category
    if (eyeglassCat) {
      await Category.updateMany(
        { slug: { $in: ['men-eyeglasses', 'women-eyeglasses', 'kids-eyeglasses'] } },
        { $set: { parentId: eyeglassCat._id, level: 'sub' } }
      )
    }

    // 4. Ensure Eyewear Cases, Cleaning Kits, Chains & Straps point to Accessories main category
    if (accCat) {
      await Category.updateMany(
        { slug: { $in: ['eyewear-cases', 'cleaning-kits', 'chains-straps'] } },
        { $set: { parentId: accCat._id, level: 'sub' } }
      )
    }

    // 5. Remove orphan test categories
    await Category.deleteMany({
      slug: { $in: ['sunglasses-', 'eyeglass'] }
    })

    // 6. Re-assign any glasses products miscategorized under Accessories back to Eyeglasses
    if (accCat && eyeglassCat) {
      const { Product } = require('../models/Product')
      await Product.updateMany(
        {
          category: accCat._id,
          title: { $regex: /glasses|clubmaster|cateye|aviator|wayfarer/i }
        },
        {
          $set: { category: eyeglassCat._id }
        }
      )
    }
  } catch (err) {
    console.error('Error ensuring category structure:', err)
  }
}

// Get all categories with hierarchy
router.get('/', async (req, res) => {
  try {
    await ensureCleanCategoryStructure()
    const cats = await Category.find().populate('parentId').lean()
    res.json(cats)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get hierarchical category structure (nested)
router.get('/hierarchy', async (req, res) => {
  try {
    await ensureCleanCategoryStructure()
    const allCategories = await Category.find().lean()

    // Build hierarchical structure
    const mainCategories = allCategories.filter(cat => cat.level === 'main')

    const hierarchy = mainCategories.map(mainCat => {
      const subCategories = allCategories.filter(
        cat => cat.level === 'sub' && cat.parentId?.toString() === mainCat._id.toString()
      )

      const subCategoriesWithChildren = subCategories.map(subCat => {
        const subSubCategories = allCategories.filter(
          cat => cat.level === 'subsub' && cat.parentId?.toString() === subCat._id.toString()
        )

        return {
          ...subCat,
          subcategories: subSubCategories
        }
      })

      return {
        ...mainCat,
        subcategories: subCategoriesWithChildren
      }
    })

    res.json({ categories: hierarchy })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hierarchy' })
  }
})

// Get categories by level
router.get('/by-level/:level', async (req, res) => {
  try {
    const { level } = req.params
    if (!['main', 'sub', 'subsub'].includes(level)) {
      return res.status(400).json({ error: 'Invalid level' })
    }

    const cats = await Category.find({ level }).lean()
    res.json({ categories: cats })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Get main categories only
router.get('/main', async (req, res) => {
  try {
    const cats = await Category.find({ level: 'main' }).lean()
    res.json(cats)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Get children categories by parent ID
router.get('/children/:parentId', async (req, res) => {
  try {
    const cats = await Category.find({ parentId: req.params.parentId }).lean()
    res.json({ categories: cats })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch children' })
  }
})

// Get subcategories by parent ID (legacy endpoint)
router.get('/parent/:parentId', async (req, res) => {
  try {
    const cats = await Category.find({ parentId: req.params.parentId }).lean()
    res.json(cats)
  } catch (error: any) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid parent ID format' })
    }
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Create category with validation
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, parentId, level, slug, description, allowLensSelection, showFrameDetails, image, icon } = req.body

    if (!name) return res.status(400).json({ error: 'Missing name' })
    if (!level) return res.status(400).json({ error: 'Missing level' })

    // Validate level
    if (!['main', 'sub', 'subsub'].includes(level)) {
      return res.status(400).json({ error: 'Invalid level. Must be main, sub, or subsub' })
    }

    // Validate parent for sub and subsub levels
    if (level === 'sub' || level === 'subsub') {
      if (!parentId) {
        return res.status(400).json({ error: `Parent category required for ${level} level` })
      }

      const parent = await Category.findById(parentId)
      if (!parent) {
        return res.status(400).json({ error: 'Parent category not found' })
      }

      // Validate parent level
      if (level === 'sub' && parent.level !== 'main') {
        return res.status(400).json({ error: 'Sub categories must have a main category as parent' })
      }
      if (level === 'subsub' && parent.level !== 'sub') {
        return res.status(400).json({ error: 'Sub-sub categories must have a sub category as parent' })
      }
    }

    // Main level should not have parent
    if (level === 'main' && parentId) {
      return res.status(400).json({ error: 'Main categories cannot have a parent' })
    }

    // Check for duplicate slug
    const existingSlug = await Category.findOne({ slug: slug || name.toLowerCase().replace(/\s+/g, '-') })
    if (existingSlug) {
      return res.status(400).json({ error: 'Slug already exists. Please use a unique slug.' })
    }

    const cat = new Category({
      name,
      parentId: parentId || null,
      level,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      allowLensSelection: allowLensSelection || false,
      showFrameDetails: showFrameDetails || false,
      image,
      icon
    })

    await cat.save()
    res.json(cat)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create category' })
  }
})

// Update category with validation
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, parentId, level, slug, description, allowLensSelection, showFrameDetails, image, icon } = req.body
    const categoryId = req.params.id

    const category = await Category.findById(categoryId)
    if (!category) return res.status(404).json({ error: 'Category not found' })

    // Validate level if being changed
    if (level && !['main', 'sub', 'subsub'].includes(level)) {
      return res.status(400).json({ error: 'Invalid level' })
    }

    // Prevent circular reference
    if (parentId) {
      if (parentId === categoryId) {
        return res.status(400).json({ error: 'Category cannot be its own parent' })
      }

      // Check if new parent is a descendant
      const isDescendant = async (potentialParentId: string, ancestorId: string): Promise<boolean> => {
        const potentialParent = await Category.findById(potentialParentId)
        if (!potentialParent || !potentialParent.parentId) return false
        if (potentialParent.parentId.toString() === ancestorId) return true
        return isDescendant(potentialParent.parentId.toString(), ancestorId)
      }

      if (await isDescendant(parentId, categoryId)) {
        return res.status(400).json({ error: 'Cannot set a descendant as parent (circular reference)' })
      }

      // Validate parent level
      const newLevel = level || category.level
      const parent = await Category.findById(parentId)
      if (!parent) {
        return res.status(400).json({ error: 'Parent category not found' })
      }

      if (newLevel === 'sub' && parent.level !== 'main') {
        return res.status(400).json({ error: 'Sub categories must have a main category as parent' })
      }
      if (newLevel === 'subsub' && parent.level !== 'sub') {
        return res.status(400).json({ error: 'Sub-sub categories must have a sub category as parent' })
      }
    }

    // Check for duplicate slug if slug is being changed
    if (slug && slug !== category.slug) {
      const existingSlug = await Category.findOne({ slug, _id: { $ne: categoryId } })
      if (existingSlug) {
        return res.status(400).json({ error: 'Slug already exists' })
      }
    }

    const updated = await Category.findByIdAndUpdate(
      categoryId,
      { 
        name, 
        parentId: parentId || null, 
        level, 
        slug, 
        description, 
        allowLensSelection, 
        showFrameDetails, 
        image, 
        icon 
      },
      { new: true, runValidators: true }
    )

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update category' })
  }
})

// Delete category with cascade option
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { cascade } = req.query
    const categoryId = req.params.id

    // Check if category has children
    const children = await Category.find({ parentId: categoryId })

    if (children.length > 0 && cascade !== 'true') {
      return res.status(400).json({
        error: 'Category has children. Use cascade=true to delete all children.',
        childrenCount: children.length
      })
    }

    // Cascade delete
    if (cascade === 'true') {
      // Delete all descendants recursively
      const deleteDescendants = async (parentId: string) => {
        const children = await Category.find({ parentId })
        for (const child of children) {
          await deleteDescendants(child._id.toString())
          await Category.findByIdAndDelete(child._id)
        }
      }

      await deleteDescendants(categoryId)
    }

    await Category.findByIdAndDelete(categoryId)
    res.json({ ok: true, message: 'Category deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete category' })
  }
})

export default router
