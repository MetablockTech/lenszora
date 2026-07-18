import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { products, getToken } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import {
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Loader2,
    Package,
    Building2,
    Eye,
    ThumbsUp,
    ThumbsDown,
    MoreVertical,
    AlertCircle
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { getImageUrl } from '@/lib/utils'

interface Product {
    _id: string
    title: string
    thumbnail?: string
    images?: string[]
    price: number
    status: 'active' | 'inactive' | 'pending' | 'rejected'
    rejectionReason?: string
    sku: string
    vendorId: {
        businessName: string
        email: string
    }
    createdAt: string
}

const VendorProductsPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const status = searchParams.get('status') || 'pending'

    const [productList, setProductList] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Rejection Dialog State
    const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const data = await products.list({ status })
            setProductList(data)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch products',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
        setCurrentPage(1)
    }, [status])

    const handleUpdateStatus = async (id: string, newStatus: string, reason?: string) => {
        try {
            await products.updateStatus(id, newStatus, getToken(), reason)
            toast({
                title: 'Success',
                description: `Product ${newStatus === 'active' ? 'approved' : 'rejected'} successfully`,
            })
            fetchProducts()
            setRejectionDialogOpen(false)
            setRejectionReason('')
            setSelectedProductId(null)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update status',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const openRejectionDialog = (id: string) => {
        setSelectedProductId(id)
        setRejectionDialogOpen(true)
    }

    const handleRejectSubmit = () => {
        if (!selectedProductId) return
        setSubmitting(true)
        handleUpdateStatus(selectedProductId, 'rejected', rejectionReason)
    }

    const filteredProducts = productList.filter(p =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendorId?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const paginatedList = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const getStatusBadge = (s: string, reason?: string) => {
        switch (s) {
            case 'active':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>
            case 'rejected':
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-2 py-0.5"><XCircle className="w-3 h-3 mr-1" /> Denied</Badge>
                        {reason && (
                            <div className="text-[10px] text-red-500 max-w-[150px] italic leading-tight flex items-center gap-1">
                                <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                <span className="line-clamp-2">{reason}</span>
                            </div>
                        )}
                    </div>
                )
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2 py-0.5"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
            default:
                return <Badge variant="outline">{s}</Badge>
        }
    }

    const getTitle = () => {
        switch (status) {
            case 'pending': return 'New Product Requests'
            case 'active': return 'Approved Products'
            case 'rejected': return 'Denied Products'
            default: return 'Vendor Products'
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{getTitle()}</h1>
                    <p className="text-slate-500 mt-1">Review and manage vendor product submissions.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by title, SKU, or vendor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-500">Loading products...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <Package className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900">No products found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-1">There are no products matching your search or filter criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedList.map((product) => (
                                    <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={getImageUrl(product.thumbnail || (product.images && product.images.length ? product.images[0] : null))}
                                                    alt={product.title}
                                                    className="h-12 w-12 rounded-lg object-cover bg-slate-100 border border-slate-200"
                                                />
                                                <div>
                                                    <div className="font-semibold text-slate-900 line-clamp-1">{product.title}</div>
                                                    <div className="text-xs text-slate-500">SKU: {product.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">{product.vendorId?.businessName || 'N/A'}</div>
                                                    <div className="text-xs text-slate-500">{product.vendorId?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(product.status, product.rejectionReason)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">₹{product.price.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {status === 'pending' ? (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                            onClick={() => handleUpdateStatus(product._id, 'active')}
                                                        >
                                                            <ThumbsUp className="w-4 h-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                            onClick={() => openRejectionDialog(product._id)}
                                                        >
                                                            <ThumbsDown className="w-4 h-4 mr-1" /> Deny
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreVertical className="h-4 w-4 text-slate-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => navigate(`/admin/products/${product._id}`)}>
                                                                <Eye className="w-4 h-4 mr-2" /> View Details
                                                            </DropdownMenuItem>
                                                            {product.status !== 'active' && (
                                                                <DropdownMenuItem className="text-green-600" onClick={() => handleUpdateStatus(product._id, 'active')}>
                                                                    <ThumbsUp className="w-4 h-4 mr-2" /> Approve
                                                                </DropdownMenuItem>
                                                            )}
                                                            {product.status !== 'rejected' && (
                                                                <DropdownMenuItem className="text-red-600" onClick={() => openRejectionDialog(product._id)}>
                                                                    <ThumbsDown className="w-4 h-4 mr-2" /> Deny
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 gap-4">
                                <div className="text-xs text-slate-500 order-2 sm:order-1">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                                </div>
                                <div className="flex items-center gap-2 order-1 sm:order-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 px-3 text-xs"
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
                                                className={`h-8 w-8 p-0 text-xs ${currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}`}
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
                                        className="h-8 px-3 text-xs"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Rejection Dialog */}
            <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <ThumbsDown className="w-5 h-5" /> Deny Product Submission
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason for denying this product. This will help the vendor understand what needs to be improved.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Rejection Reason (Optional)</label>
                            <Textarea
                                placeholder="E.g. Images are low quality, price is too high, etc."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="min-h-[100px] resize-none focus:ring-red-500/20 focus:border-red-500"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex sm:justify-between gap-2">
                        <Button variant="outline" onClick={() => setRejectionDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleRejectSubmit}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ThumbsDown className="w-4 h-4 mr-2" />}
                            Confirm Denial
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default VendorProductsPage
