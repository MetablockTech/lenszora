import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { categories, products, getToken, API_URL } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import { generateUniqueSKU } from '@/lib/generateSKU'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Sparkles, ArrowLeft, Loader2, Upload, Plus, X, Check, PackageCheck, ShieldCheck, Tag, Link2, Image as ImageIcon } from 'lucide-react'

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
  const [mainCats, setMainCats] = useState<any[]>([])
  const [subCats, setSubCats] = useState<any[]>([])
  const [subSubCats, setSubSubCats] = useState<any[]>([])

  const [selectedMain, setSelectedMain] = useState('')
  const [selectedSub, setSelectedSub] = useState('')
  const [selectedSubSub, setSelectedSubSub] = useState('')

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
  const [urlInput, setUrlInput] = useState('')

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
      const mains = cats.filter((c: any) => c.level === 'main' || !c.parentId)
      setMainCats(mains)

      // Find default Accessories category if exists
      const accCat = mains.find((c: any) => 
        c.name.toLowerCase().includes('accessor') || 
        c.slug?.toLowerCase().includes('accessor')
      )
      if (accCat && !selectedMain) {
        setSelectedMain(accCat._id)
        setCategory(accCat._id)
        const subs = cats.filter((c: any) => {
          const pId = typeof c.parentId === 'object' ? c.parentId?._id : c.parentId
          return pId === accCat._id
        })
        setSubCats(subs)
      }
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }

  async function loadAccessoryData(productId: string) {
    setLoading(true)
    try {
      const [data, cats] = await Promise.all([
        products.get(productId),
        categories.list().catch(() => [])
      ])

      if (data) {
        setTitle(data.title || '')
        setSku(data.sku || generateUniqueSKU('ACC'))
        setPrice(data.price || '')
        setDiscountAmount(data.discountAmount || 0)
        setStock(data.stock ?? 100)
        
        const prodCatId = typeof data.category === 'object' ? data.category?._id : data.category || ''
        setCategory(prodCatId)

        // Resolve hierarchy in categories
        if (prodCatId && cats.length > 0) {
          const currentCat = cats.find((c: any) => c._id === prodCatId)
          if (currentCat) {
            if (currentCat.level === 'subsub') {
              const subCat = cats.find((c: any) => c._id === (typeof currentCat.parentId === 'object' ? currentCat.parentId?._id : currentCat.parentId))
              const mainCat = subCat ? cats.find((c: any) => c._id === (typeof subCat.parentId === 'object' ? subCat.parentId?._id : subCat.parentId)) : null

              setSelectedMain(mainCat?._id || '')
              setSelectedSub(subCat?._id || '')
              setSelectedSubSub(currentCat._id)

              if (mainCat) setSubCats(cats.filter((c: any) => (typeof c.parentId === 'object' ? c.parentId?._id : c.parentId) === mainCat._id))
              if (subCat) setSubSubCats(cats.filter((c: any) => (typeof c.parentId === 'object' ? c.parentId?._id : c.parentId) === subCat._id))
            } else if (currentCat.level === 'sub') {
              const mainCat = cats.find((c: any) => c._id === (typeof currentCat.parentId === 'object' ? currentCat.parentId?._id : currentCat.parentId))

              setSelectedMain(mainCat?._id || '')
              setSelectedSub(currentCat._id)

              if (mainCat) setSubCats(cats.filter((c: any) => (typeof c.parentId === 'object' ? c.parentId?._id : c.parentId) === mainCat._id))
              setSubSubCats(cats.filter((c: any) => (typeof c.parentId === 'object' ? c.parentId?._id : c.parentId) === currentCat._id))
            } else {
              setSelectedMain(currentCat._id)
              setSubCats(cats.filter((c: any) => (typeof c.parentId === 'object' ? c.parentId?._id : c.parentId) === currentCat._id))
            }
          }
        }

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

  const handleMainCategoryChange = (mainId: string) => {
    setSelectedMain(mainId)
    setSelectedSub('')
    setSelectedSubSub('')
    setCategory(mainId)

    const subs = allCats.filter((c: any) => {
      const pId = typeof c.parentId === 'object' ? c.parentId?._id : c.parentId
      return pId === mainId
    })
    setSubCats(subs)
    setSubSubCats([])
  }

  const handleSubCategoryChange = (subId: string) => {
    setSelectedSub(subId)
    setSelectedSubSub('')
    setCategory(subId || selectedMain)

    const subSubs = allCats.filter((c: any) => {
      const pId = typeof c.parentId === 'object' ? c.parentId?._id : c.parentId
      return pId === subId
    })
    setSubSubCats(subSubs)
  }

  const handleSubSubCategoryChange = (subSubId: string) => {
    setSelectedSubSub(subSubId)
    setCategory(subSubId || selectedSub || selectedMain)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isThumb = false) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const data = await products.uploadImage(file, 'products', 'accessories', undefined, token || undefined)
        const uploadedUrl = data.url || data.path

        if (uploadedUrl) {
          if (isThumb) {
            setThumbnail(uploadedUrl)
            setImages(prev => Array.from(new Set([uploadedUrl, ...prev])))
          } else {
            setImages(prev => Array.from(new Set([...prev, uploadedUrl])))
            if (!thumbnail) {
              setThumbnail(uploadedUrl)
            }
          }
        }
      }
      toast({ title: 'Success', description: 'Image(s) uploaded successfully.' })
    } catch (err: any) {
      toast({ title: 'Upload Error', description: err.message || 'Image upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleAddImageUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return

    if (!thumbnail) {
      setThumbnail(trimmed)
    }
    if (!images.includes(trimmed)) {
      setImages(prev => [...prev, trimmed])
    }
    setUrlInput('')
    toast({ title: 'Added!', description: 'Image URL added successfully.' })
  }

  const handleToggleTag = (tag: string) => {
    setSearchTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleAddCustomTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !searchTags.includes(trimmed)) {
      setSearchTags(prev => [...prev, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSearchTags(prev => prev.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({ title: 'Validation Error', description: 'Accessory Title is required', variant: 'destructive' })
      return
    }
    if (!price || Number(price) <= 0) {
      toast({ title: 'Validation Error', description: 'Valid selling price is required', variant: 'destructive' })
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
        category: selectedSubSub || selectedSub || selectedMain || category || undefined,
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
      <div className="flex flex-col items-center justify-center py-24 bg-slate-950 min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
        <p className="text-slate-400 text-xs font-semibold">Loading Accessory Details...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <button
        onClick={() => navigate('/admin/accessories')}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 text-xs font-bold mb-6 transition-colors bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl hover:border-amber-500/40"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Accessories List
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-amber-500" />
            {isEdit ? 'Edit Accessory Item' : 'Add New Accessory / Care Kit'}
          </h1>
          <p className="text-xs text-slate-600 mt-1.5 font-medium">
            Configure cleaning spray, microfiber cloth, leather case, pouch, or complete care kit details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Info */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-3 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-amber-400" />
            Basic Accessory Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Accessory Title <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Anti-Fog Lens Cleaner Spray (100ml)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">SKU Code</label>
              <Input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="bg-slate-950 border-slate-800 text-amber-400 font-mono h-11"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Selling Price (₹) <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                placeholder="399"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 h-11"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Discount Amount (₹)</label>
              <Input
                type="number"
                placeholder="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500 h-11"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Stock Quantity</label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white focus:border-amber-500 h-11"
              />
            </div>

            {/* Dynamic Main Category */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Main Category <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedMain}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-800 rounded-md text-sm text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="" className="bg-slate-900 text-slate-400">Select Main Category</option>
                {mainCats.map((c: any) => (
                  <option key={c._id} value={c._id} className="bg-slate-900 text-white font-bold">{c.name}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Subcategory (If available in DB) */}
            {subCats.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Subcategory
                </label>
                <select
                  value={selectedSub}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-950 border border-amber-500/30 rounded-md text-sm text-amber-300 font-semibold outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Select Subcategory (Optional)</option>
                  {subCats.map((c: any) => (
                    <option key={c._id} value={c._id} className="bg-slate-900 text-white">{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic Sub-subcategory (If available in DB) */}
            {subSubCats.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Sub-Subcategory
                </label>
                <select
                  value={selectedSubSub}
                  onChange={(e) => handleSubSubCategoryChange(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-950 border border-amber-500/30 rounded-md text-sm text-amber-400 font-semibold outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Select Sub-Subcategory (Optional)</option>
                  {subSubCats.map((c: any) => (
                    <option key={c._id} value={c._id} className="bg-slate-900 text-white">{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Description</label>
            <Textarea
              rows={3}
              placeholder="Describe the care kit, cleaning solution, cloth size, or case material..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Section 2: Search & Mega Menu Tags */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            Search & Mega Menu Matching Keywords
          </h2>
          <p className="text-xs text-slate-400">
            Click preset keywords to automatically display this item under Header Mega Menu care kit dropdowns.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {DEFAULT_ACCESSORY_TAGS.map((tag) => {
              const active = searchTags.includes(tag)
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-amber-500/40 hover:text-amber-400'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 text-slate-950" />}
                  {tag}
                </button>
              )
            })}
          </div>

          {/* Active Tags Pills */}
          {searchTags.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Active Applied Tags:</label>
              <div className="flex flex-wrap gap-2">
                {searchTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-400 transition-colors ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-10"
            />
            <Button
              type="button"
              onClick={handleAddCustomTag}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold h-10 px-4 shrink-0"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Section 3: Product Media Upload */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-400" />
            Accessory Media & Photos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Cover Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Main Cover Photo</label>
              <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950 rounded-2xl p-4 text-center transition-colors relative min-h-[160px] flex items-center justify-center">
                {uploading && (
                  <div className="absolute inset-0 bg-slate-950/80 rounded-2xl z-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-400 mb-1" />
                    <span className="text-[10px] text-amber-400 font-bold uppercase">Uploading...</span>
                  </div>
                )}
                {thumbnail ? (
                  <div className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 w-full aspect-video flex items-center justify-center">
                    <img src={getImageUrl(thumbnail)} alt="Thumbnail" className="h-full object-contain p-2" />
                    <button
                      type="button"
                      onClick={() => setThumbnail('')}
                      className="absolute top-2 right-2 bg-red-600/90 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full py-4">
                    <Upload className="w-8 h-8 text-amber-400 mb-2" />
                    <span className="text-xs font-bold text-white">Upload Cover Photo</span>
                    <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Gallery Images Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Gallery Photos</label>
              <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950 rounded-2xl p-4 text-center transition-colors min-h-[160px] flex flex-col justify-between">
                <label className="cursor-pointer flex flex-col items-center py-2 border-b border-slate-800/80 mb-2">
                  <Plus className="w-6 h-6 text-amber-400 mb-1" />
                  <span className="text-xs font-bold text-amber-400">Add More Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>

                {images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                    {images.map((imgUrl, idx) => (
                      <div key={idx} className="relative group rounded-lg bg-slate-900 border border-slate-800 aspect-square flex items-center justify-center">
                        <img src={getImageUrl(imgUrl)} alt={`Gallery ${idx}`} className="h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-600/90 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 py-4">No gallery images added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Alternative Image URL Input */}
          <div className="pt-3 border-t border-slate-800/80">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Or Paste Direct Image URL:</label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/accessory-photo.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-10 text-xs"
              />
              <Button
                type="button"
                onClick={handleAddImageUrl}
                className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold h-10 px-4 shrink-0 text-xs"
              >
                <Link2 className="w-3.5 h-3.5 mr-1" /> Add URL
              </Button>
            </div>
          </div>
        </div>

        {/* Section 4: Status & Submit */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Publish Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-amber-400 outline-none"
            >
              <option value="active" className="bg-slate-900 text-amber-400">Active (Live in Store)</option>
              <option value="inactive" className="bg-slate-900 text-slate-400">Inactive (Draft)</option>
            </select>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => navigate('/admin/accessories')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 h-11 rounded-xl w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || uploading}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider px-8 h-11 rounded-xl shadow-lg shadow-amber-500/20 w-full sm:w-auto"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : isEdit ? (
                'Update Accessory'
              ) : (
                'Publish Accessory'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AccessoryFormPage
