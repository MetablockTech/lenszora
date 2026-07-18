import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// Helper to sanitize filename
const sanitizeFilename = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req: any, file, cb) => {
        const { folder = 'others', subfolder = '' } = req.body
        const baseDir = path.join(__dirname, '../../uploads')
        const targetDir = path.join(baseDir, folder, subfolder)

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }
        cb(null, targetDir)
    },
    filename: (req: any, file, cb) => {
        const { filename: customName } = req.body
        const ext = path.extname(file.originalname).toLowerCase()
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E4)

        if (customName) {
            cb(null, `${sanitizeFilename(customName)}-${uniqueSuffix}${ext}`)
        } else {
            const originalBase = path.parse(file.originalname).name
            cb(null, `${sanitizeFilename(originalBase)}-${uniqueSuffix}${ext}`)
        }
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|svg/
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = allowedTypes.test(file.mimetype)
        if (extname && mimetype) {
            return cb(null, true)
        }
        cb(new Error('Only images (jpeg, jpg, png, webp, svg) are allowed'))
    }
})

// Unified Upload Endpoint
router.post('/', requireAuth, upload.single('file'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' })
        }

        const { folder = 'others', subfolder = '' } = req.body
        const publicPath = `/uploads/${folder}/${subfolder ? subfolder + '/' : ''}${req.file.filename}`

        res.json({
            url: publicPath,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// Gallery API: List images recursively
router.get('/gallery', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const baseDir = path.join(__dirname, '../../uploads')
        if (!fs.existsSync(baseDir)) {
            return res.json({ folders: [], files: [] })
        }

        const isAdmin = req.user?.role === 'admin'
        const vendorId = req.user?.vendorId || req.user?.id

        const getFilesRecursive = (dir: string, relPath = ''): any => {
            const items = fs.readdirSync(dir, { withFileTypes: true })
            const result: any = { name: path.basename(dir), path: relPath, children: [] }

            for (const item of items) {
                const itemRelPath = path.join(relPath, item.name)
                if (item.isDirectory()) {
                    // Security: Vendors can only see their own folder in the vendors root
                    if (relPath === 'vendors' && !isAdmin && item.name !== vendorId) continue
                    result.children.push(getFilesRecursive(path.join(dir, item.name), itemRelPath))
                } else if (item.isFile()) {
                    result.children.push({
                        name: item.name,
                        path: `/uploads/${itemRelPath.replace(/\\/g, '/')}`,
                        size: fs.statSync(path.join(dir, item.name)).size
                    })
                }
            }
            return result
        }

        const gallery = getFilesRecursive(baseDir)
        res.json(gallery)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

// Cleanup API: Remove file
router.delete('/file', requireAuth, (req: AuthRequest, res: Response) => {
    try {
        const { filePath } = req.body // e.g., /uploads/products/image.jpg
        if (!filePath) return res.status(400).json({ message: 'No file path provided' })

        // Security: Ensure the path is within the uploads directory and user has permission
        const relativePath = filePath.replace(/^\/uploads\//, '').replace(/\//g, path.sep)
        const fullPath = path.join(__dirname, '../../uploads', relativePath)

        if (!fullPath.startsWith(path.join(__dirname, '../../uploads'))) {
            return res.status(403).json({ message: 'Forbidden' })
        }

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ message: 'File not found' })
        }

        // Security: Vendors can only delete files in their own subfolder
        if (req.user?.role === 'vendor') {
            const vendorFolder = path.join('vendors', req.user!.vendorId || req.user!.id)
            if (!relativePath.startsWith(vendorFolder)) {
                return res.status(403).json({ message: 'Forbidden: You do not own this file' })
            }
        }

        fs.unlinkSync(fullPath)
        res.json({ message: 'File deleted successfully' })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
})

export default router
