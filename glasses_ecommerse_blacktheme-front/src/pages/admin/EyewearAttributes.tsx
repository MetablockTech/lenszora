import React, { useEffect, useState } from 'react'
import { eyewearAttributes, products, API_URL } from '@/lib/api'
import { getToken } from '@/lib/api'
import { Plus, Edit2, Trash2, X, Info, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const ATTRIBUTE_TYPES = [
    { id: 'frameShape', label: 'Frame Shape' },
    { id: 'frameMaterial', label: 'Frame Material' },
    { id: 'faceShape', label: 'Face Shape' },
    { id: 'frameType', label: 'Frame Type' },
    { id: 'feature', label: 'Product Feature' },
    { id: 'gender', label: 'Gender' }
]

const EyewearAttributesPage: React.FC = () => {
    const [list, setList] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [type, setType] = useState('frameShape')
    const [filterType, setFilterType] = useState('all')
    const [editing, setEditing] = useState<any | null>(null)
    const [image, setImage] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const token = getToken()

    useEffect(() => { load() }, [])

    async function load() {
        setLoading(true)
        try {
            const data = await eyewearAttributes.list()
            setList(data)
        } catch (err) {
            console.error(err)
        } finally { setLoading(false) }
    }

    function openCreate() {
        setEditing(null)
        setName('')
        setType(filterType !== 'all' ? filterType : 'frameShape')
        setImage(null)
        setShowModal(true)
    }

    function openEdit(attr: any) {
        setEditing(attr)
        setName(attr.name)
        setType(attr.type)
        setImage(attr.image || null)
        setShowModal(true)
    }

    function closeModal() {
        setShowModal(false)
        setEditing(null)
        setImage(null)
    }

    async function save(e?: React.FormEvent) {
        e?.preventDefault()
        try {
            const payload = { name, type, image }
            if (editing && editing._id) await eyewearAttributes.update(editing._id, payload, token)
            else await eyewearAttributes.create(payload, token)
            await load()
            closeModal()
        } catch (err: any) { alert(err.message || 'Save failed') }
    }

    async function remove(id: string) {
        if (!confirm('Delete attribute? This will not affect existing products but will remove it from the selector.')) return
        try {
            await eyewearAttributes.remove(id, token)
            await load()
        } catch (err: any) { alert(err.message || 'Delete failed') }
    }

    const filteredList = filterType === 'all'
        ? list
        : list.filter(item => item.type === filterType)

    const getTypeLabel = (typeId: string) => {
        return ATTRIBUTE_TYPES.find(t => t.id === typeId)?.label || typeId
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Eyewear Attributes</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage dynamic options for product specifications</p>
                </div>
                <Button onClick={openCreate} className="btn-gold group relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]"></div>
                    <Plus className="w-4 h-4 mr-2" />
                    New Attribute
                </Button>
            </div>

            <div className="bg-card rounded-xl border border-border/40 p-1 flex flex-wrap gap-1">
                <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                >
                    All
                </button>
                {ATTRIBUTE_TYPES.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setFilterType(t.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === t.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-24 bg-secondary/20 rounded-xl border border-border/30"></div>
                    ))}
                </div>
            ) : filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card border border-dashed border-border rounded-xl text-center">
                    <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center mb-4 text-muted-foreground">
                        <Info className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">No attributes found</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        {filterType === 'all'
                            ? "Get started by creating your first eyewear attribute to make your product forms more dynamic."
                            : `There are currently no options defined for ${getTypeLabel(filterType)}. Add some to see them here.`}
                    </p>
                    <Button onClick={openCreate} variant="outline" className="mt-6 border-border">
                        <Plus className="w-4 h-4 mr-2" /> Add {filterType === 'all' ? 'Attribute' : getTypeLabel(filterType)}
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredList.map((attr) => (
                        <div key={attr._id} className="group bg-card hover:bg-secondary/5 transition-all p-4 rounded-xl border border-border/40 hover:border-primary/30 flex items-center justify-between shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-4">
                                {attr.image ? (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-border/20 flex items-center justify-center p-1">
                                        <img 
                                            src={attr.image.startsWith('http') ? attr.image : `${API_URL}${attr.image}`} 
                                            alt={attr.name} 
                                            className="w-full h-full object-contain" 
                                        />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-secondary/30 flex items-center justify-center text-muted-foreground">
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground">{attr.name}</span>
                                        {filterType === 'all' && (
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-4 px-1.5 opacity-70">
                                                {attr.type}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Created {new Date(attr.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(attr)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => remove(attr._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100">
                        <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    {editing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </div>
                                <h3 className="text-xl font-bold text-foreground">
                                    {editing ? 'Edit Attribute' : 'New Attribute'}
                                </h3>
                            </div>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={save} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground/80 ml-1">Attribute Category</label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="w-full h-11 bg-background/50 border-border">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ATTRIBUTE_TYPES.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground/80 ml-1">Option Name</label>
                                <input
                                    className="w-full bg-background/50 border border-border h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                                    placeholder="e.g. Aviator, Metallic, Polarized..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground/80 ml-1">Icon / Image (Optional)</label>
                                <div 
                                    className="relative group/upload h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all flex flex-col items-center justify-center bg-background/50 overflow-hidden cursor-pointer"
                                    onClick={() => document.getElementById('attr-image')?.click()}
                                >
                                    {image ? (
                                        <>
                                            <img 
                                                src={image.startsWith('http') ? image : `${API_URL}${image}`} 
                                                className="w-full h-full object-contain p-2" 
                                                alt="Preview" 
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button size="sm" variant="secondary" className="h-8">Change</Button>
                                                <Button size="sm" variant="destructive" className="h-8" onClick={(e) => { e.stopPropagation(); setImage(null); }}>Remove</Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {uploading ? (
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-muted-foreground group-hover/upload:text-primary transition-colors" />
                                                    <span className="text-xs text-muted-foreground mt-2">Upload Shape Icon</span>
                                                </>
                                            )}
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        id="attr-image" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            setUploading(true)
                                            try {
                                                const res = await products.uploadImage(file, 'attributes', type, name, token)
                                                setImage(res.url)
                                            } catch (err: any) { alert(err.message || 'Upload failed') }
                                            finally { setUploading(false) }
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic ml-1 italic">Best for "Frame Shape" icons used on the homepage.</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button className="flex-1 h-11 btn-gold" type="submit">
                                    {editing ? 'Update Changes' : 'Create Option'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-11 border-border text-foreground hover:bg-secondary rounded-xl"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EyewearAttributesPage
