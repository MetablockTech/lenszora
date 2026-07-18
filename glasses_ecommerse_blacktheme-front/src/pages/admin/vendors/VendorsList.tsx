import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { vendors, getToken } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import {
    Users as VendorIcon,
    Mail,
    Shield,
    Calendar,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Loader2,
    Building2,
    Phone,
    Package
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Vendor {
    _id: string
    businessName: string
    email: string
    phone: string
    verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
    commissionRate: number
    createdAt: string
    userId?: {
        name: string
        email: string
    }
}

const VendorsListPage: React.FC = () => {
    const navigate = useNavigate()
    const [vendorList, setVendorList] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')

    const fetchVendors = async () => {
        try {
            setLoading(true)
            const data = await vendors.list(getToken(), statusFilter)
            setVendorList(data)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch vendors',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVendors()
    }, [statusFilter])

    const handleUpdateStatus = async (vendorId: string, status: string) => {
        try {
            await vendors.updateStatus(vendorId, { verificationStatus: status }, getToken())
            toast({
                title: 'Success',
                description: `Vendor status updated to ${status}`,
            })
            fetchVendors()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update status',
                variant: 'destructive'
            })
        }
    }

    const filteredVendors = vendorList.filter(vendor =>
        vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const totalPages = Math.ceil(filteredVendors.length / itemsPerPage)
    const paginatedList = filteredVendors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-2 py-0.5"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2 py-0.5"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
            case 'suspended':
                return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200 border-none px-2 py-0.5">Suspended</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Vendors</h1>
                    <p className="text-slate-500 mt-1">Manage vendor profiles, approvals, and commissions.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="suspended">Suspended</option>
                    </select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border/30 rounded-xl overflow-hidden shadow-sm bg-white">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Loading vendors...</p>
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <VendorIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground font-medium">No vendors found</p>
                        <p className="text-muted-foreground/80 text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Business</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedList.map((vendor) => (
                                    <tr key={vendor._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{vendor.businessName}</div>
                                                    <div className="text-xs text-slate-500">Commission: {vendor.commissionRate}%</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="text-sm text-slate-600 flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {vendor.email}
                                                </div>
                                                <div className="text-sm text-slate-500 flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {vendor.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(vendor.verificationStatus)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-500 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(vendor.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(vendor._id, 'approved')}
                                                        className="text-green-600"
                                                    >
                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(vendor._id, 'rejected')}
                                                        className="text-red-600"
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => navigate(`/admin/products?vendorId=${vendor._id}`)}
                                                        className="text-blue-600"
                                                    >
                                                        <Package className="mr-2 h-4 w-4" /> View Products
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(vendor._id, 'suspended')}
                                                    >
                                                        <Shield className="mr-2 h-4 w-4" /> Suspend
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 gap-4">
                                <div className="text-xs text-slate-500 order-2 sm:order-1">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredVendors.length)} of {filteredVendors.length} vendors
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
        </div>
    )
}

export default VendorsListPage
