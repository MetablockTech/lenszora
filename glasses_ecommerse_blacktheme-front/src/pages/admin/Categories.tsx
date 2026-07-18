import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categories, products } from '@/lib/api'
import { getToken, getImageUrl } from '@/lib/utils'
import { Plus, Edit2, Trash2, X, ChevronDown, ImageIcon, UploadCloud, Check, HelpCircle } from 'lucide-react'
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
  const [searchParams] = useSearchParams()
  const filterLevel = searchParams.get('level') as 'main' | 'sub' | 'subsub' | null

  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [expandedParent, setExpandedParent] = useState<string>('')
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    level: (filterLevel || 'main') as 'main' | 'sub' | 'subsub',
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
    } catch (err) {
      console.error(err)
      toast.error("Failed to load categories")
    } finally { setLoading(false) }
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
    if (!token) return
    
    setLoading(true)
    try {
      let finalImageUrl = formData.image

      // Upload if new file selected
      if (imageFile) {
        setIsUploading(true)
        const res = await products.uploadImage(imageFile, 'categories', undefined, formData.name, token)
        finalImageUrl = res.url
        setIsUploading(false)
      }

      const payload = { 
        ...formData, 
        parentId: formData.parentId || null,
        image: finalImageUrl 
      }
      
      if (editingId) {
        await categories.update(editingId, payload, token)
        toast.success("Category updated")
      } else {
        await categories.create(payload, token)
        toast.success("Category created")
      }
      
      await load()
      setShowModal(false)
    } catch (err: any) {
      toast.error(err.message || "Save failed")
    } finally {
      setLoading(false)
      setIsUploading(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Delete this category? Products might lose their category reference.')) return
    try {
      await categories.remove(id, token)
      toast.success("Category deleted")
      await load()
    } catch (err: any) {
      toast.error(err.message || "Delete failed")
    }
  }

  const mainCategories = list.filter((c) => c.level === 'main')
  const getSubcategories = (parentId: string) => list.filter((c) => c.parentId?._id === parentId || c.parentId === parentId)
  const subCategories = list.filter((c) => c.level === 'sub')

  return (
    <div className="space-y-6 min-h-screen pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-2">
            Category Manager <span className="text-blue-600 text-lg font-normal">(Structure)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your shop hierarchy and homepage icons</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> New Category
        </Button>
      </div>

      <Card className="bg-[#111111] border-white/10 overflow-hidden shadow-2xl rounded-xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">Hierarchy Tree</h2>
            <Badge variant="secondary" className="bg-white/10 text-white rounded-full">{list.length}</Badge>
          </div>
        </div>

        <div className="p-6">
          {loading && list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <UploadCloud className="h-10 w-10 animate-bounce mb-4 text-blue-500/50" />
              <p>Fetching categories...</p>
            </div>
          ) : mainCategories.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-xl">
              <p className="text-slate-500">No categories defined yet.</p>
              <Button variant="link" onClick={openCreate} className="text-blue-500 mt-2">Create your first category</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mainCategories.map(mainCat => {
                const subs = getSubcategories(mainCat._id)
                const isExpanded = expandedParent === mainCat._id

                return (
                  <div key={mainCat._id} className="border border-white/5 rounded-xl bg-white/[0.02] overflow-hidden">
                    <div className="p-4 flex items-center justify-between group hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-black border border-white/10 overflow-hidden flex items-center justify-center p-1">
                          {mainCat.image ? (
                            <img src={getImageUrl(mainCat.image)} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-700" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                            {mainCat.name}
                            {mainCat.level === 'main' && <Badge className="bg-blue-500/10 text-blue-400 border-none text-[10px] h-4">Main</Badge>}
                          </h3>
                          <p className="text-[11px] text-slate-500">{subs.length} subcategories • {mainCat.description || 'No description'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-white"
                          onClick={() => setExpandedParent(isExpanded ? '' : mainCat._id)}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400" onClick={() => openEdit(mainCat)}>
                           <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleRemove(mainCat._id)}>
                           <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-black/40 border-t border-white/5 p-2 space-y-1">
                        {subs.length === 0 ? (
                           <p className="text-[11px] text-slate-600 py-2 pl-14 italic">No subcategories</p>
                        ) : subs.map(sub => {
                          const subsubs = getSubcategories(sub._id)
                          return (
                            <div key={sub._id} className="space-y-1">
                              <div className="p-3 pl-14 flex items-center justify-between hover:bg-white/[0.02] rounded-lg group/sub">
                                <div className="flex items-center gap-3">
                                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                                  <span className="text-sm text-slate-300">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400/70" onClick={() => openEdit(sub)}>
                                      <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/70" onClick={() => handleRemove(sub._id)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                              
                              {subsubs.length > 0 && (
                                <div className="pl-20 space-y-1 pb-2">
                                  {subsubs.map(ss => (
                                    <div key={ss._id} className="p-2 flex items-center justify-between hover:bg-white/[0.01] rounded-md border-l border-white/5 pl-4">
                                      <span className="text-xs text-slate-500">{ss.name}</span>
                                      <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-400/50 hover:text-blue-400" onClick={() => openEdit(ss)}>
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400/50 hover:text-red-400" onClick={() => handleRemove(ss._id)}>
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl bg-[#111111] border-white/10 text-slate-200 p-0 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center gap-2 bg-black/20">
             <Edit2 className="h-5 w-5 text-blue-400" />
             <DialogTitle className="text-xl font-bold text-white">{editingId ? 'Edit' : 'Create'} Category</DialogTitle>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Base Information</Label>
                    <Input 
                      placeholder="Category Name" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="bg-black border-white/10 h-11 focus:ring-blue-500/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold text-[10px]">Hierarchy Level</Label>
                    <Select 
                      value={formData.level} 
                      onValueChange={(val: any) => setFormData({...formData, level: val})}
                    >
                      <SelectTrigger className="bg-black border-white/10 h-11">
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="main">Main Category</SelectItem>
                        <SelectItem value="sub">Subcategory</SelectItem>
                        <SelectItem value="subsub">Sub-subcategory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.level === 'sub' || formData.level === 'subsub') && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold text-[10px]">Parent Category</Label>
                      <Select 
                        value={formData.parentId} 
                        onValueChange={val => setFormData({...formData, parentId: val})}
                      >
                        <SelectTrigger className="bg-black border-white/10 h-11">
                          <SelectValue placeholder="Select parent" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                          {formData.level === 'sub' 
                            ? mainCategories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)
                            : subCategories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                        <Label className="text-sm cursor-pointer" htmlFor="lens">Allow Lens Selection</Label>
                        <Switch id="lens" checked={formData.allowLensSelection} onCheckedChange={val => setFormData({...formData, allowLensSelection: val})} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
                        <Label className="text-sm cursor-pointer" htmlFor="frame">Show Frame Details</Label>
                        <Switch id="frame" checked={formData.showFrameDetails} onCheckedChange={val => setFormData({...formData, showFrameDetails: val})} />
                    </div>
                  </div>
               </div>

               {/* Right Column - Image Upload Area */}
               <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold block mb-2">Category Icon / Image</Label>
                  <div className="bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 group hover:border-blue-500/50 transition-all cursor-pointer relative min-h-[220px]">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      onChange={handleImageUpload}
                    />
                    
                    {previewUrl ? (
                      <div className="relative w-full aspect-square max-w-[140px] animate-in zoom-in-95 duration-300">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain drop-shadow-2xl" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                           <UploadCloud className="text-white h-8 w-8" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                           <UploadCloud className="h-8 w-8 text-blue-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-200">Upload Icon</p>
                        <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-tight">Best for Home Layout</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 text-center px-4 leading-relaxed">
                    Uploaded images are automatically saved to our optimized <strong>/categories</strong> storage.
                  </p>
               </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-white/10">
               <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1 text-slate-400">Cancel</Button>
               <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11">
                 {loading ? <UploadCloud className="animate-spin mr-2 h-4 w-4" /> : editingId ? 'Update Category' : 'Create Category'}
               </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CategoriesPage