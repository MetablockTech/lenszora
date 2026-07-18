import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    Package,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    AlertTriangle
} from "lucide-react"
import { getToken, API_URL } from "@/lib/api"
import { getImageUrl } from "@/lib/utils"

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        loadDashboard()
    }, [])

    async function loadDashboard() {
        try {
            setLoading(true)
            const token = getToken()
            const res = await fetch(`${API_URL}/api/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-700 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-slate-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const overview = stats?.overview || {}
    const recentOrders = stats?.recentOrders || []
    const lowStockProducts = stats?.lowStockProducts || []

    const statCards = [
        {
            title: "Total Users",
            value: overview.totalUsers || 0,
            icon: Users,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10"
        },
        {
            title: "Total Products",
            value: overview.totalProducts || 0,
            icon: Package,
            color: "text-green-400",
            bgColor: "bg-green-500/10"
        },
        {
            title: "Total Orders",
            value: overview.totalOrders || 0,
            icon: ShoppingCart,
            color: "text-purple-400",
            bgColor: "bg-purple-500/10"
        },

        {
            title: "Total Revenue",
            value: `₹${(overview.totalRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            color: "text-primary",
            bgColor: "bg-primary/10"
        },
        {
            title: "Avg Order Value",
            value: `₹${Math.round(overview.averageOrderValue || 0).toLocaleString()}`,
            icon: TrendingUp,
            color: "text-cyan-400",
            bgColor: "bg-cyan-500/10"
        }
    ]

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
                <p className="text-slate-500">Welcome back! Here's what's happening with your store.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <Card key={index} className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold">{stat.value}</p>
                                </div>
                                <div className={`${stat.bgColor} p-4 rounded-lg`}>
                                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length > 0 ? (
                            <div className="space-y-4">
                                {recentOrders.map((order: any) => (
                                    <div key={order._id} className="flex items-center justify-between pb-4 border-b border-border/50 last:border-0">
                                        <div>
                                            <p className="font-semibold">{order.orderNumber}</p>
                                            <p className="text-sm text-muted-foreground">{order.userId?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">₹{order.total.toLocaleString()}</p>
                                            <p className={`text-xs px-2 py-1 rounded-full inline-block ${order.orderStatus === 'delivered' ? 'bg-green-500/10 text-green-400' :
                                                order.orderStatus === 'shipped' ? 'bg-blue-500/10 text-blue-400' :
                                                    order.orderStatus === 'processing' ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-gray-500/10 text-gray-400'
                                                }`}>
                                                {order.orderStatus}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No orders yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-400" />
                            Low Stock Alert
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lowStockProducts.length > 0 ? (
                            <div className="space-y-4">
                                {lowStockProducts.map((product: any) => (
                                    <div key={product._id} className="flex items-center gap-4 pb-4 border-b border-border/50 last:border-0">
                                        {product.images?.[0] && (
                                            <img
                                                src={getImageUrl(product.images[0])}
                                                alt={product.title}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold line-clamp-1">{product.title}</p>
                                            <p className="text-sm text-muted-foreground">₹{product.price}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${product.stock === 0 ? 'bg-red-500/10 text-red-400' :
                                            product.stock < 5 ? 'bg-orange-500/10 text-orange-400' :
                                                'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {product.stock} left
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">All products in stock</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
