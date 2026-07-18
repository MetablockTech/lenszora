import React, { useEffect, useState } from 'react'
import { payouts, getToken } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import {
    Banknote,
    Calendar,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Loader2,
    Building2,
    CreditCard,
    ExternalLink
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Payout {
    _id: string
    vendorId: {
        businessName: string
        email: string
        bankDetails?: {
            bankName: string
            accountNumber: string
            accountHolderName: string
            ifscCode: string
            branch?: string
            upiId?: string
        }
    }
    amount: number
    commissionDeducted: number
    netAmount: number
    status: 'pending' | 'completed' | 'cancelled'
    periodStart: string
    periodEnd: string
    createdAt: string
    transactionId?: string
    paymentMethod?: string
    notes?: string
}

const WithdrawalsListPage: React.FC = () => {
    const [payoutList, setPayoutList] = useState<Payout[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('')

    const fetchPayouts = async () => {
        try {
            setLoading(true)
            const data = await payouts.list(getToken(), { status: statusFilter })
            // Assuming backend returns an object with payouts array or direct array
            setPayoutList(Array.isArray(data) ? data : data.payouts || [])
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch payouts',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPayouts()
    }, [statusFilter])

    const handleUpdateStatus = async (payoutId: string, status: string) => {
        try {
            await payouts.updateStatus(payoutId, { status }, getToken())
            toast({
                title: 'Success',
                description: `Payout status updated to ${status}`,
            })
            fetchPayouts()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update payout status',
                variant: 'destructive'
            })
        }
    }

    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    const filteredPayouts = payoutList.filter(payout =>
        payout.vendorId?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.vendorId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage)
    const paginatedList = filteredPayouts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-2 py-0.5"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2 py-0.5"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Withdrawals</h1>
                    <p className="text-slate-500 mt-1">Review and process vendor payout requests.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    >
                        <option value="">All Withdrawals</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by vendor..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border/30 rounded-xl overflow-hidden shadow-sm bg-white">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Loading withdrawals...</p>
                    </div>
                ) : filteredPayouts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground font-medium">No withdrawal requests found</p>
                        <p className="text-muted-foreground/80 text-sm">New requests will appear here</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payout Details</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedList.map((payout) => (
                                    <tr key={payout._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{payout.vendorId?.businessName || 'N/A'}</div>
                                                    <div className="text-xs text-slate-500">{payout.vendorId?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold text-[10px] uppercase border-blue-100">
                                                        {payout.paymentMethod || 'BANK TRANSFER'}
                                                    </Badge>
                                                </div>
                                                {payout.vendorId?.bankDetails ? (
                                                    <div className="text-[11px] leading-tight text-slate-500">
                                                        <span className="font-semibold text-slate-700">{payout.vendorId.bankDetails.bankName}</span><br />
                                                        A/C: <span className="text-slate-600 italic">****{payout.vendorId.bankDetails.accountNumber.slice(-4)}</span><br />
                                                        <span className="text-blue-500 uppercase font-bold">{payout.vendorId.bankDetails.ifscCode}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-amber-500 italic">No linked bank details</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-0.5">
                                                <div className="font-bold text-slate-900">₹{payout.netAmount.toLocaleString()}</div>
                                                <div className="text-[10px] text-slate-400">Created: {new Date(payout.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(payout.status)}
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
                                                        onClick={() => handleUpdateStatus(payout._id, 'completed')}
                                                        className="text-green-600"
                                                    >
                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(payout._id, 'cancelled')}
                                                        className="text-red-600"
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" /> Cancel Request
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <ExternalLink className="mr-2 h-4 w-4" /> View Details
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
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPayouts.length)} of {filteredPayouts.length} requests
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

export default WithdrawalsListPage
