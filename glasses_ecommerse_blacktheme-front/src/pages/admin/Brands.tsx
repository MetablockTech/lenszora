import React, { useEffect, useState } from 'react'
import { brands, products } from '@/lib/api'
import { getToken } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BrandsPage: React.FC = () => {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [logo, setLogo] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [showModal, setShowModal] = useState(false)
  const token = getToken()

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const totalPages = Math.ceil(list.length / itemsPerPage)
  const paginatedList = list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await brands.list()
      setList(data)
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  function openCreate() {
    setEditing(null)
    setName('')
    setLogo('')
    setLogoFile(null)
    setShowModal(true)
  }

  function openEdit(b: any) {
    setEditing(b)
    setName(b.name)
    setLogo(b.logo || '')
    setLogoFile(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setLogoFile(null)
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    try {
      let finalLogoUrl = logo

      if (logoFile) {
        const res = await products.uploadImage(logoFile, 'brands', '', name, token!)
        finalLogoUrl = res.url
      }

      const payload = { name, logo: finalLogoUrl }
      if (editing && editing._id) await brands.update(editing._id, payload, token)
      else await brands.create(payload, token)
      await load()
      closeModal()
    } catch (err: any) { alert(err.message || 'Save failed') }
    finally { setLoading(false) }
  }

  async function remove(id: string) {
    if (!confirm('Delete brand?')) return
    try { await brands.remove(id, token); await load() } catch (err: any) { alert(err.message || 'Delete failed') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Brands</h1>
          <p className="text-sm text-muted-foreground mt-1">{list.length} brands</p>
        </div>
        <Button onClick={openCreate} className="btn-gold">
          <Plus className="w-4 h-4 mr-2" />
          New Brand
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading brands...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-slate-500">No brands yet.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {paginatedList.map((b) => (
              <div key={b._id} className="bg-card rounded-lg border border-border/30 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{b.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(b)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(b._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {list.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 mt-6 border-t border-border/30">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, list.length)} of {list.length} brands
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-border text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-secondary"}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-border text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-semibold text-foreground">{editing ? 'Edit Brand' : 'New Brand'}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Brand Name</label>
                <input
                  className="w-full bg-background border border-input p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  placeholder="Brand name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Brand Logo</label>
                <div className="flex flex-col gap-2">
                  {logo && (
                    <img src={getImageUrl(logo)} alt="Logo Preview" className="w-16 h-16 object-contain rounded-lg border border-border bg-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setLogoFile(file)
                        setLogo(URL.createObjectURL(file))
                      }
                    }}
                    className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  <input
                    className="w-full bg-background border border-input p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground text-xs"
                    placeholder="Or paste Logo URL"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 btn-gold" type="submit">Save</Button>
                <Button type="button" variant="outline" className="flex-1 border-border text-foreground hover:bg-secondary" onClick={closeModal}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrandsPage
