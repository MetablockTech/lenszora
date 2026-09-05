import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { products, categories, getToken } from '@/lib/api'
import { Edit2, Trash2, Image as ImageIcon, RotateCcw, Search, Plus, Sparkles, ShieldCheck, Tag, PackageCheck } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const AccessoriesAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [categoryList, setCategoryList] = useState<any[]>([])

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const token = getToken()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadAccessories()
    setCurrentPage(1)
  }, [selectedCategory, searchQuery])

  async function loadInitialData() {
    try {
      const cats = await categories.list()
      const accessoryCats = cats.filter((c: any) => 
        c.name.toLowerCase().includes('accessor') || 
        c.slug?.toLowerCase().includes('accessor') ||
        c.name.toLowerCase().includes('care') ||
        c.name.toLowerCase().includes('clean') ||
        c.name.toLowerCase().includes('case')
      )
      setCategoryList(accessoryCats.length > 0 ? accessoryCats : cats)
    } catch (err) {
      console.error('Failed to load filter data', err)
    }
  }

  async function loadAccessories() {
    setLoading(true)
    try {
      const p = await products.list({
        category: selectedCategory || 'accessories'
      })

      let filtered = p
      if (searchQuery) {
        filtered = p.filter((item: any) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (Array.isArray(item.searchTags) && item.searchTags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())))
        )
      }

      setList(filtered)
    } catch (err) {
      console.error(err)
    } finally { 
      setLoading(false) 
    }
  }

  const handleClearFilters = () => {
    setSelectedCategory('')
    setSearchQuery('')
    setSearchParams({})
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete accessory item?')) return
    try {
      await products.remove(id, token)
      await loadAccessories()
    } catch (err: any) {
      alert(err.message || 'Delete failed')
    }
  }

  const totalPages = Math.ceil(list.length / itemsPerPage)
  const paginatedList = list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-amber-500" />
            Eyewear Accessories & Care Kits
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Manage cleaning sprays, microfiber cloths, hard cases, travel pouches, chains & care kits ({list.length} items total)
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/accessories/new')}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-5 h-5 text-slate-950" />
          Add New Accessory
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 mb-6 shadow-xl">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">Search Accessories</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Name, SKU, or tag (e.g. spray, cloth, case)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500 outline-none transition-all text-xs text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-60">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500 outline-none transition-all text-xs text-white cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">All Accessory Categories</option>
              {categoryList.map(c => (
                <option key={c._id} value={c._id} className="bg-slate-900 text-white">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={handleClearFilters}
            className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
            title="Clear Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs font-semibold">Loading accessories...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/60 p-8">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-80" />
          <p className="text-white font-extrabold text-base mb-1">No accessories found</p>
          <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">Click "Add New Accessory" to create cleaning kits, sprays, microfiber cloths & hard cases.</p>
          <Button
            onClick={() => navigate('/admin/accessories/new')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add First Accessory Item
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedList.map((p) => (
              <div key={p._id} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-4">
                  <img
                    src={getImageUrl(p.thumbnail || (p.images && p.images.length ? p.images[0] : null))}
                    alt=""
                    className="w-20 h-20 object-contain p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-base">{p.title}</h3>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${p.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">{p.description || 'No description provided'}</p>
                    <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs">
                      <span className="font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-md">₹{p.price}</span>
                      <span className="px-2.5 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 font-semibold rounded-md text-[11px]">{p.category?.name || 'Accessories'}</span>
                      <span className="text-slate-500 font-mono text-[11px]">SKU: {p.sku}</span>
                      <span className="text-slate-400 text-[11px]">Stock: <strong className="text-white">{p.stock}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => navigate(`/admin/accessories/${p._id}`)}
                    className="p-2.5 text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors border border-amber-500/30"
                    title="Edit Accessory"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/30"
                    title="Delete Accessory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {list.length > itemsPerPage && (
            <div className="flex items-center justify-between px-2 py-4 mt-6 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, list.length)} of {list.length} accessories
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 text-xs font-bold border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 text-slate-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 text-xs font-bold border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AccessoriesAdminPage
