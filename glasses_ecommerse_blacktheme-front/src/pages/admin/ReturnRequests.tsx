import React, { useEffect, useState } from 'react'
import { returnRequests } from '@/lib/api'
import { getToken, getImageUrl } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Check, X, Eye, Package, Shield, ExternalLink } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'

const ReturnRequests = () => {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRequest, setSelectedRequest] = useState<any>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterType, setFilterType] = useState('all')
    const token = getToken()

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const totalPages = Math.ceil(requests.length / itemsPerPage)
    const paginatedList = requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    useEffect(() => {
        loadRequests()
    }, [filterStatus, filterType])

    async function loadRequests() {
        setLoading(true)
        try {
            const data = await returnRequests.getAll(token!, {
                status: filterStatus,
                type: filterType
            })
            setRequests(data)
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to load requests",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusUpdate(id: string, status: string, notes?: string) {
        // if (!confirm(`Are you sure you want to mark this request as ${status}?`)) return
        console.log('[DEBUG] starting status update...', { id, status, notes })

        setActionLoading(true)
        try {
            console.log('[DEBUG] calling API...')
            await returnRequests.updateStatus(id, { status, adminNotes: notes }, token!)
            console.log('[DEBUG] API success')
            toast({ title: "Success", description: "Request status updated" })
            setSelectedRequest(null)
            loadRequests()
        } catch (error: any) {
            console.error('[DEBUG] API error', error)
            toast({
                title: "Error",
                description: error.message || "Action failed",
                variant: "destructive"
            })
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Pending</span>
            case 'approved': return <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Approved</span>
            case 'completed': return <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Completed</span>
            case 'rejected': return <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Rejected</span>
            case 'cancelled': return <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Cancelled</span>
            default: return <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">{status}</span>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Returns & Refunds</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage user return requests</p>
                </div>
                <div className="flex gap-4">
                    <select
                        className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="return">Returns</option>
                        <option value="refund">Refunds</option>
                        <option value="exchange">Exchanges</option>
                    </select>
                    <select
                        className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-lg">
                    <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">No requests found matching your filters.</p>
                </div>
            ) : (
                <div className="bg-card rounded-lg border border-border/30 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary text-muted-foreground font-medium border-b border-border/30">
                            <tr>
                                <th className="px-6 py-3">Order</th>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {paginatedList.map((req) => (
                                <tr key={req._id} className="hover:bg-secondary/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">
                                        #{req.orderId?.orderNumber?.slice(-6) || '...'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground">{req.userId?.name || 'Unknown'}</div>
                                        <div className="text-muted-foreground text-xs">{req.userId?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {req.productId?.thumbnail && (
                                                <img
                                                    src={getImageUrl(req.productId.thumbnail)}
                                                    alt=""
                                                    className="w-10 h-10 rounded object-cover border border-border/50"
                                                />
                                            )}
                                            <div className="max-w-[200px] truncate">
                                                <div className="font-medium text-foreground">{req.productId?.title}</div>
                                                {req.variantSku && <div className="text-xs text-muted-foreground">SKU: {req.variantSku}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 capitalize text-foreground">{req.requestType}</td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {new Date(req.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(req.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="text-primary hover:text-primary/90 font-medium text-sm"
                                        >
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {requests.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border/30">
                            <div className="text-sm text-muted-foreground">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, requests.length)} of {requests.length} requests
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
                </div>
            )}

            {/* Details Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                <DialogContent className="max-w-2xl bg-card border-border shadow-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center justify-between text-foreground">
                            <span>Request Details</span>
                            {selectedRequest && getStatusBadge(selectedRequest.status)}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Review request information and take action
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-6 mt-4">
                            {/* Product Info */}
                            <div className="bg-secondary p-4 rounded-lg flex gap-4">
                                {selectedRequest.productId?.thumbnail && (
                                    <img
                                        src={getImageUrl(selectedRequest.productId.thumbnail)}
                                        alt=""
                                        className="w-20 h-20 rounded-md object-cover border border-border/50 bg-card"
                                    />
                                )}
                                <div>
                                    <h4 className="font-medium text-foreground">{selectedRequest.productId?.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">Price: ₹{selectedRequest.productId?.price}</p>
                                    {selectedRequest.variantSku && (
                                        <p className="text-xs text-muted-foreground/80 mt-1">Variant: {selectedRequest.variantSku}</p>
                                    )}
                                </div>
                            </div>

                            {/* Request Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h5 className="text-sm font-semibold text-foreground mb-2">Request Type</h5>
                                    <p className="text-sm capitalize text-muted-foreground bg-secondary inline-block px-3 py-1 rounded">
                                        {selectedRequest.requestType}
                                    </p>
                                </div>
                                <div>
                                    <h5 className="text-sm font-semibold text-foreground mb-2">Reason</h5>
                                    <p className="text-sm text-muted-foreground">{selectedRequest.reason}</p>
                                </div>
                            </div>

                            {selectedRequest.description && (
                                <div>
                                    <h5 className="text-sm font-semibold text-foreground mb-2">Customer Description</h5>
                                    <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md border border-border/30">
                                        {selectedRequest.description}
                                    </p>
                                </div>
                            )}

                            {/* Images */}
                            {selectedRequest.images && selectedRequest.images.length > 0 && (
                                <div>
                                    <h5 className="text-sm font-semibold text-foreground mb-3">Proof Images</h5>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {selectedRequest.images.map((img: string, i: number) => (
                                            <a key={i} href={getImageUrl(img)} target="_blank" rel="noopener noreferrer" className="block shrink-0">
                                                <img
                                                    src={getImageUrl(img)}
                                                    alt={`Proof ${i}`}
                                                    className="w-24 h-24 object-cover rounded-md border border-border/50 hover:opacity-90 transition-opacity"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {selectedRequest.status === 'pending' && (
                                <div className="border-t border-border pt-6 space-y-4">
                                    <h5 className="font-semibold text-foreground">Admin Actions</h5>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleStatusUpdate(selectedRequest._id, 'approved')}
                                            disabled={actionLoading}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Approve Request
                                        </Button>
                                        <Button
                                            onClick={() => handleStatusUpdate(selectedRequest._id, 'rejected')}
                                            disabled={actionLoading}
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Reject Request
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        Approving will effectively start the return/refund process.
                                    </p>
                                </div>
                            )}

                            {selectedRequest.status === 'approved' && (
                                <div className="border-t border-border pt-6">
                                    <Button
                                        onClick={() => handleStatusUpdate(selectedRequest._id, 'completed')}
                                        disabled={actionLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Shield className="h-4 w-4 mr-2" />
                                        Mark as Completed (Refund/Exchange Done)
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ReturnRequests
