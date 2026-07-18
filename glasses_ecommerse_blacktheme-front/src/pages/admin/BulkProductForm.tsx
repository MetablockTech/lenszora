import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, X, ImageIcon, ShoppingBag, ArrowLeft } from 'lucide-react'
import { products, getToken, getUser } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import { generateUniqueSKU } from '@/lib/generateSKU'

const bulkProductSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    sku: z.string().min(1, 'SKU is required'),
    price: z.coerce.number().min(0, 'Price must be positive'),
    minOrderQuantity: z.coerce.number().min(1, 'Minimum order quantity is required').default(1),
    stock: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
    thumbnail: z.string().min(1, 'Product image is required'),
    images: z.array(z.string()).default([]),
})

type BulkProductFormValues = z.infer<typeof bulkProductSchema>

const BulkProductForm = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const token = getToken()
    const isEdit = !!id

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const currentUser = getUser()

    const form = useForm<BulkProductFormValues>({
        resolver: zodResolver(bulkProductSchema),
        defaultValues: {
            title: '',
            description: '',
            sku: generateUniqueSKU(),
            price: 0,
            minOrderQuantity: 1,
            stock: 0,
            thumbnail: '',
            images: [],
        }
    })

    useEffect(() => {
        if (isEdit) {
            loadProduct()
        }
    }, [id])

    async function loadProduct() {
        try {
            setLoading(true)
            const p = await products.get(id!)
            form.reset({
                title: p.title,
                description: p.description,
                sku: p.sku,
                price: p.price,
                minOrderQuantity: p.minOrderQuantity,
                stock: p.stock,
                thumbnail: p.thumbnail,
                images: p.images || [],
            })
        } catch (error) {
            toast({ title: 'Error loading product', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    async function onSubmit(values: BulkProductFormValues) {
        setLoading(true)
        try {
            const payload = {
                ...values,
                isBulk: true,
                status: 'active',
                unit: 'pc', // Default simple unit
                category: undefined, // Ignored as per user request
                brand: undefined,    // Ignored as per user request
                vendorId: currentUser?.vendorId || currentUser?.id // Admin adding products
            }

            if (isEdit) {
                await products.update(id!, payload, token!)
                toast({ title: 'Bulk product updated successfully' })
            } else {
                await products.create(payload, token!)
                toast({ title: 'Bulk product created successfully' })
            }
            navigate('/admin/bulk-products')
        } catch (error: any) {
            toast({
                title: 'Error saving product',
                description: error.message || 'Something went wrong',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const res = await products.uploadImage(file, 'products', 'bulk', file.name, token!)
            form.setValue('thumbnail', res.url)
            toast({ title: 'Image uploaded' })
        } catch (error) {
            toast({ title: 'Upload failed', variant: 'destructive' })
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/bulk-products')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{isEdit ? 'Edit' : 'Add New'} Bulk Product</h1>
                    <p className="text-sm text-slate-500">This product will be visible ONLY to Vendors.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
                        {/* Image Upload Area */}
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-colors relative group">
                            {form.watch('thumbnail') ? (
                                <div className="relative group">
                                    <img 
                                        src={getImageUrl(form.watch('thumbnail'))} 
                                        alt="Thumbnail" 
                                        className="w-48 h-48 object-cover rounded-2xl shadow-lg"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => form.setValue('thumbnail', '')}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center gap-3 cursor-pointer">
                                    <div className="w-16 h-16 bg-[#DAAB34]/10 rounded-2xl flex items-center justify-center text-[#DAAB34]">
                                        {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImageIcon className="w-8 h-8" />}
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm font-bold text-[#DAAB34]">Upload Product Image</span>
                                        <p className="text-xs text-slate-400 mt-1">Recommended size: 800x800px</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            )}
                            <FormField control={form.control} name="thumbnail" render={() => <FormMessage />} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6 md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-bold uppercase tracking-wider text-xs">Product Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Premium Sunglasses Bulk Case" {...field} className="py-6 rounded-xl border-slate-200 focus:ring-[#DAAB34]/20 focus:border-[#DAAB34] px-4" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-bold uppercase tracking-wider text-xs">Product Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Describe the bulk deal, box contents, or special terms..." {...field} className="min-h-[150px] rounded-xl border-slate-200 focus:ring-[#DAAB34]/20 focus:border-[#DAAB34] p-4" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-bold uppercase tracking-wider text-xs">Wholesale Price (₹)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                    <Input type="number" {...field} className="py-6 rounded-xl border-slate-200 focus:ring-[#DAAB34]/20 focus:border-[#DAAB34] pl-8 pr-4 font-bold text-lg" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="minOrderQuantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-bold uppercase tracking-wider text-xs">Minimum Order Quantity (MOQ)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="py-6 rounded-xl border-slate-200 focus:ring-[#DAAB34]/20 focus:border-[#DAAB34] px-4 font-bold" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="stock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-bold uppercase tracking-wider text-xs">Available Stock</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="py-6 rounded-xl border-slate-200 focus:ring-[#DAAB34]/20 focus:border-[#DAAB34] px-4 font-bold" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-bold uppercase tracking-wider text-xs">SKU / Model Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="py-6 rounded-xl border-slate-200 focus:ring-[#DAAB34]/20 focus:border-[#DAAB34] px-4 font-mono text-xs uppercase" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 flex gap-4">
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="flex-1 bg-[#DAAB34] hover:bg-[#C0962B] text-black py-8 rounded-2xl font-bold text-lg flex gap-2 items-center justify-center shadow-xl shadow-[#DAAB34]/20 transition-all hover:scale-[1.02] border-0 hover:text-black"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : <Save className="w-6 h-6" />}
                                {isEdit ? 'Update Bulk Listing' : 'Publish to Vendors'}
                            </Button>
                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => navigate('/admin/bulk-products')}
                                className="px-10 py-8 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 border-slate-200"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}

export default BulkProductForm
