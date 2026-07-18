import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { products, categories, brands, vendors, getToken } from '@/lib/api'
import { Edit2, Trash2, Image as ImageIcon, RotateCcw, Search } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'

const ProductsPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [categoryList, setCategoryList] = useState<any[]>([])
  const [brandList, setBrandList] = useState<any[]>([])
  const [vendorList, setVendorList] = useState<any[]>([])

  // Filter States
  const [selectedVendor, setSelectedVendor] = useState(searchParams.get('vendorId') || '')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const token = getToken()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadAll()
    setCurrentPage(1)
  }, [selectedVendor, selectedCategory, selectedBrand, selectedStatus, searchQuery])

  useEffect(() => {
    const vendorId = searchParams.get('vendorId')
    if (vendorId) setSelectedVendor(vendorId)
  }, [searchParams])

  async function loadInitialData() {
    try {
      const [cats, brs, vnds] = await Promise.all([
        categories.list(),
        brands.list(),
        vendors.list(token)
      ])
      setCategoryList(cats)
      setBrandList(brs)
      setVendorList(vnds)
    } catch (err) {
      console.error('Failed to load filter data', err)
    }
  }

  async function loadAll() {
    setLoading(true)
    try {
      const p = await products.list({
        category: selectedCategory || undefined,
        brand: selectedBrand || undefined,
        status: selectedStatus || undefined,
        vendorId: selectedVendor || undefined
      })

      let filtered = p
      if (searchQuery) {
        filtered = p.filter((item: any) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      setList(filtered)
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  const handleClearFilters = () => {
    setSelectedVendor('')
    setSelectedCategory('')
    setSelectedBrand('')
    setSelectedStatus('')
    setSearchQuery('')
    setSearchParams({})
  }

  const getVendorName = (vendorId: any) => {
    if (!vendorId) return 'N/A'
    if (typeof vendorId === 'object' && vendorId.businessName) return vendorId.businessName
    const v = vendorList.find(v => v._id === vendorId || v._id === vendorId?._id)
    return v?.businessName || 'N/A'
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete product?')) return
    try {
      await products.remove(id, token)
      await loadAll()
    } catch (err: any) {
      alert(err.message || 'Delete failed')
    }
  }

  const totalPages = Math.ceil(list.length / itemsPerPage)
  const paginatedList = list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">{list.length} products total</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Vendor Filter */}
          <div className="w-full sm:w-48">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-slate-900 cursor-pointer"
            >
              <option value="">All Vendors</option>
              {vendorList.map(v => (
                <option key={v._id} value={v._id}>{v.businessName}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-44">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-slate-900 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categoryList.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="w-full sm:w-44">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-slate-900 cursor-pointer"
            >
              <option value="">All Brands</option>
              {brandList.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-32">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-slate-900 appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={handleClearFilters}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Clear Filters"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading products...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">No products found matching these filters.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedList.map((p) => (
              <div key={p._id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <img
                    src={getImageUrl(p.thumbnail || (p.images && p.images.length ? p.images[0] : null))}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg bg-slate-100"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{p.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{p.description || 'No description'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">₹{p.price}</span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">{p.category?.name || 'Uncategorized'}</span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">{p.brand?.name || 'No brand'}</span>
                      {p.vendorId && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 font-medium rounded text-xs border border-blue-100">
                          Vendor: {getVendorName(p.vendorId)}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">SKU: {p.sku}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/products/${p._id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {list.length > itemsPerPage && (
            <div className="flex items-center justify-between px-2 py-4 mt-4 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, list.length)} of {list.length} products
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                >
                  Previous
                </button>
                <div className="flex gap-1 overflow-x-auto max-w-[200px] scrollbar-hide">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded transition-colors ${currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
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

export default ProductsPage
