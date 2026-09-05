import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categories } from '@/lib/api'
import { getToken, getImageUrl } from '@/lib/utils'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, ImageIcon, UploadCloud, Tag, FolderTree, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'

const CategoriesPage: React.FC = () => {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [expandedParents, setExpandedParents] = useState<string[]>([])
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    level: 'main' as 'main' | 'sub' | 'subsub',
    parentId: '',
    description: '',
    allowLensSelection: false,
    showFrameDetails: false,
    image: '',
    icon: ''
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const token = getToken()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await categories.list()
      setList(data)
      // Expand all main category IDs by default for instant visibility
      const mainIds = data.filter((c: any) => c.level === 'main' || !c.parentId).map((c: any) => c._id)
      setExpandedParents(mainIds)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load categories")
    } finally { setLoading(false) }
  }

  const toggleExpand = (id: string) => {
    setExpandedParents(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData({
      name: '',
      level: 'main',
      parentId: '',
      description: '',
      allowLensSelection: false,
      showFrameDetails: false,
      image: '',
      icon: ''
    })
    setImageFile(null)
    setPreviewUrl(null)
    setShowModal(true)
  }

  const openCreateSub = (parentCat: any) => {
    setEditingId(null)
    const nextLevel = parentCat.level === 'main' ? 'sub' : 'subsub'
    setFormData({
      name: '',
      level: nextLevel,
      parentId: parentCat._id,
      description: '',
      allowLensSelection: parentCat.allowLensSelection || false,
      showFrameDetails: parentCat.showFrameDetails || false,
      image: '',
      icon: ''
    })
    setImageFile(null)
    setPreviewUrl(null)
    setShowModal(true)
  }

  const openEdit = (cat: any) => {
    setEditingId(cat._id)
    setFormData({
      name: cat.name,
      level: cat.level || 'main',
      parentId: cat.parentId?._id || cat.parentId || '',
      description: cat.description || '',
      allowLensSelection: cat.allowLensSelection || false,
      showFrameDetails: cat.showFrameDetails || false,
      image: cat.image || '',
      icon: cat.icon || ''
    })
    setImageFile(null)
    setPreviewUrl(cat.image ? getImageUrl(cat.image) : null)
    setShowModal(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) return toast.error("Category name is required")

    setIsUploading(true)
    try {
      let imageUrl = formData.image

      if (imageFile) {
        const data = await categories.uploadImage(imageFile, 'categories', undefined, token)
        imageUrl = data.url || data.path
      }

      const payload = {
        ...formData,
        image: imageUrl,
        parentId: formData.level === 'main' ? undefined : (formData.parentId || undefined)
      }

      if (editingId) {
        await categories.update(editingId, payload, token)
        toast.success("Category updated successfully")
      } else {
        await categories.create(payload, token)
        toast.success("Category created successfully")
      }

      setShowModal(false)
      await load()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to save category")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Delete this category? Products in this category will become unassigned.')) return
    try {
      await categories.remove(id, token)
      toast.success("Category deleted")
      await load()
    } catch (err: any) {
      toast.error(err.message || "Delete failed")
    }
  }

  const mainCategories = list.filter((c) => c.level === 'main' || !c.parentId)
  const getSubcategories = (parentId: string) => list.filter((c) => (c.parentId?._id === parentId || c.parentId === parentId))
  const subCategories = list.filter((c) => c.level === 'sub')

  return (
    <div className="space-y-6 min-h-screen pb-20 py-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <FolderTree className="w-7 h-7 text-blue-400" />
            Category Hierarchy Tree Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Manage store categories, subcategories, eyewear attributes & accessories structure ({list.length} total categories)
          </p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg">
          <Plus className="w-4 h-4 mr-1.5" /> Add Main Category
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl rounded-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Store Hierarchy Tree</h2>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full font-mono text-xs px-2.5 py-0.5">
              {list.length} Total
            </Badge>
          </div>
          <span className="text-xs text-slate-400 font-medium">Click arrow to collapse/expand subcategories</span>
        </div>

        <div className="p-6">
          {loading && list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <UploadCloud className="h-10 w-10 animate-bounce mb-3 text-blue-400" />
              <p className="text-xs font-semibold">Loading Store Category Tree...</p>
            </div>
          ) : mainCategories.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40 p-8">
              <FolderTree className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-bold mb-1">No categories created yet</p>
              <p className="text-xs text-slate-400 mb-4">Click below to create your main categories (Eyeglasses, Sunglasses, Contact Lenses, Accessories).</p>
              <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">
                <Plus className="w-4 h-4 mr-1.5" /> Create First Main Category
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mainCategories.map(mainCat => {
                const subs = getSubcategories(mainCat._id)
                const isExpanded = expandedParents.includes(mainCat._id)
                const isAccessory = mainCat.name?.toLowerCase().includes('accessor') || mainCat.slug?.toLowerCase().includes('accessor')

                return (
                  <div key={mainCat._id} className="border border-slate-800 rounded-2xl bg-slate-950/80 overflow-hidden shadow-lg">
                    {/* Main Category Header Row */}
                    <div className="p-4 flex items-center justify-between group hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => toggleExpand(mainCat._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                        </button>
                        <div className="h-11 w-11 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                          {mainCat.image ? (
                            <img src={getImageUrl(mainCat.image)} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-white text-base">{mainCat.name}</h3>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] uppercase font-bold">Main Category</Badge>
                            {isAccessory && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] uppercase font-black flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" /> Care Kits & Accessories
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 font-medium">
                            {subs.length} subcategories • {mainCat.description || 'Main catalog section'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCreateSub(mainCat)}
                          className="text-xs font-bold text-blue-400 hover:text-white hover:bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-1"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Subcategory
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:bg-blue-500/10 rounded-lg" onClick={() => openEdit(mainCat)}>
                           <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10 rounded-lg" onClick={() => handleRemove(mainCat._id)}>
                           <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Subcategories Container */}
                    {isExpanded && (
                      <div className="bg-slate-900/90 border-t border-slate-800 p-3 space-y-2">
                        {subs.length === 0 ? (
                           <div className="py-3 pl-14 text-xs text-slate-500 flex items-center gap-2">
                             <span>No subcategories added yet.</span>
                             <button onClick={() => openCreateSub(mainCat)} className="text-blue-400 font-bold hover:underline">
                               + Add First Subcategory under {mainCat.name}
                             </button>
                           </div>
                        ) : subs.map(sub => {
                          const subsubs = getSubcategories(sub._id)
                          return (
                            <div key={sub._id} className="space-y-1.5">
                              {/* Subcategory Row */}
                              <div className="p-3 pl-10 flex items-center justify-between hover:bg-slate-800/60 rounded-xl border border-slate-800/60 bg-slate-950/60 group/sub">
                                <div className="flex items-center gap-3">
                                  <ChevronRight className="w-4 h-4 text-blue-400" />
                                  <div>
                                    <span className="text-sm font-bold text-slate-200">{sub.name}</span>
                                    <span className="text-[10px] text-slate-500 ml-2 font-mono">(Subcategory)</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openCreateSub(sub)}
                                    className="text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-2.5 py-1 border border-slate-700"
                                  >
                                    <Plus className="w-3 h-3 mr-1 text-blue-400" /> Add Type
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:bg-blue-500/10 rounded-lg" onClick={() => openEdit(sub)}>
                                      <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/10 rounded-lg" onClick={() => handleRemove(sub._id)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Sub-Subcategories Row */}
                              {subsubs.length > 0 && (
                                <div className="pl-16 space-y-1.5 pb-1">
                                  {subsubs.map(ss => (
                                    <div key={ss._id} className="p-2.5 flex items-center justify-between hover:bg-slate-800/40 rounded-lg border border-slate-800/40 bg-slate-950/30 pl-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <span className="text-xs font-semibold text-slate-300">{ss.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-400 hover:bg-blue-500/10 rounded" onClick={() => openEdit(ss)}>
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-500/10 rounded" onClick={() => handleRemove(ss._id)}>
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Modal Dialog for Category Form */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white p-0 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
             <Tag className="h-5 w-5 text-blue-400" />
             <DialogTitle className="text-lg font-extrabold text-white">
               {editingId ? 'Edit Category' : 'Create Category / Subcategory'}
             </DialogTitle>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-slate-300 font-bold">Category Name *</Label>
                    <Input 
                      placeholder="e.g. Eyeglasses, Accessories, Cleaning Sprays" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-11 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-slate-300 font-bold">Category Level</Label>
                    <Select 
                      value={formData.level} 
                      onValueChange={(val: any) => setFormData({...formData, level: val})}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-11">
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="main" className="bg-slate-900 text-white hover:bg-slate-800">Main Category (e.g. Eyeglasses, Accessories)</SelectItem>
                        <SelectItem value="sub" className="bg-slate-900 text-white hover:bg-slate-800">Subcategory (e.g. Cleaning Sprays, Cases)</SelectItem>
                        <SelectItem value="subsub" className="bg-slate-900 text-white hover:bg-slate-800">Sub-subcategory (e.g. Anti-Fog Spray)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.level === 'sub' || formData.level === 'subsub') && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-slate-300 font-bold">Parent Category *</Label>
                      <Select 
                        value={formData.parentId} 
                        onValueChange={val => setFormData({...formData, parentId: val})}
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-11">
                          <SelectValue placeholder="Select Parent Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          {formData.level === 'sub' 
                            ? mainCategories.map(c => <SelectItem key={c._id} value={c._id} className="bg-slate-900 text-white">{c.name}</SelectItem>)
                            : subCategories.map(c => <SelectItem key={c._id} value={c._id} className="bg-slate-900 text-white">{c.name}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <Label className="text-xs font-bold text-white cursor-pointer" htmlFor="lens">Allow Prescription Lens Selection</Label>
                          <p className="text-[10px] text-slate-400">Keep OFF for Accessories & Care Kits</p>
                        </div>
                        <Switch id="lens" checked={formData.allowLensSelection} onCheckedChange={val => setFormData({...formData, allowLensSelection: val})} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <Label className="text-xs font-bold text-white cursor-pointer" htmlFor="frame">Show Eyewear Frame Details</Label>
                          <p className="text-[10px] text-slate-400">Keep OFF for Accessories & Care Kits</p>
                        </div>
                        <Switch id="frame" checked={formData.showFrameDetails} onCheckedChange={val => setFormData({...formData, showFrameDetails: val})} />
                    </div>
                  </div>
               </div>

               {/* Right Column - Image Upload */}
               <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-slate-300 font-bold block">Category Icon / Cover Photo</Label>
                  <div className="bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 hover:border-blue-500/50 transition-all cursor-pointer relative min-h-[220px]">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      onChange={handleImageUpload}
                    />
                    
                    {previewUrl ? (
                      <div className="relative w-full aspect-square max-w-[140px]">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3">
                           <UploadCloud className="h-7 w-7 text-blue-400" />
                        </div>
                        <p className="text-xs font-bold text-white">Upload Icon / Photo</p>
                        <p className="text-[10px] text-slate-500 mt-1">PNG, WEBP, JPG up to 5MB</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-800">
               <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1 text-slate-400 hover:text-white">Cancel</Button>
               <Button type="submit" disabled={isUploading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider">
                  {isUploading ? 'Saving...' : editingId ? 'Save Changes' : 'Create Category'}
               </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CategoriesPage