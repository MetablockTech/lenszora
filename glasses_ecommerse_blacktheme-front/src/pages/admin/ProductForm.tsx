import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus, Save, Trash2, X, ImageIcon, Sparkles, Layers, Check, Zap, Shield, Eye, Waves, Sun, Droplets, Award, ShieldCheck, ShieldAlert } from 'lucide-react'
import { categories, brands, products, vendors, getUser, eyewearAttributes as eyewearAttributesAPI, lens } from '@/lib/api'
import { getToken, getImageUrl, cn } from '@/lib/utils'
import { generateUniqueSKU, generateVariantSKU } from '@/lib/generateSKU'
const productSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    productType: z.enum(['physical', 'digital']).default('physical'),
    category: z.string().min(1, 'Category is required'),
    brand: z.string().min(1, 'Brand is required'),
    sku: z.string().min(1, 'SKU is required'),
    unit: z.string().min(1, 'Unit is required'),
    searchTags: z.array(z.string()).default([]),
    price: z.coerce.number().min(0, 'Price must be positive'),
    minOrderQuantity: z.coerce.number().min(1, 'MOQ must be at least 1').default(1),
    stock: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
    discountAmount: z.coerce.number().min(0).default(0),
    discountType: z.enum(['flat', 'percent']).default('flat'),
    shippingCost: z.coerce.number().min(0).default(0),
    shippingCostMultiply: z.boolean().default(false),
    status: z.enum(['active', 'inactive']).default('active'),
    isFeatured: z.boolean().default(false),
    isBulk: z.boolean().default(false),
    colors: z.array(z.string()).default([]),
    attributes: z.array(z.object({
        name: z.string().min(1, 'Name required'),
        values: z.array(z.string()).min(1, 'At least one value required')
    })).default([]),
    hasVariants: z.boolean().default(false),
    variants: z.array(z.object({
        sku: z.string().min(1, 'SKU required'),
        price: z.coerce.number().min(0, 'Price must be positive'),
        stock: z.coerce.number().min(0, 'Stock cannot be negative'),
        images: z.array(z.string()).default([]),
        variantValues: z.record(z.string()).default({}),
        isDefault: z.boolean().default(false)
    })).default([]),
    thumbnail: z.string().min(1, 'Thumbnail is required'),
    images: z.array(z.string()).default([]),
    vendorId: z.string().optional(),
    eyewearDetails: z.object({
        frameType: z.string().optional(),
        frameShape: z.string().optional(),
        frameMaterial: z.string().optional(),
        frameSize: z.string().optional(),
        frameWidth: z.string().optional(),
        frameDimensions: z.string().optional(),
        frameColor: z.string().optional(),
        glassColor: z.string().optional(),
        weight: z.string().optional(),
        weightGroup: z.string().optional(),
        countryOfOrigin: z.string().optional(),
        modelNo: z.string().optional(),
        prescriptionAvailable: z.boolean().default(false),
        gender: z.string().optional(),
        faceShape: z.array(z.string()).default([]),
        uvProtection: z.string().optional(),
        polarized: z.boolean().default(false),
        features: z.array(z.string()).default([])
    }).optional(),
    returnPolicy: z.object({
        allowReturns: z.boolean().default(true),
        allowRefunds: z.boolean().default(true),
        returnPeriodDays: z.coerce.number().min(0).default(14),
        policyText: z.string().optional()
    }).default({}),
    lensSettings: z.object({
        allowLensSelection: z.boolean().default(false),
        useVendorLenses: z.boolean().default(false),
        lensTypes: z.array(z.object({
            lensTypeId: z.string(),
            active: z.boolean().default(false),
            skipPackages: z.boolean().default(false),
            packages: z.array(z.object({
                name: z.string().min(1, 'Name is required'),
                price: z.coerce.number().min(0),
                mrp: z.coerce.number().optional().default(0),
                discountAmount: z.coerce.number().min(0).default(0),
                discountType: z.enum(['flat', 'percent']).default('flat'),
                description: z.string().optional(),
                features: z.array(z.string()).default([]),
                detailedFeatures: z.array(z.object({
                    title: z.string().min(1, 'Title is required'),
                    description: z.string().optional(),
                    image: z.string().optional(),
                    icon: z.string().optional()
                })).default([]),
                benefits: z.array(z.string()).default([]),
                imageUrl: z.string().optional(),
                warranty: z.string().optional().default('6 Months'),
                indexLabel: z.string().optional().default('1.56')
            })).default([])
        })).default([]),
        directLensOptions: z.array(z.object({
            name: z.string().min(1, 'Name is required'),
            price: z.coerce.number().min(0, 'Price must be positive'),
            description: z.string().optional()
        })).default([])
    }).default({})
})

type ProductFormValues = z.infer<typeof productSchema>

const UNITS = ['kg', 'pc', 'gms', 'ltrs', 'pair', 'oz', 'lb']

const ProductForm = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const token = getToken()
    const isEdit = !!id

    const [loading, setLoading] = useState(false)
    const [allCats, setAllCats] = useState<any[]>([])
    const [mainCats, setMainCats] = useState<any[]>([])
    const [subCats, setSubCats] = useState<any[]>([])
    const [subSubCats, setSubSubCats] = useState<any[]>([])

    const [selectedMain, setSelectedMain] = useState('')
    const [selectedSub, setSelectedSub] = useState('')
    const [selectedSubSub, setSelectedSubSub] = useState('')

    const [brs, setBrs] = useState<any[]>([])
    const [tagInput, setTagInput] = useState('')
    const [uploading, setUploading] = useState(false)
    const [variantsGenerated, setVariantsGenerated] = useState(false)
    const [dynamicAttributes, setDynamicAttributes] = useState<any[]>([])
    const [vendorLensTypes, setVendorLensTypes] = useState<any[]>([])
    const [allVendors, setAllVendors] = useState<any[]>([])

    const currentUser = getUser()
    const isAdmin = currentUser?.role === 'admin'
    const isVendor = currentUser?.role === 'vendor'
    const pathPrefix = isAdmin ? '/admin' : '/vendor'

    const [activeLensTab, setActiveLensTab] = useState<string | null>(null)
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({})
    const [toDeleteUrls, setToDeleteUrls] = useState<string[]>([])

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            title: '',
            description: '',
            productType: 'physical',
            category: '',
            brand: '',
            sku: '',
            unit: 'pc',
            searchTags: [],
            price: 0,
            minOrderQuantity: 1,
            stock: 0,
            discountAmount: 0,
            discountType: 'flat',
            shippingCost: 0,
            shippingCostMultiply: false,
            status: 'active',
            isFeatured: false,
            isBulk: false,
            colors: [],
            attributes: [],
            hasVariants: false,
            variants: [],
            thumbnail: '',
            images: [],
            vendorId: '',
            eyewearDetails: {
                frameShape: '',
                frameMaterial: '',
                prescriptionAvailable: false,
                gender: '',
                faceShape: [],
                uvProtection: '',
                polarized: false,
                features: []
            },
            returnPolicy: {
                allowReturns: true,
                allowRefunds: true,
                returnPeriodDays: 14,
                policyText: ''
            },
            lensSettings: {
                allowLensSelection: false,
                useVendorLenses: true,
                lensTypes: [],
                directLensOptions: []
            }
        }
    })

    const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray({
        control: form.control,
        name: 'attributes'
    })

    const { fields: variantFields, append: appendVariant, remove: removeVariant, update: updateVariant } = useFieldArray({
        control: form.control,
        name: 'variants'
    })

    const { fields: lensTypeFields, append: appendLensType, remove: removeLensType } = useFieldArray({
        control: form.control,
        name: 'lensSettings.lensTypes'
    })

    const { fields: lensFields, append: appendLens, remove: removeLens } = useFieldArray({
        control: form.control,
        name: 'lensSettings.directLensOptions'
    })

    // Watch value for reactive sections
    const watchedCategory = useWatch({
        control: form.control,
        name: 'category'
    })

    useEffect(() => {
        loadData()
    }, [])

    const setNestedValue = (obj: any, path: string, value: any) => {
        const parts = path.split('.')
        let current = obj
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i]
            const index = parseInt(part)
            if (!isNaN(index)) {
                if (!current[index]) current[index] = {}
                current = current[index]
            } else {
                if (!current[part]) current[part] = {}
                current = current[part]
            }
        }
        const lastPart = parts[parts.length - 1]
        const lastIndex = parseInt(lastPart)
        if (!isNaN(lastIndex)) {
            current[lastIndex] = value
        } else {
            current[lastPart] = value
        }
    }

    async function loadData() {
        try {
            const [c, b, v, attr, lensTypes] = await Promise.all([
                categories.list(),
                brands.list(),
                isAdmin ? vendors.list(token) : Promise.resolve([]),
                eyewearAttributesAPI.list(),
                isAdmin ? lens.listAdminTypes(token) : lens.listAdminTypes(token)
            ])

            setAllCats(c)
            setMainCats(c.filter((cat: any) => cat.level === 'main' || !cat.parentId))
            setBrs(b)
            setAllVendors(v)
            setDynamicAttributes(attr)
            setVendorLensTypes(lensTypes)

            if (isEdit && token) {
                const product = await products.get(id)
                const prodCatId = product.category?._id || product.category

                // Find category hierarchy
                const currentCat = c.find((cat: any) => cat._id === prodCatId)
                if (currentCat) {
                    if (currentCat.level === 'subsub') {
                        const subCat = c.find((cat: any) => cat._id === (currentCat.parentId?._id || currentCat.parentId))
                        const mainCat = subCat ? c.find((cat: any) => cat._id === (subCat.parentId?._id || subCat.parentId)) : null

                        setSelectedMain(mainCat?._id || '')
                        setSelectedSub(subCat?._id || '')
                        setSelectedSubSub(currentCat._id)

                        if (mainCat) setSubCats(c.filter((cat: any) => (cat.parentId?._id || cat.parentId) === mainCat._id))
                        if (subCat) setSubSubCats(c.filter((cat: any) => (cat.parentId?._id || cat.parentId) === subCat._id))
                    } else if (currentCat.level === 'sub') {
                        const mainCat = c.find((cat: any) => cat._id === (currentCat.parentId?._id || currentCat.parentId))

                        setSelectedMain(mainCat?._id || '')
                        setSelectedSub(currentCat._id)

                        if (mainCat) setSubCats(c.filter((cat: any) => (cat.parentId?._id || cat.parentId) === mainCat._id))
                        setSubSubCats(c.filter((cat: any) => (cat.parentId?._id || cat.parentId) === currentCat._id))
                    } else {
                        setSelectedMain(currentCat._id)
                        setSubCats(c.filter((cat: any) => (cat.parentId?._id || cat.parentId) === currentCat._id))
                    }
                }
                // Transform data to match form values - providing defaults for required fields
                form.reset({
                    ...product,
                    title: product.title || 'Untitled Product',
                    description: product.description || 'No description available',
                    sku: product.sku || `SKU-${Date.now()}`,
                    unit: product.unit || 'pc',
                    thumbnail: product.thumbnail || '',
                    category: prodCatId || '',
                    brand: (product.brand?._id || product.brand) || '',
                    vendorId: (product.vendorId?._id || product.vendorId) || '',
                    searchTags: product.searchTags || [],
                    colors: product.colors || [],
                    attributes: (product.attributes || []).map((attr: any) => ({
                        ...attr,
                        name: attr.name || 'New Attribute',
                        values: attr.values?.length ? attr.values : ['Default']
                    })),
                    images: product.images || [],
                    price: Number(product.price) || 0,
                    stock: Number(product.stock) || 0,
                    eyewearDetails: {
                        frameShape: product.eyewearDetails?.frameShape || '',
                        frameMaterial: product.eyewearDetails?.frameMaterial || '',
                        frameType: product.eyewearDetails?.frameType || '',
                        frameSize: product.eyewearDetails?.frameSize || '',
                        frameWidth: product.eyewearDetails?.frameWidth || '',
                        frameDimensions: product.eyewearDetails?.frameDimensions || '',
                        frameColor: product.eyewearDetails?.frameColor || '',
                        glassColor: product.eyewearDetails?.glassColor || '',
                        weight: product.eyewearDetails?.weight || '',
                        weightGroup: product.eyewearDetails?.weightGroup || '',
                        countryOfOrigin: product.eyewearDetails?.countryOfOrigin || '',
                        modelNo: product.eyewearDetails?.modelNo || '',
                        prescriptionAvailable: product.eyewearDetails?.prescriptionAvailable || false,
                        gender: product.eyewearDetails?.gender || '',
                        faceShape: product.eyewearDetails?.faceShape || [],
                        uvProtection: product.eyewearDetails?.uvProtection || '',
                        polarized: product.eyewearDetails?.polarized || false,
                        features: product.eyewearDetails?.features || []
                    },
                    lensSettings: {
                        allowLensSelection: product.lensSettings?.allowLensSelection || false,
                        useVendorLenses: product.lensSettings?.useVendorLenses || false,
                        lensTypes: (product.lensSettings?.lensTypes || []).map((lt: any) => ({
                            ...lt,
                            lensTypeId: lt.lensTypeId?._id || lt.lensTypeId || '',
                            packages: (lt.packages || []).map((pkg: any) => ({
                                ...pkg,
                                name: pkg.name || 'Standard Package',
                                price: Number(pkg.price) || 0,
                                mrp: Number(pkg.mrp) || (Number(pkg.price) || 0) + 1000,
                                description: pkg.description || '',
                                features: pkg.features || [],
                                detailedFeatures: (pkg.detailedFeatures || []).map((f: any) => ({
                                    ...f,
                                    title: f.title || 'Tech Feature',
                                })),
                                benefits: pkg.benefits || [],
                                warranty: pkg.warranty || '6 Months',
                                indexLabel: pkg.indexLabel || '1.56'
                            })),
                            skipPackages: lt.skipPackages || false,
                        })),
                        directLensOptions: (product.lensSettings?.directLensOptions || []).map((opt: any) => ({
                            ...opt,
                            name: opt.name || 'New Option',
                            price: Number(opt.price) || 0
                        }))
                    },
                    returnPolicy: product.returnPolicy || {
                        allowReturns: true,
                        allowRefunds: true,
                        returnPeriodDays: 14,
                        policyText: ''
                    },
                    isBulk: product.isBulk || false,
                    variants: (product.variants || []).map((v: any) => ({
                        ...v,
                        sku: v.sku || `V-${Date.now()}`,
                        price: Number(v.price) || 0,
                        stock: Number(v.stock) || 0
                    }))
                })
            } else {
                // Auto-generate SKU for new products
                form.setValue('sku', generateUniqueSKU())

                // Check if we are creating a bulk product via query param
                const params = new URLSearchParams(window.location.search)
                if (params.get('bulk') === 'true') {
                    form.setValue('isBulk', true)
                }
            }
        } catch (error) {
            console.error(error)
            toast({ title: 'Error loading data', variant: 'destructive' })
        }
    }

    async function onSubmit(data: ProductFormValues) {
        setLoading(true)
        try {
            const finalData = JSON.parse(JSON.stringify(data))

            // Clean up comma-separated arrays (trim and filter)
            const cleanArr = (arr: string[]) => arr?.map(v => v.trim()).filter(Boolean) || []

            if (finalData.eyewearDetails?.features) {
                finalData.eyewearDetails.features = cleanArr(finalData.eyewearDetails.features)
            }

            if (finalData.attributes) {
                finalData.attributes.forEach((attr: any) => {
                    attr.values = cleanArr(attr.values)
                })
            }

            if (finalData.lensSettings?.lensTypes) {
                finalData.lensSettings.lensTypes.forEach((type: any) => {
                    type.packages.forEach((pkg: any) => {
                        pkg.features = cleanArr(pkg.features)
                    })
                })
            }

            // 1. Upload all pending files
            const vId = (isAdmin && data.vendorId ? data.vendorId : null) || currentUser?.vendorId || currentUser?.id
            if (!vId) throw new Error('Vendor ID is required for image naming')
            if (isAdmin && !finalData.vendorId) {
                finalData.vendorId = currentUser?.vendorId || currentUser?.id
            }

            const subfolder = `vendor_${vId}`

            for (const [path, file] of Object.entries(pendingFiles)) {
                // Ensure the path in pendingFiles refers to the current form state mapping
                const fieldName = path.replace(/\./g, '-').replace(/\//g, '-')
                const descriptiveName = `${data.title}-${fieldName}`

                try {
                    const res = await products.uploadImage(file, 'products', subfolder, descriptiveName, token!)
                    setNestedValue(finalData, path, res.url)
                } catch (err) {
                    console.error(`Failed to upload ${path}:`, err)
                    throw new Error(`Failed to upload ${file.name}`)
                }
            }

            // 2. Save product
            if (isEdit) {
                await products.update(id, finalData, token!)
                toast({ title: 'Product updated successfully', className: 'bg-green-600 text-white border-none' })
            } else {
                await products.create(finalData, token!)
                toast({ title: 'Product created successfully', className: 'bg-green-600 text-white border-none' })
            }

            // 3. Cleanup: Delete images marked for removal
            for (const url of toDeleteUrls) {
                try {
                    await products.deleteFile(url, token!)
                } catch (e) {
                    console.error('Failed to delete old image:', url, e)
                }
            }

            // Success! Clear managed states
            setPendingFiles({})
            setToDeleteUrls([])

            navigate(`${pathPrefix}/products`)
        } catch (error: any) {
            console.error('Submit error:', error)
            toast({
                title: 'Error saving product',
                description: error.message || 'Something went wrong',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: string) {
        const files = e.target.files
        if (!files || files.length === 0) return

        if (field === 'thumbnail') {
            const file = files[0]
            const previewUrl = URL.createObjectURL(file)

            const oldUrl = form.getValues('thumbnail')
            if (oldUrl && oldUrl.startsWith('/uploads')) {
                setToDeleteUrls(prev => [...prev, oldUrl])
            }

            form.setValue('thumbnail', previewUrl)
            setPendingFiles(prev => ({ ...prev, thumbnail: file }))
        } else if (field === 'images') {
            const newPreviews: string[] = []
            const currentImages = form.getValues('images') || []

            Array.from(files).forEach((file, i) => {
                const previewUrl = URL.createObjectURL(file)
                const path = `images.${currentImages.length + i}`
                newPreviews.push(previewUrl)
                setPendingFiles(prev => ({ ...prev, [path]: file }))
            })

            form.setValue('images', [...currentImages, ...newPreviews])
        } else {
            // Generic path for nested features or package images
            const file = files[0]
            const previewUrl = URL.createObjectURL(file)

            const oldUrl = form.getValues(field as any)
            if (oldUrl && oldUrl.startsWith('/uploads')) {
                setToDeleteUrls(prev => [...prev, oldUrl])
            }

            form.setValue(field as any, previewUrl)
            setPendingFiles(prev => ({ ...prev, [field]: file }))
        }
        e.target.value = ''
    }

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            const current = form.getValues('searchTags')
            if (!current.includes(tagInput.trim())) {
                form.setValue('searchTags', [...current, tagInput.trim()])
            }
            setTagInput('')
        }
    }

    const removeTag = (tag: string) => {
        const current = form.getValues('searchTags')
        form.setValue('searchTags', current.filter(t => t !== tag))
    }

    const generateVariants = () => {
        const colors = form.getValues('colors')
        const attributes = form.getValues('attributes')
        const baseSku = form.getValues('sku')
        const basePrice = form.getValues('price')

        if (colors.length === 0 && attributes.length === 0) {
            toast({ title: 'Please select colors or add attributes first', variant: 'destructive' })
            return
        }

        const combinations: Array<Record<string, string>> = []

        if (colors.length > 0 && attributes.length === 0) {
            colors.forEach(color => combinations.push({ Color: color }))
        } else if (colors.length === 0 && attributes.length > 0) {
            const generateCombos = (attrs: typeof attributes, index: number, current: Record<string, string>) => {
                if (index === attrs.length) {
                    combinations.push({ ...current })
                    return
                }
                attrs[index].values.forEach(value => {
                    generateCombos(attrs, index + 1, { ...current, [attrs[index].name]: value })
                })
            }
            generateCombos(attributes, 0, {})
        } else {
            colors.forEach(color => {
                const generateCombos = (attrs: typeof attributes, index: number, current: Record<string, string>) => {
                    if (index === attrs.length) {
                        combinations.push({ ...current })
                        return
                    }
                    attrs[index].values.forEach(value => {
                        generateCombos(attrs, index + 1, { ...current, [attrs[index].name]: value })
                    })
                }
                generateCombos(attributes, 0, { Color: color })
            })
        }

        const newVariants = combinations.map((combo, index) => ({
            sku: generateVariantSKU(baseSku, index),
            price: basePrice,
            stock: 0,
            images: [],
            variantValues: combo,
            isDefault: index === 0
        }))

        form.setValue('variants', newVariants)
        form.setValue('hasVariants', true)
        setVariantsGenerated(true)
        toast({ title: `Generated ${newVariants.length} variants` })
    }

    const getSelectedCategory = () => {
        // Use either the watched form value or the manual selection states
        const catId = watchedCategory || selectedSubSub || selectedSub || selectedMain
        return allCats.find((c: any) => c._id === catId)
    }

    const showFrameDetails = () => {
        const cat = getSelectedCategory()
        return cat?.showFrameDetails ?? false
    }

    const showLensOptions = () => {
        const cat = getSelectedCategory()
        return cat?.allowLensSelection ?? false
    }

    function handleVariantImageUpload(e: React.ChangeEvent<HTMLInputElement>, variantIndex: number) {
        const files = e.target.files
        if (!files || files.length === 0) return

        const currentVariants = form.getValues('variants')
        const variant = currentVariants[variantIndex]
        const currentImages = variant.images || []

        const newPreviews: string[] = []
        Array.from(files).forEach((file, i) => {
            const previewUrl = URL.createObjectURL(file)
            const path = `variants.${variantIndex}.images.${currentImages.length + i}`
            newPreviews.push(previewUrl)
            setPendingFiles(prev => ({ ...prev, [path]: file }))
        })

        const updatedVariant = { ...variant }
        updatedVariant.images = [...currentImages, ...newPreviews]
        updateVariant(variantIndex, updatedVariant)
        e.target.value = ''
    }

    return (
        <div className="space-y-0">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                    console.error('Form Validation Errors:', errors)
                    toast({
                        title: "Validation Error",
                        description: "Please check all fields for required information.",
                        variant: "destructive",
                    })
                })} className="bg-slate-900 p-8 rounded-lg shadow-lg space-y-8 border border-slate-700">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-600 pb-2">Basic Information</h3>
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center">
                                        <FormLabel className="text-slate-300 font-bold uppercase text-[10px] tracking-wider">Product Name (EN) *</FormLabel>
                                        <FormMessage className="text-[9px] uppercase font-bold" />
                                    </div>
                                    <FormControl>
                                        <Input placeholder="Enter product name" {...field} className="bg-slate-800/50 border-slate-700 text-slate-200 h-10" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center">
                                        <FormLabel className="text-slate-300 font-bold uppercase text-[10px] tracking-wider">Description (EN) *</FormLabel>
                                        <FormMessage className="text-[9px] uppercase font-bold" />
                                    </div>
                                    <FormControl>
                                        <Textarea placeholder="Enter product description" className="min-h-[100px] bg-slate-800/50 border-slate-700 text-slate-200" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* General Setup Section */}
                    <div className="space-y-4 mt-8">
                        <div className="flex items-center gap-2 border-b border-slate-600 pb-2 mb-4">
                            <Zap className="h-4 w-4 text-indigo-400" />
                            <h3 className="text-lg font-semibold text-white">General Setup</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/20 p-4 rounded-xl border border-slate-800/40">
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Main Category *</FormLabel>
                                    <Select
                                        value={selectedMain || ""}
                                        onValueChange={(val) => {
                                            setSelectedMain(val)
                                            setSelectedSub('')
                                            setSelectedSubSub('')
                                            setSubCats(allCats.filter(c => (c.parentId?._id || c.parentId) === val))
                                            setSubSubCats([])
                                            form.setValue('category', val, { shouldValidate: true })
                                        }}
                                    >
                                        <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 h-9">
                                            <SelectValue placeholder="Select Main" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                            {mainCats.map((cat) => (
                                                <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>

                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Subcategory</FormLabel>
                                    <Select
                                        value={selectedSub || ""}
                                        disabled={!selectedMain}
                                        onValueChange={(val) => {
                                            setSelectedSub(val)
                                            setSelectedSubSub('')
                                            setSubSubCats(allCats.filter(c => (c.parentId?._id || c.parentId) === val))
                                            form.setValue('category', val || selectedMain, { shouldValidate: true })
                                        }}
                                    >
                                        <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 h-9">
                                            <SelectValue placeholder="Select Sub" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                            {subCats.map((cat) => (
                                                <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>

                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Child Level</FormLabel>
                                    <Select
                                        value={selectedSubSub || ""}
                                        disabled={!selectedSub || selectedSub === 'none'}
                                        onValueChange={(val) => {
                                            setSelectedSubSub(val)
                                            form.setValue('category', val === 'none' ? selectedSub : val, { shouldValidate: true })
                                        }}
                                    >
                                        <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 h-9">
                                            <SelectValue placeholder="Deep Level" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                            {subSubCats.map((cat) => (
                                                <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="brand"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <FormLabel className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Brand *</FormLabel>
                                                <FormMessage className="text-[8px] font-black uppercase text-red-500" />
                                            </div>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 h-9">
                                                        <SelectValue placeholder="Choose Brand" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                                    {brs.map((brand) => (
                                                        <SelectItem key={brand._id} value={brand._id}>{brand.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <FormLabel className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">System SKU *</FormLabel>
                                                <FormMessage className="text-[8px] font-black uppercase text-red-500" />
                                            </div>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input {...field} className="bg-slate-900 border-slate-800 text-slate-200 h-9 font-mono text-[11px] pr-16" />
                                                    <Button
                                                        type="button" variant="ghost" size="sm"
                                                        onClick={() => form.setValue('sku', generateUniqueSKU(), { shouldValidate: true })}
                                                        className="absolute right-0 top-0 h-9 text-[8px] font-black uppercase text-indigo-400 hover:text-indigo-300 px-2"
                                                    >Auto</Button>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {isAdmin && (
                                <FormField
                                    control={form.control}
                                    name="vendorId"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5 lg:col-span-2">
                                            <div className="flex justify-between items-center">
                                                <FormLabel className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Assign Vendor</FormLabel>
                                                <FormMessage className="text-[8px] font-black uppercase text-red-500" />
                                            </div>
                                            <Select onValueChange={(val) => field.onChange(val === 'admin_inhouse' ? '' : val)} value={field.value || "admin_inhouse"}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 h-9">
                                                        <SelectValue placeholder="Select Business Account" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                                    <SelectItem value="admin_inhouse">In-House / Admin (Store Owner)</SelectItem>
                                                    {allVendors.map((v) => (
                                                        <SelectItem key={v._id} value={v._id}>{v.businessName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <div className="flex gap-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700">

                            <FormField
                                control={form.control}
                                name="isFeatured"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-slate-200 cursor-pointer">Featured Product</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />



                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SKU *</FormLabel>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                <Input placeholder="PROD-001" {...field} className="bg-slate-800/50 border-slate-700 text-slate-200" />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => form.setValue('sku', generateUniqueSKU())}
                                                    title="Generate unique SKU"
                                                    className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white"
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="pc, kg, box" {...field} className="bg-slate-800/50 border-slate-700 text-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="searchTags"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Search Tags</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="Type and press Enter to add tags"
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={handleAddTag}
                                                    className="bg-slate-800/50 border-slate-700 text-slate-200"
                                                />
                                                <div className="flex flex-wrap gap-2">
                                                    {field.value.map((tag, index) => (
                                                        <div key={index} className="bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1 text-sm text-slate-200 border border-slate-700">
                                                            {tag}
                                                            <button type="button" onClick={() => removeTag(tag)} className="text-slate-500 hover:text-red-500">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>


                    {/* Frame Details Section */}
                    {showFrameDetails() && (
                        <div className="space-y-6 mt-10 p-6 rounded-xl bg-slate-900/40 border border-slate-800 shadow-inner">
                            <div className="flex items-center gap-2 border-b border-slate-700 pb-2 mb-6">
                                <div className="w-2 h-8 bg-blue-500 rounded-full" />
                                <h3 className="text-xl font-bold text-white font-playfair tracking-wide uppercase">1. Frame Details</h3>
                                <div className="h-[1px] flex-1 bg-slate-700 ml-4" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.frameType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Frame Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl><SelectTrigger className="bg-slate-800/50 border-slate-700"><SelectValue placeholder="e.g. Full Rim" /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                                    {dynamicAttributes.filter(a => a.type === 'frameType').map(s => (
                                                        <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                                                    ))}
                                                    {dynamicAttributes.filter(a => a.type === 'frameType').length === 0 && (
                                                        ['Full Rim', 'Half Rim', 'Rimless', 'Supra'].map(s => (
                                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.frameShape"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Frame Shape</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl><SelectTrigger className="bg-slate-800/50 border-slate-700"><SelectValue placeholder="Shape" /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                                    {dynamicAttributes.filter(a => a.type === 'frameShape').map(s => (
                                                        <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                                                    ))}
                                                    {dynamicAttributes.filter(a => a.type === 'frameShape').length === 0 && (
                                                        ['Geometric', 'Round', 'Square', 'Aviator', 'Cat-Eye', 'Wayfarer', 'Rectangle', 'Oval'].map(s => (
                                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.frameMaterial"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Frame Material</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl><SelectTrigger className="bg-slate-800/50 border-slate-700"><SelectValue placeholder="Material" /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                                    {dynamicAttributes.filter(a => a.type === 'frameMaterial').map(s => (
                                                        <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                                                    ))}
                                                    {dynamicAttributes.filter(a => a.type === 'frameMaterial').length === 0 && (
                                                        ['Stainless Steel', 'Plastic', 'Metal', 'Titanium', 'Acetate', 'TR90'].map(s => (
                                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.frameWidth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Frame Width</FormLabel>
                                            <FormControl><Input placeholder="e.g. 142 mm" {...field} className="bg-slate-800/50 border-slate-700 text-slate-200" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.frameDimensions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Frame Dimensions</FormLabel>
                                            <FormControl><Input placeholder="e.g. 53-23-147" {...field} className="bg-slate-800/50 border-slate-700 text-slate-200" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Weight</FormLabel>
                                            <FormControl><Input placeholder="e.g. 33 gm" {...field} className="bg-slate-800/50 border-slate-700 text-slate-200" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.weightGroup"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Weight Group</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl><SelectTrigger className="bg-slate-800/50 border-slate-700"><SelectValue placeholder="e.g. Average" /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                                    <SelectItem value="Feather Light">Feather Light</SelectItem>
                                                    <SelectItem value="Light">Light</SelectItem>
                                                    <SelectItem value="Average">Average</SelectItem>
                                                    <SelectItem value="Heavy">Heavy</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.countryOfOrigin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Country of Origin</FormLabel>
                                            <FormControl><Input placeholder="e.g. China" {...field} className="bg-slate-800/50 border-slate-700 text-slate-200" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.modelNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Model No.</FormLabel>
                                            <FormControl><Input placeholder="e.g. VC S15801" {...field} className="bg-slate-800/50 border-slate-700 text-slate-200" /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Target Gender</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl><SelectTrigger className="bg-slate-800/50 border-slate-700"><SelectValue placeholder="Gender" /></SelectTrigger></FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                                    <SelectItem value="Men">Men</SelectItem>
                                                    <SelectItem value="Women">Women</SelectItem>
                                                    <SelectItem value="Unisex">Unisex</SelectItem>
                                                    <SelectItem value="Kids">Kids</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Face Shape & Additional Features */}
                            <div className="mt-8 space-y-6">
                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.faceShape"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <div>
                                                <FormLabel className="text-slate-300">Suitable Face Shapes</FormLabel>
                                                <p className="text-[11px] text-slate-500 italic mt-1">Select all face shapes this frame is recommended for.</p>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                                {['Oval', 'Square', 'Round', 'Heart', 'Diamond', 'Oblong'].map((shape) => (
                                                    <div
                                                        key={shape}
                                                        onClick={() => {
                                                            const current = field.value || []
                                                            const newValue = current.includes(shape)
                                                                ? current.filter(v => v !== shape)
                                                                : [...current, shape]
                                                            field.onChange(newValue)
                                                        }}
                                                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${field.value?.includes(shape)
                                                            ? 'bg-blue-500/10 border-blue-500 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                                            : 'bg-slate-800/20 border-slate-700 text-slate-400 hover:border-slate-600'
                                                            }`}
                                                    >
                                                        <div className={`h-4 w-4 rounded-sm border shrink-0 flex items-center justify-center transition-all ${field.value?.includes(shape)
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'border-slate-600 bg-transparent'
                                                            }`}>
                                                            {field.value?.includes(shape) && <Check className="h-3 w-3" />}
                                                        </div>
                                                        <span className="text-sm font-medium">{shape}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </FormItem>
                                    )}
                                />


                                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 pt-4 border-t border-slate-800/50">
                                    <FormField
                                        control={form.control}
                                        name="eyewearDetails.prescriptionAvailable"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 rounded-lg border border-slate-700 bg-slate-800/10 mt-6">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="text-slate-300">Prescription Ready</FormLabel>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="eyewearDetails.features"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Additional Features</FormLabel>
                                            <p className="text-[11px] text-slate-500 italic mb-2">Separate features with commas (e.g. Flexible Temples, Anti-Scratch)</p>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Super Light, Anti-Fog"
                                                    value={field.value?.join(',') || ""}
                                                    onChange={(e) => field.onChange(e.target.value.split(','))}
                                                    className="bg-slate-800/50 border-slate-700 text-slate-200"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    {/* Pricing & Inventory Section */}
                    <div className="space-y-4 mt-8 bg-slate-900/40 p-6 rounded-xl border border-slate-800 shadow-inner">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mb-4">Pricing & Inventory</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Unit Price (₹) *</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="bg-slate-800/50 border-slate-700 text-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="discountType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Discount Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || 'flat'}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                                <SelectItem value="flat">Flat Discount (₹)</SelectItem>
                                                <SelectItem value="percent">Percentage Discount (%)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="discountAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">
                                            {form.watch('discountType') === 'percent' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                max={form.watch('discountType') === 'percent' ? 100 : undefined}
                                                step="any"
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                placeholder={form.watch('discountType') === 'percent' ? 'e.g. 10' : 'e.g. 200'}
                                                className="bg-slate-800/50 border-slate-700 text-slate-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="stock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Current Stock *</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="bg-slate-800/50 border-slate-700 text-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {(() => {
                            const p = form.watch('price') || 0
                            const dAmt = form.watch('discountAmount') || 0
                            const dType = form.watch('discountType') || 'flat'
                            let calculatedDiscount = 0
                            if (dType === 'percent') {
                                calculatedDiscount = (p * dAmt) / 100
                            } else {
                                calculatedDiscount = dAmt
                            }
                            const finalPrice = Math.max(0, p - calculatedDiscount)

                            return (p > 0 && dAmt > 0) ? (
                                <div className="mt-3 p-3 bg-blue-950/40 border border-blue-800/50 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span className="text-blue-300 font-medium">
                                        Discount Off: <strong className="text-white">₹{calculatedDiscount.toFixed(2)}</strong> {dType === 'percent' ? `(${dAmt}% OFF)` : '(Flat)'}
                                    </span>
                                    <span className="text-emerald-400 font-bold text-sm">
                                        Effective Final Price: ₹{finalPrice.toFixed(2)}
                                    </span>
                                </div>
                            ) : null
                        })()}

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-3 mt-4">
                                        <FormLabel className="text-slate-300">Product Status:</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-2">
                                                <span className={field.value === 'active' ? 'text-green-500 font-medium text-sm' : 'text-slate-400 text-sm'}>
                                                    {field.value === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                                <Checkbox
                                                    checked={field.value === 'active'}
                                                    onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                                                    className="border-slate-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                                />
                                            </div>
                                        </FormControl>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>


                    {/* Lens Selection Settings - Ultra Compact & Filtered UI */}
                    {showLensOptions() && (
                        <div className="space-y-4 mt-4 p-3 rounded-xl bg-white/[0.02] border border-slate-800/60 shadow-inner">
                            {/* Compact Header */}
                            <div className="flex items-center justify-between gap-4 px-1">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-600 p-1 rounded-md shadow-md">
                                        <Zap className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white leading-tight">Lens Setup</h3>
                                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest opacity-60">Configuration</p>
                                    </div>
                                </div>

                                <div className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-[0.1em] transition-all",
                                    form.watch('lensSettings.allowLensSelection')
                                        ? "bg-teal-500/10 border-teal-500/20 text-teal-500"
                                        : "bg-slate-800 border-slate-700 text-slate-500"
                                )}>
                                    <div className={cn("w-1 h-1 rounded-full", form.watch('lensSettings.allowLensSelection') ? "bg-teal-500 animate-pulse" : "bg-slate-500")} />
                                    <span>{form.watch('lensSettings.allowLensSelection') ? "Active" : "Disabled"}</span>
                                </div>
                            </div>

                            {/* Ultra Sleek Tab Bar - Only show categories allowing packages */}
                            <div className="flex items-center gap-1 p-0.5 bg-slate-950/60 border border-slate-800/40 rounded-lg overflow-x-auto no-scrollbar">
                                {vendorLensTypes
                                    .filter(t => t.allowPackages !== false)
                                    .map((type) => {
                                        const isEnabled = lensTypeFields.some(field => (field as any).lensTypeId?._id === type._id || (field as any).lensTypeId === type._id);
                                        const isActive = (activeLensTab || vendorLensTypes.filter(t => t.allowPackages !== false)[0]?._id) === type._id;

                                        return (
                                            <button
                                                key={type._id} type="button"
                                                onClick={() => {
                                                    setActiveLensTab(type._id);
                                                    const fIdx = lensTypeFields.findIndex(field => (field as any).lensTypeId?._id === type._id || (field as any).lensTypeId === type._id);
                                                    if (fIdx === -1) {
                                                        appendLensType({
                                                            lensTypeId: type._id,
                                                            skipPackages: false,
                                                            packages: [{
                                                                name: 'Standard',
                                                                price: form.getValues('price') || 0,
                                                                mrp: (form.getValues('price') || 0) + 1000,
                                                                discountAmount: 1000,
                                                                discountType: 'flat',
                                                                features: [],
                                                                description: '',
                                                                warranty: '6 Months',
                                                                indexLabel: '1.56',
                                                                detailedFeatures: []
                                                            }]
                                                        });
                                                        form.setValue('lensSettings.allowLensSelection', true);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-[9px] font-bold uppercase",
                                                    isActive
                                                        ? "bg-blue-600 text-white shadow-sm font-black"
                                                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
                                                )}
                                            >
                                                {isEnabled && <Check className="w-2.5 h-2.5 text-teal-400" />}
                                                {type.name}
                                            </button>
                                        );
                                    })}
                            </div>

                            {/* Content Area - Cleaned Mapping */}
                            {vendorLensTypes
                                .filter(t => t.allowPackages !== false)
                                .map((type) => {
                                    const isActiveTab = (activeLensTab || vendorLensTypes.filter(t => t.allowPackages !== false)[0]?._id) === type._id;
                                    if (!isActiveTab) return null;

                                    const fieldIndex = lensTypeFields.findIndex(field => (field as any).lensTypeId?._id === type._id || (field as any).lensTypeId === type._id);
                                    const isEnabled = fieldIndex !== -1;

                                    const activateCategory = () => {
                                        appendLensType({
                                            lensTypeId: type._id, active: true, skipPackages: false,
                                            packages: [{ name: 'Standard', price: form.getValues('price') || 0, warranty: '6 Months', detailedFeatures: [] }]
                                        });
                                        form.setValue('lensSettings.allowLensSelection', true);
                                    };

                                    const deactivateCategory = () => {
                                        removeLensType(fieldIndex);
                                        if (lensTypeFields.length <= 1) form.setValue('lensSettings.allowLensSelection', false);
                                    };

                                    return (
                                        <div key={type._id} className="animate-in fade-in duration-300">
                                            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden mb-6">
                                                <div className="bg-slate-800/10 h-12 px-6 flex items-center justify-between border-b border-slate-800/40">
                                                    <div className="flex items-center gap-3">
                                                        {type.imageUrl ? (
                                                            <img src={getImageUrl(type.imageUrl)} className="w-6 h-6 object-contain opacity-80" />
                                                        ) : <Layers className="h-4 w-4 text-indigo-500/50" />}
                                                        <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{type.name}</h4>
                                                    </div>
                                                    {isEnabled && (
                                                        <button
                                                            type="button" onClick={deactivateCategory}
                                                            className="text-[9px] text-red-500/40 hover:text-red-500 uppercase font-black tracking-widest transition-colors flex items-center gap-2"
                                                        >
                                                            <X className="h-3 w-3" /> Deactivate
                                                        </button>
                                                    )}
                                                </div>

                                                {isEnabled ? (
                                                    <div className="p-6 space-y-6">
                                                        <div className="flex items-center justify-between border-b border-indigo-500/10 pb-4">
                                                            <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Packages</h5>
                                                            <Button
                                                                type="button" variant="outline" size="sm"
                                                                onClick={() => {
                                                                    const currentPkgs = form.getValues(`lensSettings.lensTypes.${fieldIndex}.packages`) || [];
                                                                    form.setValue(`lensSettings.lensTypes.${fieldIndex}.packages`, [
                                                                        ...currentPkgs,
                                                                        { name: 'New Package', price: 0, warranty: '6 Months', detailedFeatures: [] }
                                                                    ]);
                                                                }}
                                                                className="h-8 text-[9px] font-black uppercase border-slate-700 bg-slate-900/50 hover:bg-slate-800 transition-all hover:scale-105"
                                                            >+ Add Package</Button>
                                                        </div>

                                                        <div className="space-y-8">
                                                            {(form.watch(`lensSettings.lensTypes.${fieldIndex}.packages`) || []).map((pkg: any, pkgIdx: number) => (
                                                                <div key={pkgIdx} className="bg-slate-950/40 rounded-xl border border-white/[0.03] p-5 relative group/pkg shadow-xl">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const pkgs = form.getValues(`lensSettings.lensTypes.${fieldIndex}.packages`).filter((_: any, i: number) => i !== pkgIdx);
                                                                            form.setValue(`lensSettings.lensTypes.${fieldIndex}.packages`, pkgs);
                                                                        }}
                                                                        className="absolute -top-2 -right-2 h-6 w-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/pkg:opacity-100 transition-all shadow-lg hover:scale-110 z-10"
                                                                    ><X className="h-3 w-3" /></button>

                                                                    <div className="grid grid-cols-12 gap-6">
                                                                        <div className="col-span-12 lg:col-span-4 space-y-4">
                                                                            <div className="space-y-2">
                                                                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Package Icon</label>
                                                                                <div className="relative group/pimg h-28 bg-slate-900 rounded-xl border border-dashed border-slate-700 flex items-center justify-center overflow-hidden transition-all hover:border-indigo-500/50">
                                                                                    {pkg.imageUrl ? (
                                                                                        <>
                                                                                            <img src={getImageUrl(pkg.imageUrl)} className="w-full h-full object-contain p-2" />
                                                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/pimg:opacity-100 transition-opacity flex items-center justify-center">
                                                                                                <p className="text-[8px] font-black text-white uppercase tracking-widest">Change Image</p>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : (
                                                                                        <div className="text-center space-y-1">
                                                                                            <ImageIcon className="h-5 w-5 text-slate-700 mx-auto" />
                                                                                            <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Upload Icon</p>
                                                                                        </div>
                                                                                    )}
                                                                                    <input
                                                                                        type="file" accept="image/*"
                                                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                        onChange={(e) => handleImageUpload(e, `lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.imageUrl`)}
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <FormField
                                                                                control={form.control} name={`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.name`}
                                                                                render={({ field }) => (
                                                                                    <FormItem className="space-y-1">
                                                                                        <FormLabel className="text-[8px] font-black uppercase text-slate-600 tracking-widest ml-1">Package Title</FormLabel>
                                                                                        <FormControl><Input placeholder="e.g. Premium Anti-Glare" {...field} className="h-9 text-[11px] bg-slate-900 border-slate-800 font-bold" /></FormControl>
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                        </div>

                                                                        <div className="col-span-12 lg:col-span-8 space-y-5">
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <FormField
                                                                                    control={form.control} name={`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.price`}
                                                                                    render={({ field }) => (
                                                                                        <FormItem className="space-y-1">
                                                                                            <FormLabel className="text-[8px] font-black uppercase text-slate-600 tracking-widest ml-1">Lens Price (₹)</FormLabel>
                                                                                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-10 text-[13px] bg-slate-950 border-slate-800 font-black text-indigo-400" /></FormControl>
                                                                                        </FormItem>
                                                                                    )}
                                                                                />
                                                                                <FormField
                                                                                    control={form.control} name={`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.warranty`}
                                                                                    render={({ field }) => (
                                                                                        <FormItem className="space-y-1">
                                                                                            <FormLabel className="text-[8px] font-black uppercase text-slate-600 tracking-widest ml-1">Warranty Period</FormLabel>
                                                                                            <FormControl><Input placeholder="6 Months" {...field} className="h-10 text-[11px] bg-slate-900 border-slate-800" /></FormControl>
                                                                                        </FormItem>
                                                                                    )}
                                                                                />
                                                                            </div>

                                                                            <div className="space-y-3 pt-2">
                                                                                <div className="flex items-center justify-between">
                                                                                    <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest ml-1">Technical Highlights</label>
                                                                                    <Button
                                                                                        type="button" variant="ghost" size="sm"
                                                                                        onClick={() => {
                                                                                            const feats = [...(form.getValues(`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.detailedFeatures`) || [])];
                                                                                            feats.push({ title: 'Technical Feature', description: '', icon: 'Zap' });
                                                                                            form.setValue(`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.detailedFeatures`, feats);
                                                                                        }}
                                                                                        className="h-5 px-2 text-[8px] font-black text-indigo-400 hover:text-white uppercase"
                                                                                    >+ Add Feature</Button>
                                                                                </div>
                                                                                <div className="grid grid-cols-1 gap-3">
                                                                                    {(form.watch(`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.detailedFeatures`) || []).map((feat: any, featIdx: number) => (
                                                                                        <div key={featIdx} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/40 space-y-4 group/feat relative">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    const feats = form.getValues(`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.detailedFeatures`).filter((_: any, i: number) => i !== featIdx);
                                                                                                    form.setValue(`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.detailedFeatures`, feats);
                                                                                                }}
                                                                                                className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover/feat:opacity-100"
                                                                                            ><X className="h-4 w-4" /></button>

                                                                                            <div className="flex gap-3">
                                                                                                <div className="w-20 shrink-0">
                                                                                                    <label className="text-[7px] font-black uppercase text-slate-600 tracking-widest block mb-1">Icon</label>
                                                                                                    <Select
                                                                                                        value={feat.icon || 'Zap'}
                                                                                                        onValueChange={(val) => form.setValue(`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.detailedFeatures.${featIdx}.icon`, val)}
                                                                                                    >
                                                                                                        <SelectTrigger className="h-8 bg-slate-900 border-slate-800 text-[10px]">
                                                                                                            <SelectValue />
                                                                                                        </SelectTrigger>
                                                                                                        <SelectContent className="bg-slate-950 border-slate-800">
                                                                                                            {['Zap', 'Shield', 'Sun', 'Sparkles', 'Eye', 'Waves', 'Droplets', 'Award', 'ShieldCheck', 'ShieldAlert'].map(id => (
                                                                                                                <SelectItem key={id} value={id} className="text-[10px]">{id}</SelectItem>
                                                                                                            ))}
                                                                                                        </SelectContent>
                                                                                                    </Select>
                                                                                                </div>
                                                                                                <div className="flex-1">
                                                                                                    <label className="text-[7px] font-black uppercase text-slate-600 tracking-widest block mb-1">Feature Title</label>
                                                                                                    <Input
                                                                                                        value={feat.title}
                                                                                                        onChange={(e) => {
                                                                                                            const feats = [...form.getValues(`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.detailedFeatures`)];
                                                                                                            feats[featIdx].title = e.target.value;
                                                                                                            form.setValue(`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.detailedFeatures`, feats);
                                                                                                        }}
                                                                                                        placeholder="e.g. Blue Light Filter"
                                                                                                        className="h-8 text-[11px] bg-slate-900 border-slate-800"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="flex gap-4">
                                                                                                <div className="w-16 h-16 shrink-0 relative group/fimg bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                                                                                                    {feat.image ? (
                                                                                                        <img src={getImageUrl(feat.image)} className="w-full h-full object-cover" />
                                                                                                    ) : (
                                                                                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                                                                                            <ImageIcon className="h-4 w-4 text-slate-700" />
                                                                                                            <span className="text-[6px] font-black text-slate-800 uppercase">Image</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    <input
                                                                                                        type="file" accept="image/*"
                                                                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                                        onChange={(e) => handleImageUpload(e, `lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.detailedFeatures.${featIdx}.image`)}
                                                                                                    />
                                                                                                </div>
                                                                                                <div className="flex-1">
                                                                                                    <label className="text-[7px] font-black uppercase text-slate-600 tracking-widest block mb-1">Technical Description</label>
                                                                                                    <Textarea
                                                                                                        value={feat.description || ''}
                                                                                                        onChange={e => form.setValue(`lensSettings.lensTypes.${fieldIndex}.packages.${pkgIdx}.detailedFeatures.${featIdx}.description`, e.target.value)}
                                                                                                        placeholder="Detailed technical benefit..."
                                                                                                        className="h-16 text-[10px] bg-slate-900 border-slate-800 resize-none"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-12 flex flex-col items-center justify-center text-center bg-slate-950/20">
                                                        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center mb-6 opacity-40">
                                                            <Plus className="h-6 w-6 text-indigo-400" />
                                                        </div>
                                                        <h5 className="text-[13px] font-black text-slate-200 uppercase tracking-[0.4em] mb-2">{type.name}</h5>
                                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-8 tracking-widest max-w-[240px] leading-relaxed">Activate this category to configure storefront lens packages</p>
                                                        <Button
                                                            type="button" size="sm" onClick={activateCategory}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-10 text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-indigo-600/30"
                                                        >Enable Category</Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}

                    {/* Variations Section - Ultra Compact */}
                    <div className="space-y-4 mt-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                        <div className="flex items-center gap-2 border-b border-slate-800/40 pb-2 mb-3">
                            <Layers className="h-3 w-3 text-indigo-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Configurable Variants</h3>
                        </div>

                        <FormField
                            control={form.control}
                            name="colors"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Available Colors</FormLabel>
                                    <FormControl>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 px-1">
                                            {['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Purple'].map((color) => (
                                                <div key={color} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        checked={field.value.includes(color)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                field.onChange([...field.value, color])
                                                            } else {
                                                                field.onChange(field.value.filter((c) => c !== color))
                                                            }
                                                        }}
                                                        className="h-3.5 w-3.5 border-slate-700"
                                                    />
                                                    <label className="text-[11px] font-medium text-slate-300 leading-tight">
                                                        {color}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Custom Attributes</FormLabel>
                                <Button
                                    type="button" variant="ghost" size="sm"
                                    className="h-6 px-2 text-[9px] font-black text-indigo-400 hover:text-white uppercase"
                                    onClick={() => appendAttribute({ name: '', values: [] })}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add New
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {attributeFields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-start bg-slate-950/20 p-2 rounded-lg border border-slate-800/40 relative group">
                                        <FormField
                                            control={form.control}
                                            name={`attributes.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1 space-y-1">
                                                    <FormControl>
                                                        <Input placeholder="Size/Material" {...field} className="h-7 text-[10px] bg-slate-900 border-slate-800/60" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`attributes.${index}.values`}
                                            render={({ field }) => (
                                                <FormItem className="flex-[2] space-y-1">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Small, Medium, Large"
                                                            value={field.value.join(',')}
                                                            onChange={(e) => field.onChange(e.target.value.split(','))}
                                                            className="h-7 text-[10px] bg-slate-900 border-slate-800/60"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <button
                                            type="button" className="text-slate-700 hover:text-red-500 mt-1.5"
                                            onClick={() => removeAttribute(index)}
                                        ><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Variant Management - Ultra Compact */}
                        <div className="mt-6 pt-4 border-t border-slate-800/60">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Variation Inventory</h4>
                                    <p className="text-[9px] text-slate-500 font-medium italic mt-0.5">Automated SKU generation based on attributes</p>
                                </div>
                                <Button
                                    type="button" onClick={generateVariants} disabled={uploading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase h-7 px-4 rounded-md shadow-lg shadow-indigo-500/10"
                                >
                                    <Sparkles className="h-3 w-3 mr-1.5" />
                                    Generate
                                </Button>
                            </div>

                            {variantFields.length > 0 && (
                                <div className="space-y-6">
                                    {Object.entries(
                                        variantFields.reduce((groups, field, index) => {
                                            const variant = form.getValues(`variants.${index}`)
                                            const color = variant.variantValues?.Color || 'Default'
                                            if (!groups[color]) groups[color] = []
                                            groups[color].push({ field, index })
                                            return groups
                                        }, {} as Record<string, Array<{ field: any; index: number }>>)
                                    ).map(([colorName, variants]) => {
                                        const firstVariantIndex = variants[0].index
                                        const sharedImages = form.getValues(`variants.${firstVariantIndex}.images`) || []

                                        const handleColorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                                            const files = e.target.files
                                            if (!files || files.length === 0) return
                                            const newPreviews: string[] = []
                                            Array.from(files).forEach((file, i) => {
                                                const previewUrl = URL.createObjectURL(file)
                                                newPreviews.push(previewUrl)
                                                variants.forEach(({ index }) => {
                                                    const current = form.getValues(`variants.${index}.images`) || []
                                                    const path = `variants.${index}.images.${current.length + i}`
                                                    setPendingFiles(prev => ({ ...prev, [path]: file }))
                                                })
                                            })
                                            variants.forEach(({ index }) => {
                                                const current = form.getValues(`variants.${index}.images`) || []
                                                form.setValue(`variants.${index}.images`, [...current, ...newPreviews])
                                            })
                                            e.target.value = ''
                                        }

                                        const removeColorImage = (imgIndex: number) => {
                                            variants.forEach(({ index }) => {
                                                const current = form.getValues(`variants.${index}.images`) || []
                                                form.setValue(`variants.${index}.images`, current.filter((_, i) => i !== imgIndex))
                                            })
                                        }

                                        return (
                                            <div key={colorName} className="p-3 rounded-xl bg-slate-950/20 border border-slate-800/60 space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-700 ring-offset-1 ring-offset-slate-900 shadow-inner" style={{ backgroundColor: colorName.toLowerCase() }} />
                                                        <h5 className="text-[11px] font-black text-white uppercase tracking-tight">{colorName} <span className="text-[9px] text-slate-500 font-normal ml-1">({variants.length} SKU)</span></h5>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h6 className="text-[8px] font-black uppercase text-indigo-400 opacity-60 tracking-[0.15em]">Color Lookbook</h6>
                                                    <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-slate-900/30 border border-slate-800/40">
                                                        {sharedImages.map((img, imgIndex) => (
                                                            <div key={imgIndex} className="relative group/img animate-in zoom-in-95 duration-200">
                                                                <img src={getImageUrl(img)} className="h-16 w-16 object-cover rounded-md border border-slate-700 shadow-sm" />
                                                                <button
                                                                    type="button" onClick={() => removeColorImage(imgIndex)}
                                                                    className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full shadow-lg opacity-0 group-hover/img:opacity-100 transition-all"
                                                                ><X className="h-2.5 w-2.5" /></button>
                                                            </div>
                                                        ))}
                                                        <div className="flex items-center justify-center h-16 w-16 border border-dashed border-slate-700 rounded-md hover:border-indigo-500 hover:bg-slate-800/50 transition-all relative">
                                                            <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleColorImageUpload} disabled={uploading} />
                                                            <Plus className="h-4 w-4 text-slate-600" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    {variants.map(({ index }) => {
                                                        const v = form.getValues(`variants.${index}`)
                                                        const vSpecs = Object.entries(v.variantValues || {})
                                                            .filter(([key]) => key !== 'Color')
                                                            .map(([k, val]) => `${k}:${val}`)
                                                            .join(' | ') || 'Default'

                                                        return (
                                                            <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 rounded-md bg-slate-900/40 border border-slate-800/30 hover:border-slate-700 transition-colors">
                                                                <div className="col-span-4">
                                                                    <span className="text-[10px] font-black text-slate-300 block leading-none">{vSpecs}</span>
                                                                    <span className="text-[8px] text-slate-600 block mt-0.5 uppercase tracking-tighter">{v.sku}</span>
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <FormField
                                                                        control={form.control} name={`variants.${index}.price`}
                                                                        render={({ field }) => (
                                                                            <FormItem className="space-y-0.5">
                                                                                <FormLabel className="text-[7px] font-black uppercase text-slate-600 tracking-widest pl-1">Price</FormLabel>
                                                                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-6 text-[10px] bg-slate-950 border-slate-800" /></FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <FormField
                                                                        control={form.control} name={`variants.${index}.stock`}
                                                                        render={({ field }) => (
                                                                            <FormItem className="space-y-0.5">
                                                                                <FormLabel className="text-[7px] font-black uppercase text-slate-600 tracking-widest pl-1">Stock</FormLabel>
                                                                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="h-6 text-[10px] bg-slate-950 border-slate-800" /></FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2 flex justify-end">
                                                                    <button
                                                                        type="button" onClick={() => removeVariant(index)}
                                                                        className="h-6 w-6 text-slate-700 hover:text-red-500 transition-colors flex items-center justify-center rounded-md hover:bg-red-500/5"
                                                                    ><Trash2 className="h-3 w-3" /></button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Media Section - Compact */}
                    <div className="space-y-4 mt-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                        <div className="flex items-center gap-2 border-b border-slate-800/40 pb-2 mb-3">
                            <ImageIcon className="h-3 w-3 text-indigo-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Product Media</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="thumbnail"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Primary Thumbnail *</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-4 p-2 rounded-lg bg-slate-950/20 border border-slate-800/40">
                                                {field.value && (
                                                    <img src={getImageUrl(field.value)} className="h-20 w-20 object-cover rounded-md border border-slate-700 shadow-inner" />
                                                )}
                                                <div className="relative flex-1">
                                                    <Input
                                                        type="file" accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, 'thumbnail')}
                                                        disabled={uploading}
                                                        className="h-8 text-[10px] bg-slate-900 border-slate-800 cursor-pointer text-slate-400"
                                                    />
                                                    <p className="text-[8px] text-slate-600 mt-1 uppercase font-bold italic">Recommended: 1000x1000 PNG/JPG</p>
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="images"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Gallery Collection</FormLabel>
                                        <FormControl>
                                            <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-slate-950/20 border border-slate-800/40">
                                                {field.value.map((img, index) => (
                                                    <div key={index} className="relative group/gal">
                                                        <img src={getImageUrl(img)} className="h-16 w-16 object-cover rounded-md border border-slate-800" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const current = form.getValues('images')
                                                                form.setValue('images', current.filter((_, i) => i !== index))
                                                            }}
                                                            className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover/gal:opacity-100 transition-opacity"
                                                        ><X className="h-2.5 w-2.5" /></button>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-center h-16 w-16 border-2 border-dashed border-slate-800 rounded-md hover:border-indigo-500 hover:bg-indigo-500/5 transition-all relative">
                                                    <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, 'images')} disabled={uploading} />
                                                    <Plus className="h-4 w-4 text-slate-600" />
                                                </div>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Return Policy Section - Compact */}
                    <div className="space-y-4 mt-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                        <div className="flex items-center gap-2 border-b border-slate-800/40 pb-2 mb-3">
                            <ShieldCheck className="h-3 w-3 text-teal-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Customer Policies</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <FormField
                                control={form.control}
                                name="returnPolicy.allowReturns"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 p-2 rounded-md border border-slate-800/40 bg-slate-950/20">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-3.5 w-3.5" /></FormControl>
                                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 m-0">Returnable</FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="returnPolicy.allowRefunds"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 p-2 rounded-md border border-slate-800/40 bg-slate-950/20">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-3.5 w-3.5" /></FormControl>
                                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 m-0">Refundable</FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="returnPolicy.returnPeriodDays"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} placeholder="Days (e.g. 7)" className="h-7 text-[10px] bg-slate-900 border-slate-800" /></FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="returnPolicy.policyText"
                            render={({ field }) => (
                                <FormItem className="space-y-1 mt-2">
                                    <FormLabel className="text-[8px] font-black uppercase text-slate-600 tracking-[0.2em] ml-1">Custom Policy Overrides</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Specific terms for this product..." {...field} className="h-16 text-[10px] bg-slate-900 border-slate-800 min-h-[50px]" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Validation Error Summary Section - High Visibility */}
                    {form.formState.isSubmitted && !form.formState.isValid && (
                        <div className="mt-8 p-6 bg-red-950/20 border border-red-500/30 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <ShieldAlert className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">⚠️ Missing Information Required</h4>
                                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-tight opacity-80">Please fill the following columns to save your changes</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 px-1">
                                {Object.entries(form.formState.errors).map(([field, error]: [string, any]) => {
                                    if (!error) return null;

                                    const getErrorMessage = (err: any, prefix = ''): string[] => {
                                        if (err.message) return [prefix ? `${prefix}: ${err.message}` : err.message];
                                        if (Array.isArray(err)) {
                                            return err.flatMap((item, idx) => item ? getErrorMessage(item, `${prefix} Row ${idx + 1}`) : []);
                                        }
                                        if (typeof err === 'object') {
                                            return Object.entries(err).flatMap(([k, v]) => getErrorMessage(v, prefix ? `${prefix} > ${k}` : k));
                                        }
                                        return [];
                                    };

                                    const messages = getErrorMessage(error, field.replace(/([A-Z])/g, ' $1').trim());
                                    return messages.map((msg, i) => (
                                        <div key={`${field}-${i}`} className="flex items-start gap-2 border-l-2 border-red-500/20 pl-3 py-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1 animate-pulse shrink-0" />
                                            <span className="text-[11px] font-black text-red-100/90 uppercase tracking-tight leading-tight">
                                                {msg}
                                            </span>
                                        </div>
                                    ));
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Bar - Sleek & Premium */}
                    <div className="flex items-center justify-between gap-4 mt-10 mb-10 p-5 rounded-2xl bg-indigo-600/5 border border-indigo-500/10 shadow-[0_0_50px_rgba(79,70,229,0.05)]">
                        <div className="hidden md:block">
                            <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.3em]">
                                {form.formState.isValid ? 'Validation Complete' : 'Review Errors Above'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button" variant="ghost"
                                onClick={() => navigate(`${pathPrefix}/products`)}
                                className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest h-10 px-6"
                            >Discard</Button>
                            <Button
                                type="submit" disabled={loading || uploading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_10px_20px_rgba(79,70,229,0.2)] text-[10px] font-black uppercase tracking-widest h-10 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Zap className="mr-2 h-3 w-3 fill-white" />}
                                Commit Changes
                            </Button>
                        </div>
                    </div>
                </form >
            </Form >
        </div >
    )
}

export default ProductForm
