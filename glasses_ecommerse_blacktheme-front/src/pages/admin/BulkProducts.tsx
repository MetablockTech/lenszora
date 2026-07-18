import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { products, categories, brands, vendors, getToken } from '@/lib/api'
import { Edit2, Trash2, Image as ImageIcon, RotateCcw, Search, Plus, ShoppingCart } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const BulkProductsPage: React.FC = () => {
  const navigate = useNavigate()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const token = getToken()

  useEffect(() => {
    loadAll()
  }, [searchQuery])

  async function loadAll() {
    setLoading(true)
    try {
      // Fetch products with isBulk=true
      const p = await products.list({
        isBulk: 'true'
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

  async function handleDelete(id: string) {
    if (!confirm('Delete this bulk product?')) return
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-[#DAAB34]" />
            Bulk Product Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Exclusive inventory for Vendors. These products are hidden from the retail shop.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/admin/bulk-products/new')}
          className="bg-[#DAAB34] hover:bg-[#C0962B] text-black shadow-lg shadow-[#DAAB34]/20 px-6 py-6 rounded-xl font-bold flex gap-2 items-center transition-all hover:scale-105 border-0 hover:text-black"
        >
          <Plus className="w-5 h-5" />
          Add Bulk Product
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#DAAB34]" />
          <input
            type="text"
            placeholder="Search bulk products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#DAAB34]/20 focus:border-[#DAAB34] outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 text-slate-500 animate-pulse font-medium">Synchronizing Bulk Inventory...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Bulk Products</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            You haven't listed any products for wholesale yet. Add your first bulk item to start selling to vendors.
          </p>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/bulk-products/new')}
            className="mt-6 border-[#DAAB34]/20 text-[#DAAB34] hover:bg-[#DAAB34]/10"
          >
            Create Bulk Listing
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Wholesale Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedList.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={getImageUrl(p.thumbnail || (p.images && p.images.length ? p.images[0] : null))}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-[#DAAB34] transition-colors">{p.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5 font-medium">SKU: {p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-700">{p.stock} Units</div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Current Stock</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-lg font-black text-slate-900">₹{p.price}</div>
                    <div className="text-[10px] text-[#DAAB34] font-bold uppercase tracking-tight">Bulk Rate</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={p.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                      {p.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(`/admin/bulk-products/${p._id}`)}
                        className="w-10 h-10 rounded-xl text-[#DAAB34] hover:bg-[#DAAB34]/10"
                       >
                         <Edit2 className="w-5 h-5" />
                       </Button>
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(p._id)}
                        className="w-10 h-10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white"
                       >
                         <Trash2 className="w-5 h-5" />
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="bg-white"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="bg-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BulkProductsPage
