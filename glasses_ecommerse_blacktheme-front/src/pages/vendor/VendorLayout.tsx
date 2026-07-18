import React, { useEffect, useState } from 'react'
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    User,
    DollarSign,
    LogOut,
    Menu,
    Store,
    Layers,
    ChevronDown,
    Settings,
    Image as ImageIcon,
    MapPin,
    Calendar
} from 'lucide-react'
import {
    Sidebar,
    SidebarProvider,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarInset,
    SidebarTrigger
} from '@/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/context/SettingsContext'
import { clearToken, getToken, getUser, API_URL } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'

export default function VendorLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { settings } = useSettings()
    const [vendor, setVendor] = useState<any>(null)
    const token = getToken()
    const user = getUser()

    const userRole = user?.role
    const userId = user?.id

    useEffect(() => {
        if (!token || userRole !== 'vendor') {
            navigate('/vendor/login')
            return
        }

        fetchVendorProfile()
    }, [token, userRole, userId, navigate])

    const fetchVendorProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/api/vendors/profile/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setVendor(data)
            }
        } catch (error) {
            console.error('Error fetching vendor profile:', error)
        }
    }

    const handleLogout = () => {
        clearToken()
        localStorage.removeItem('userRole')
        navigate('/vendor/login')
    }

    const navItems = [
        { path: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/vendor/products', icon: Package, label: 'Products' },
        { path: '/vendor/orders', icon: ShoppingCart, label: 'Customer Orders' },
        { path: '/vendor/purchases', icon: Package, label: 'My Bulk Purchases' },
        { path: '/vendor/payouts', icon: DollarSign, label: 'Payouts' },
        { path: '/vendor/profile', icon: User, label: 'Profile' },
        { path: '/vendor/stores', icon: MapPin, label: 'My Stores' },
        { path: '/vendor/bulk-marketplace', icon: ShoppingCart, label: 'Bulk Marketplace' },
        { path: '/vendor/appointments', icon: Calendar, label: 'Appointments' },
    ]

    const activeClass = "bg-blue-600 text-white shadow-md hover:bg-blue-600 hover:text-white transition-all duration-200"
    const inactiveClass = "text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"

    if (!token || user?.role !== 'vendor') return null

    return (
        <SidebarProvider defaultOpen>
            <div className="flex h-screen w-full bg-slate-50 font-sans">
                <Sidebar side="left" variant="sidebar" collapsible="icon" className="z-20 bg-slate-900 border-r border-slate-800 shadow-xl">
                    <SidebarHeader className="border-b border-slate-800 p-4">
                        <Link to="/vendor/dashboard" className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white overflow-hidden">
                                {settings.logoUrl ? (
                                    <img
                                        src={getImageUrl(settings.logoUrl)}
                                        alt={settings.websiteName}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <Store className="w-5 h-5" />
                                )}
                            </div>
                            <span className="font-bold text-white group-data-[collapsible=icon]:hidden">Vendor Panel</span>
                        </Link>
                    </SidebarHeader>

                    <SidebarContent className="mt-2 px-2 overflow-x-hidden scrollbar-hide">
                        <SidebarMenu className="gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <SidebarMenuItem key={item.path}>
                                        <NavLink to={item.path} end={item.path === '/vendor/dashboard'}>
                                            {({ isActive }) => (
                                                <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                                                    <a>
                                                        <Icon className="w-5 h-5 shrink-0" />
                                                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                                                    </a>
                                                </SidebarMenuButton>
                                            )}
                                        </NavLink>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-slate-800 p-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex w-full items-center gap-2 rounded-lg p-2 hover:bg-slate-700/50 transition-colors">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                                            {user.name?.charAt(0) || 'V'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                                        <span className="text-sm font-medium text-white truncate w-full">
                                            {vendor?.businessName || user.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 capitalize">
                                            {vendor?.verificationStatus || 'Vendor'}
                                        </span>
                                    </div>
                                    <ChevronDown className="ml-auto w-4 h-4 text-slate-400 group-data-[collapsible=icon]:hidden" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => navigate('/vendor/profile')}>
                                    <User className="w-4 h-4 mr-2" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/vendor/profile')}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset className="bg-slate-50 flex flex-col overflow-hidden">
                    <header className="border-b border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 lg:gap-4">
                                <SidebarTrigger className="lg:hidden text-slate-900">
                                    <Menu className="h-6 w-6" />
                                </SidebarTrigger>
                                <div>
                                    <h1 className="text-xl lg:text-3xl font-bold text-slate-900">
                                        {navItems.find(item => location.pathname === item.path)?.label || 'Vendor Dashboard'}
                                    </h1>
                                    <p className="text-sm text-slate-500 mt-1 hidden lg:block">
                                        Hello, {vendor?.businessName || user.name}! Manage your business here.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {vendor?.verificationStatus === 'approved' ? (
                                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs font-semibold">Verified Merchant</span>
                                    </div>
                                ) : (
                                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-xs font-semibold">Verification Pending</span>
                                    </div>
                                )}
                                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <LogOut className="w-4 h-4 lg:mr-2" />
                                    <span className="hidden lg:inline">Logout</span>
                                </Button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto p-6 lg:p-8">
                        <Outlet />
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
