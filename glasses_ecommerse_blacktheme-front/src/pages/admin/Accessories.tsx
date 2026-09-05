import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { products, categories, getToken } from '@/lib/api'
import { Edit2, Trash2, Image as ImageIcon, RotateCcw, Search, Plus, Sparkles, ShieldCheck, Tag } from 'lucide-react'
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
      // Filter categories to only accessory categories or all
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
      // Query products by category=accessories or keyword fallback
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
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-500" />
            Eyewear Accessories & Care Kits
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage cleaning sprays, microfiber cloths, hard cases, pouches, chains & care kits ({list.length} items total)</p>
        </div>
        <Button
          onClick={() => navigate('/admin/accessories/new')}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-md"
        >
          <Plus className="w-5 h-5" />
          Add New Accessory
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Search Accessories</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Name, SKU, or tag (e.g. spray, cloth, case)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Sub-Category Filter */}
          <div className="w-full sm:w-56">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm text-slate-900 cursor-pointer"
            >
              <option value="">All Accessory Categories</option>
              {categoryList.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={handleClearFilters}
            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
            title="Clear Filters"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading accessories...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-2 opacity-60" />
          <p className="text-slate-700 font-semibold mb-1">No accessories found</p>
          <p className="text-xs text-slate-400 mb-4">Click "Add New Accessory" to create cleaning kits, sprays, microfiber cloths & cases.</p>
          <Button
            onClick={() => navigate('/admin/accessories/new')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add First Accessory Item
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedList.map((p) => (
              <div key={p._id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={getImageUrl(p.thumbnail || (p.images && p.images.length ? p.images[0] : null))}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-base">{p.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">{p.description || 'No description'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className="font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">₹{p.price}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded">{p.category?.name || 'Accessories'}</span>
                      <span className="text-slate-400 font-mono text-[11px]">SKU: {p.sku}</span>
                      <span className="text-slate-500">Stock: <strong className="text-slate-800">{p.stock}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => navigate(`/admin/accessories/${p._id}`)}
                    className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                    title="Edit Accessory"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
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
            <div className="flex items-center justify-between px-2 py-4 mt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, list.length)} of {list.length} accessories
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 text-slate-600"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 text-slate-600"
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
