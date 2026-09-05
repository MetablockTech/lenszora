import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { categories, products, getToken, API_URL } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import { generateUniqueSKU } from '@/lib/generateSKU'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Sparkles, ArrowLeft, Loader2, Upload, Plus, X, Check, PackageCheck } from 'lucide-react'

const DEFAULT_ACCESSORY_TAGS = [
  'accessories', 'care kit', 'lens cleaner', 'microfiber',
  'solution', 'hard case', 'pouch', 'chain',
  'anti-fog', 'repair kit', 'disinfectant', 'spray'
]

const AccessoryFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const token = getToken()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [allCats, setAllCats] = useState<any[]>([])

  // Form Fields
  const [title, setTitle] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState<number | string>('')
  const [discountAmount, setDiscountAmount] = useState<number | string>(0)
  const [stock, setStock] = useState<number | string>(100)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [searchTags, setSearchTags] = useState<string[]>(['accessories', 'care kit'])
  const [tagInput, setTagInput] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [status, setStatus] = useState<'active' | 'inactive'>('active')

  useEffect(() => {
    loadCategories()
    if (isEdit && id) {
      loadAccessoryData(id)
    } else {
      setSku(generateUniqueSKU('ACC'))
    }
  }, [id])

  async function loadCategories() {
    try {
      const cats = await categories.list()
      setAllCats(cats)

      // Find default Accessories category if exists
      const accCat = cats.find((c: any) => 
        c.name.toLowerCase().includes('accessor') || 
        c.slug?.toLowerCase().includes('accessor')
      )
      if (accCat && !category) {
        setCategory(accCat._id)
      }
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }

  async function loadAccessoryData(productId: string) {
    setLoading(true)
    try {
      const data = await products.get(productId)
      if (data) {
        setTitle(data.title || '')
        setSku(data.sku || generateUniqueSKU('ACC'))
        setPrice(data.price || '')
        setDiscountAmount(data.discountAmount || 0)
        setStock(data.stock ?? 100)
        setCategory(typeof data.category === 'object' ? data.category?._id : data.category || '')
        setDescription(data.description || '')
        setSearchTags(Array.isArray(data.searchTags) ? data.searchTags : ['accessories'])
        setThumbnail(data.thumbnail || (Array.isArray(data.images) && data.images[0] ? data.images[0] : ''))
        setImages(Array.isArray(data.images) ? data.images : [])
        setStatus(data.status || 'active')
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load accessory details', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumb = false) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i])
      }

      const res = await fetch(`${API_URL}/api/upload/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      const uploadedUrls: string[] = data.urls || []

      if (uploadedUrls.length > 0) {
        if (isThumb) {
          setThumbnail(uploadedUrls[0])
          if (!images.includes(uploadedUrls[0])) {
            setImages(prev => [...prev, uploadedUrls[0]])
          }
        } else {
          setImages(prev => [...prev, ...uploadedUrls])
          if (!thumbnail) setThumbnail(uploadedUrls[0])
        }
        toast({ title: 'Success', description: 'Images uploaded successfully' })
      }
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message || 'Image upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleToggleTag = (tag: string) => {
    if (searchTags.includes(tag)) {
      setSearchTags(searchTags.filter(t => t !== tag))
    } else {
      setSearchTags([...searchTags, tag])
    }
  }

  const handleAddCustomTag = () => {
    const clean = tagInput.trim().toLowerCase()
    if (clean && !searchTags.includes(clean)) {
      setSearchTags([...searchTags, clean])
      setTagInput('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' })
      return
    }
    if (!price || Number(price) <= 0) {
      toast({ title: 'Validation Error', description: 'Valid price is required', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || title.trim(),
        productType: 'physical',
        unit: 'pc',
        sku: sku || generateUniqueSKU('ACC'),
        price: Number(price),
        discountAmount: Number(discountAmount || 0),
        discountType: 'flat',
        stock: Number(stock || 0),
        category: category || undefined,
        searchTags: Array.from(new Set(['accessories', 'accessory', ...searchTags])),
        thumbnail: thumbnail || (images.length > 0 ? images[0] : ''),
        images: images.length > 0 ? images : (thumbnail ? [thumbnail] : []),
        status,
        lensSettings: {
          allowLensSelection: false,
          disableLensSelection: true
        }
      }

      if (isEdit && id) {
        await products.update(id, payload, token)
        toast({ title: 'Updated!', description: 'Accessory item updated successfully.' })
      } else {
        await products.create(payload, token)
        toast({ title: 'Created!', description: 'New Accessory item published successfully.' })
      }
      navigate('/admin/accessories')
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message || 'Could not save accessory', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-4">
      <button
        onClick={() => navigate('/admin/accessories')}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-semibold mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Accessories
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            {isEdit ? 'Edit Accessory Item' : 'Add New Accessory / Care Kit'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure cleaning spray, microfiber cloth, leather case, or care kit details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Basic Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Accessory Title *</label>
              <Input
                type="text"
                placeholder="e.g. Anti-Fog Lens Cleaner Spray (100ml)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SKU Code</label>
              <Input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selling Price (₹) *</label>
              <Input
                type="number"
                placeholder="399"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Amount (₹)</label>
              <Input
                type="number"
                placeholder="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Quantity</label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Select Category</option>
                {allCats.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <Textarea
              rows={3}
              placeholder="Describe the care kit, cleaning solution, cloth size, or case material..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-50"
            />
          </div>
        </div>

        {/* Search & Mega Menu Matching Tags */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Search Tags & Mega Menu Keywords</h2>
          <p className="text-xs text-slate-500">Select keywords to ensure this accessory appears under Header Mega Menu links (Care Kits, Spray, Cloth, Case, etc.).</p>

          <div className="flex flex-wrap gap-2">
            {DEFAULT_ACCESSORY_TAGS.map((tag) => {
              const active = searchTags.includes(tag)
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {tag}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2 max-w-sm pt-2">
            <Input
              type="text"
              placeholder="Add custom tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustomTag()
                }
              }}
              className="bg-slate-50 h-9 text-xs"
            />
            <Button
              type="button"
              onClick={handleAddCustomTag}
              variant="outline"
              size="sm"
              className="h-9 text-xs"
            >
              Add Tag
            </Button>
          </div>
        </div>

        {/* Images Upload Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Images & Thumbnail</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Upload Thumbnail Image</label>
              <label className="border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-600">Click to upload main image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, true)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Upload Product Gallery Images</label>
              <label className="border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-600">Click to upload multiple photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, false)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {uploading && <p className="text-xs text-amber-600 font-semibold animate-pulse">Uploading image...</p>}

          {/* Image Previews */}
          {(thumbnail || images.length > 0) && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Uploaded Images Preview</label>
              <div className="flex flex-wrap gap-3">
                {thumbnail && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-amber-500 shadow-sm">
                    <img src={getImageUrl(thumbnail)} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black text-center uppercase py-0.5">MAIN</span>
                  </div>
                )}
                {images.filter(img => img !== thumbnail).map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter(i => i !== img))}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/accessories')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-8 shadow-md"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PackageCheck className="w-4 h-4 mr-2" />}
            {isEdit ? 'Update Accessory' : 'Publish Accessory'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AccessoryFormPage
