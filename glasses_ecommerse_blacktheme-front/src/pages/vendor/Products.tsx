import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { products, getToken } from '@/lib/api'
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const VendorProductsPage: React.FC = () => {
    const navigate = useNavigate()
    const [list, setList] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const token = getToken()

    useEffect(() => { loadAll() }, [])

    async function loadAll() {
        setLoading(true)
        try {
            const p = await products.vendorList(token)
            setList(p)
        } catch (err) {
            console.error(err)
        } finally { setLoading(false) }
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

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const totalPages = Math.ceil(list.length / itemsPerPage)
    const paginatedList = list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Products</h1>
                    <p className="text-sm text-slate-500 mt-1">{list.length} products listed</p>
                </div>
                <Button
                    onClick={() => navigate('/vendor/products/new')}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add New Product
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading your products...</div>
            ) : list.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No products found. Start selling by adding your first product!</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate('/vendor/products/new')}
                    >
                        Create Product
                    </Button>
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
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        {p.status === 'rejected' && p.rejectionReason && (
                                            <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600 flex items-start gap-2">
                                                <div className="font-semibold shrink-0">Reason:</div>
                                                <div>{p.rejectionReason}</div>
                                            </div>
                                        )}
                                        <p className="text-sm text-slate-500 line-clamp-2">{p.description || 'No description'}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                            <span className="font-semibold text-slate-900">₹{p.price}</span>
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs">{p.category?.name || 'Uncategorized'}</span>
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs">{p.brand?.name || 'No brand'}</span>
                                            <span className="text-xs text-slate-400">SKU: {p.sku}</span>
                                            <span className="text-xs text-slate-400">Stock: {p.stock}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/vendor/products/${p._id}`)}
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
                    {list.length > 0 && (
                        <div className="flex items-center justify-between px-2 py-4 mt-4 border-t border-slate-200">
                            <div className="text-sm text-slate-500">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, list.length)} of {list.length} products
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
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
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default VendorProductsPage
