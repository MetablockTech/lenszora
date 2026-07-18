import React, { useEffect, useState } from 'react'
import { payouts, getToken } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
    Banknote, 
    Calendar, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Loader2, 
    ArrowUpRight, 
    Info,
    Receipt,
    Wallet
} from 'lucide-react'

const VendorPayouts: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [payoutList, setPayoutList] = useState<any[]>([])

    const fetchPayouts = async () => {
        try {
            setLoading(true)
            const data = await payouts.listVendor(getToken())
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
    }, [])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 px-3 py-1 font-bold uppercase text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>
            case 'cancelled':
                return <Badge className="bg-red-50 text-red-600 border-red-200 px-3 py-1 font-bold uppercase text-[10px]"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>
            case 'pending':
                return <Badge className="bg-blue-50 text-blue-600 border-blue-200 px-3 py-1 font-bold uppercase text-[10px]"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
            default:
                return <Badge variant="outline" className="px-3 py-1 font-bold uppercase text-[10px]">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Fetching earnings history...</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Earnings History</h1>
                    <p className="text-slate-500 mt-1">Track your withdrawal requests and payment status.</p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Transactions</p>
                        <p className="text-xl font-black text-white">{payoutList.length}</p>
                    </div>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-slate-800/30 border-b border-slate-800/50 py-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-950 text-white rounded-xl border border-white/5">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-white">Withdrawal Requests</CardTitle>
                            <CardDescription className="text-xs text-slate-500">All payment transfers recorded on the platform</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {payoutList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Banknote className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No Payouts Yet</h3>
                            <p className="text-slate-500 text-sm max-w-xs mt-1">Once you request a withdrawal from your dashboard, the history will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto text-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-800/30 border-b border-slate-800/50">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Method</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reference</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {payoutList.map((payout) => (
                                        <tr key={payout._id} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                                                    <span className="font-bold text-slate-300">{new Date(payout.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-black text-white">₹{payout.netAmount.toLocaleString()}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-tight">Net Transfer</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <Badge variant="outline" className="bg-slate-950 text-slate-400 border-slate-800 font-black text-[10px] uppercase px-2 py-1">
                                                    {payout.paymentMethod || 'BANK TRANSFER'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5">
                                                {payout.transactionId ? (
                                                    <div className="flex items-center gap-1.5 text-blue-400 font-mono font-black text-xs">
                                                        <span>{payout.transactionId}</span>
                                                        <ArrowUpRight className="w-3 h-3" />
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600 italic text-xs">Awaiting processing</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                {getStatusBadge(payout.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 flex items-start gap-4">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-blue-100">Payment Processing Info</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Withdrawal requests are processed manually by the administrator within 24-72 business hours. 
                        If your request is cancelled, the funds will be automatically returned to your available balance. 
                        In case of failed transfers, please verify your bank details in the profile section.
                    </p>
                </div>
            </div>
            <div className="pb-12" />
        </div>
    )
}

export default VendorPayouts
