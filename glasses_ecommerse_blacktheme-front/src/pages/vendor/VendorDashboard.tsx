import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, DollarSign, TrendingUp, AlertCircle, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { API_URL } from '@/lib/api'

export default function VendorDashboard() {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawMethod, setWithdrawMethod] = useState('Bank Transfer')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}/api/vendors/analytics/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setAnalytics(data)
            }
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        )
    }

    const stats = [
        {
            title: 'Available Balance',
            value: `₹${analytics?.availableBalance?.toLocaleString() || 0}`,
            icon: DollarSign,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/20'
        },
        {
            title: 'Verified Sales',
            value: analytics?.totalSales || 0,
            icon: ShoppingCart,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10'
        },
        {
            title: 'Total Earned',
            value: `₹${analytics?.totalEarned?.toLocaleString() || 0}`,
            icon: TrendingUp,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10'
        },
        {
            title: 'Commission Rate',
            value: `${analytics?.commissionRate || 0}%`,
            icon: AlertCircle,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10'
        }
    ]

    return (
        <div className="space-y-6 lg:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Monitor your business performance and sales.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/vendor/products/new"
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                    </Link>
                </div>
            </div>

            {analytics?.verificationStatus !== 'approved' && (
                <Alert className="border-amber-200 bg-amber-50/50 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 font-medium">
                        {analytics?.verificationStatus === 'pending' && (
                            'Account Verification Pending: Your store is currently being reviewed. Products will be live once approved.'
                        )}
                        {analytics?.verificationStatus === 'rejected' && (
                            'Account Rejected: Please check your business details and contact support.'
                        )}
                        {analytics?.verificationStatus === 'suspended' && (
                            'Account Suspended: Access to some features may be limited.'
                        )}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title} className="bg-slate-900 border-slate-800 shadow-sm overflow-hidden group hover:border-blue-500/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-blue-400 transition-colors">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2.5 rounded-xl ${stat.bgColor} transition-transform group-hover:scale-110`}>
                                    <Icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl lg:text-3xl font-bold text-white transition-colors group-hover:text-blue-50">{stat.value}</div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-slate-900 border-slate-800 shadow-sm">
                    <CardHeader className="border-b border-slate-800/60 bg-slate-800/30 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg text-white">Financial Overview</CardTitle>
                        <Badge variant="outline" className="text-blue-400 border-blue-900/50">AVAILABLE: ₹{analytics?.availableBalance?.toLocaleString() || 0}</Badge>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-inner">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Total Earnings</p>
                                    <p className="text-3xl font-black text-white">₹{analytics?.totalEarned?.toLocaleString() || 0}</p>
                                </div>
                                
                                {/* Bank Details Quick View */}
                                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/50">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Linked Bank Account</h4>
                                    {analytics?.bankDetails ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Bank</span>
                                                <span className="text-slate-300 font-bold">{analytics.bankDetails.bankName}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">A/C No.</span>
                                                <span className="text-slate-300 font-bold">****{analytics.bankDetails.accountNumber?.slice(-4)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Name</span>
                                                <span className="text-slate-300 font-bold">{analytics.bankDetails.accountHolderName}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-amber-500/80 italic">No bank details added yet.</p>
                                    )}
                                    <Link to="/vendor/profile" className="mt-3 block text-center text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase underline underline-offset-4">
                                        Update Payout Settings
                                    </Link>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center gap-4">
                                <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Funds are moved to your <span className="text-blue-300 font-bold">Available Balance</span> once an order delivery is verified using the Customer OTP. 
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => {
                                        setWithdrawAmount(analytics?.availableBalance?.toString() || '');
                                        setShowWithdrawModal(true);
                                    }}
                                    disabled={!analytics?.availableBalance || analytics?.availableBalance <= 0}
                                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg rounded-2xl shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
                                >
                                    WITHDRAW FUNDS
                                </Button>
                                <p className="text-[10px] text-center text-slate-500 italic">Payments are processed within 24-48 hours by the platform.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Withdrawal Modal */}
                {showWithdrawModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Request Withdrawal</h3>
                                <p className="text-xs text-slate-500 mt-1">Available for withdrawal: ₹{analytics?.availableBalance?.toLocaleString()}</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Enter Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-10 pr-4 text-white font-black text-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="0.00"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payout Method / UPI ID</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="e.g., Bank Transfer or UPI ID"
                                        value={withdrawMethod}
                                        onChange={(e) => setWithdrawMethod(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-500 italic ml-1">Default is your linked bank account.</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button 
                                        variant="ghost" 
                                        className="flex-1 h-12 text-slate-400 font-bold hover:bg-slate-800"
                                        onClick={() => setShowWithdrawModal(false)}
                                        disabled={submitting}
                                    >
                                        CANCEL
                                    </Button>
                                    <Button 
                                        className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl active:scale-95 transition-all"
                                        disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > analytics?.availableBalance}
                                        onClick={async () => {
                                            setSubmitting(true);
                                            try {
                                                const token = localStorage.getItem('token') || '';
                                                const res = await fetch(`${API_URL}/api/payouts/request`, {
                                                    method: 'POST',
                                                    headers: { 
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}` 
                                                    },
                                                    body: JSON.stringify({ 
                                                        amount: parseFloat(withdrawAmount),
                                                        paymentMethod: withdrawMethod 
                                                    })
                                                });
                                                if (res.ok) {
                                                    alert('Withdrawal request submitted successfully!');
                                                    setShowWithdrawModal(false);
                                                    fetchAnalytics();
                                                } else {
                                                    const err = await res.json();
                                                    alert(err.message || 'Request failed');
                                                }
                                            } catch (e) {
                                                alert('Network error. Please try again.');
                                            } finally {
                                                setSubmitting(false);
                                            }
                                        }}
                                    >
                                        {submitting ? 'PROCESSING...' : 'CONFIRM REQUEST'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <Card className="bg-slate-900 border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-800/60 bg-slate-800/30">
                        <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        <Link
                            to="/vendor/products/new"
                            className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-900/40 active:scale-[0.98]"
                        >
                            Add New Product
                        </Link>
                        <Link
                            to="/vendor/orders"
                            className="flex items-center justify-center w-full px-4 py-3 border-2 border-slate-700 text-slate-200 font-semibold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                            Review Orders
                        </Link>
                        <Link
                            to="/vendor/profile"
                            className="flex items-center justify-center w-full px-4 py-3 border-2 border-slate-800 text-slate-400 font-medium rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                            Merchant Settings
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
