import React from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Sidebar, SidebarProvider, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Package, Tag, ShoppingCart, Users, Settings, LogOut, Link2, LayoutDashboard, Info, Menu, MapPin, ChevronDown, ChevronRight,
  Layers, Image as ImageIcon, Calendar, MessageSquare, Gift, Sparkles, Eye, UserCheck, Heart, LayoutGrid, Store, RotateCcw,
  Boxes, Navigation, ExternalLink, SlidersHorizontal, Glasses, type LucideIcon,
} from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { clearToken, getToken, getUser, products } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }
type NavGroup = { label: string; items: NavItem[] }

// Sidebar structure. Order inside a group = order on screen.
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/accessories', label: 'Accessories', icon: Sparkles },
      { to: '/admin/categories', label: 'Categories', icon: Tag },
      { to: '/admin/brands', label: 'Brands', icon: Layers },
      { to: '/admin/lens-manager', label: 'Lens Manager', icon: Eye },
      { to: '/admin/eyewear-attributes', label: 'Eyewear Attributes', icon: Glasses },
      { to: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/admin/return-requests', label: 'Returns', icon: RotateCcw },
      { to: '/admin/store-visits', label: 'Store Visits', icon: MapPin },
      { to: '/admin/bulk-products', label: 'Wholesale', icon: Boxes },
      { to: '/admin/referrals', label: 'Referrals & Coupons', icon: Gift },
    ],
  },
  {
    label: 'Customers',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/customer-leads', label: 'Cart & Wishlists', icon: Heart },
      { to: '/admin/appointments', label: 'Appointments', icon: Calendar },
      { to: '/admin/product-inquiries', label: 'Inquiries', icon: MessageSquare },
    ],
  },
  {
    label: 'Storefront',
    items: [
      { to: '/admin/sliders', label: 'Banners & Popups', icon: SlidersHorizontal },
      { to: '/admin/homepage-categories', label: 'Homepage Categories', icon: LayoutGrid },
      { to: '/admin/navigation-manager', label: 'Navigation', icon: Navigation },
      { to: '/admin/stores', label: 'Stores', icon: Store },
      { to: '/admin/pincodes', label: 'Pincodes', icon: MapPin },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/admin/contact-info', label: 'Contact Info', icon: Info },
      { to: '/admin/social-links', label: 'Social Links', icon: Link2 },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

// Titles for pages that are not plain sidebar items (forms, vendor pages)
const EXTRA_TITLES: { prefix: string; title: string; group: string }[] = [
  { prefix: '/admin/products/new', title: 'Add Product', group: 'Catalog' },
  { prefix: '/admin/products/', title: 'Edit Product', group: 'Catalog' },
  { prefix: '/admin/accessories/new', title: 'Add Accessory', group: 'Catalog' },
  { prefix: '/admin/accessories/', title: 'Edit Accessory', group: 'Catalog' },
  { prefix: '/admin/bulk-products/', title: 'Wholesale Product', group: 'Sales' },
  { prefix: '/admin/wholesale-orders', title: 'Wholesale Orders', group: 'Sales' },
  { prefix: '/admin/return-request', title: 'Returns', group: 'Sales' },
  { prefix: '/admin/vendors/create', title: 'Create Vendor', group: 'Vendors' },
  { prefix: '/admin/vendors/withdraws', title: 'Withdrawals', group: 'Vendors' },
  { prefix: '/admin/vendors', title: 'Vendors', group: 'Vendors' },
  { prefix: '/admin/vendor-products', title: 'Vendor Products', group: 'Vendors' },
  { prefix: '/admin/dashboard', title: 'Dashboard', group: 'Overview' },
  { prefix: '/admin/social-links', title: 'Social Links', group: 'Settings' },
]

function getPageMeta(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/admin'
  for (const extra of EXTRA_TITLES) {
    if (path === extra.prefix || path.startsWith(extra.prefix)) return { title: extra.title, group: extra.group }
  }
  let best: { title: string; group: string; len: number } | null = null
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const matches = item.end ? path === item.to : path === item.to || path.startsWith(`${item.to}/`)
      if (matches && (!best || item.to.length > best.len)) best = { title: item.label, group: group.label, len: item.to.length }
    }
  }
  return best ? { title: best.title, group: best.group } : { title: 'Admin', group: '' }
}

// data-[active=true] variants are needed to win over the sidebar component's own active styles
const itemClass = (active: boolean) =>
  active
    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-600 hover:text-white data-[active=true]:bg-blue-600 data-[active=true]:text-white'
    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'

const subItemClass = (active: boolean) =>
  active
    ? 'bg-blue-600/90 text-white font-semibold data-[active=true]:bg-blue-600/90 data-[active=true]:text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'

const AdminLayout: React.FC = () => {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const token = getToken()
  const user = getUser()

  const [stats, setStats] = React.useState({ pending: 0, active: 0, rejected: 0 })

  const userRole = user?.role
  const userId = user?.id

  // Light theme for the whole admin area, including dialogs rendered in portals
  React.useEffect(() => {
    document.documentElement.classList.add('admin-theme')
    return () => document.documentElement.classList.remove('admin-theme')
  }, [])

  React.useEffect(() => {
    const fetchStats = async () => {
      const currentToken = getToken()
      if (!currentToken || userRole !== 'admin') return
      try {
        setStats(await products.stats(currentToken))
      } catch (err) {
        const message = err instanceof Error ? err.message.toLowerCase() : ''
        console.error('Failed to fetch product stats', err)
        if (message.includes('token') || message.includes('unauthorized')) {
          clearToken()
          navigate('/admin/login?expired=1')
        }
      }
    }

    if (!getToken() || userRole !== 'admin') {
      clearToken()
      navigate('/admin/login?expired=1')
      return
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [userRole, userId, navigate])

  function handleLogout() {
    clearToken()
    navigate('/')
  }

  if (!token || !user || user.role !== 'admin') {
    return null
  }

  const isVendorManagementActive = location.pathname.startsWith('/admin/vendors')
  const isVendorProductsActive = location.pathname.startsWith('/admin/vendor-products')
  const vendorProductStatus = isVendorProductsActive ? searchParams.get('status') : null
  const page = getPageMeta(location.pathname)

  const vendorProductLinks = [
    { status: 'pending', label: 'New Requests', count: stats.pending, badge: 'bg-red-500 text-white' },
    { status: 'active', label: 'Approved', count: stats.active, badge: 'bg-emerald-500/20 text-emerald-300' },
    { status: 'rejected', label: 'Denied', count: stats.rejected, badge: 'bg-red-500/20 text-red-300' },
  ]

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-slate-50 text-slate-900">
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="z-20 border-r border-slate-800 [&>div]:bg-slate-950">
          <SidebarHeader className="border-b border-white/[0.06] px-4 py-4">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-bold text-white overflow-hidden">
                {settings.logoUrl ? (
                  <img src={getImageUrl(settings.logoUrl)} alt={settings.websiteName} className="w-full h-full object-contain" />
                ) : (
                  settings.websiteName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="font-bold text-white truncate leading-tight">{settings.websiteName}</p>
                <p className="text-[11px] text-slate-500 leading-tight">Admin panel</p>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-2 py-2 overflow-x-hidden scrollbar-hide">
            {NAV_GROUPS.map((group) => (
              <React.Fragment key={group.label}>
                <SidebarGroup className="px-0 py-1.5">
                  {group.label !== 'Overview' && (
                    <SidebarGroupLabel className="h-6 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{group.label}</SidebarGroupLabel>
                  )}
                  <SidebarMenu className="gap-0.5">
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.to}>
                        <NavLink to={item.to} end={item.end}>
                          {({ isActive }) => (
                            <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} className={`h-9 rounded-lg ${itemClass(isActive)}`}>
                              <span>
                                <item.icon className="w-[18px] h-[18px] shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </span>
                            </SidebarMenuButton>
                          )}
                        </NavLink>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>

                {/* Vendors section sits between Customers and Storefront */}
                {group.label === 'Customers' && (
                  <SidebarGroup className="px-0 py-1.5">
                    <SidebarGroupLabel className="h-6 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Vendors</SidebarGroupLabel>
                    <SidebarMenu className="gap-0.5">
                      <Collapsible defaultOpen={isVendorManagementActive} className="group/collapsible">
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip="Vendors" className={`h-9 rounded-lg ${isVendorManagementActive ? 'text-white bg-white/[0.06]' : itemClass(false)}`}>
                              <UserCheck className="w-[18px] h-[18px] shrink-0" />
                              <span className="truncate">Vendors</span>
                              <ChevronDown className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="mt-1 border-white/10">
                              {[
                                { to: '/admin/vendors', label: 'All Vendors', end: true },
                                { to: '/admin/vendors/create', label: 'Create Vendor' },
                                { to: '/admin/vendors/withdraws', label: 'Withdrawals' },
                              ].map((sub) => (
                                <SidebarMenuSubItem key={sub.to}>
                                  <NavLink to={sub.to} end={sub.end}>
                                    {({ isActive }) => (
                                      <SidebarMenuSubButton asChild isActive={isActive} className={`w-full ${subItemClass(isActive)}`}>
                                        <span>{sub.label}</span>
                                      </SidebarMenuSubButton>
                                    )}
                                  </NavLink>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>

                      <Collapsible defaultOpen={isVendorProductsActive} className="group/collapsible">
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip="Vendor Products" className={`h-9 rounded-lg ${isVendorProductsActive ? 'text-white bg-white/[0.06]' : itemClass(false)}`}>
                              <Package className="w-[18px] h-[18px] shrink-0" />
                              <span className="truncate">Vendor Products</span>
                              {stats.pending > 0 && (
                                <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-5 text-white group-data-[state=open]/collapsible:hidden">{stats.pending}</span>
                              )}
                              <ChevronDown className={`${stats.pending > 0 ? '' : 'ml-auto'} w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[state=open]/collapsible:ml-auto`} />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="mt-1 border-white/10">
                              {vendorProductLinks.map((sub) => (
                                <SidebarMenuSubItem key={sub.status}>
                                  <SidebarMenuSubButton asChild isActive={vendorProductStatus === sub.status} className={`w-full ${subItemClass(vendorProductStatus === sub.status)}`}>
                                    <Link to={`/admin/vendor-products?status=${sub.status}`} className="flex items-center justify-between gap-2">
                                      <span className="truncate">{sub.label}</span>
                                      <span className={`shrink-0 rounded-full px-1.5 text-[10px] font-bold leading-5 ${sub.badge}`}>{sub.count}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    </SidebarMenu>
                  </SidebarGroup>
                )}
              </React.Fragment>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-white/[0.06] p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2.5 rounded-lg p-2 hover:bg-white/[0.06] transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">{(user.name || user.email || 'A').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold text-white truncate">{user.name || 'Admin'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-52">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
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

        <SidebarInset className="bg-slate-50 flex flex-col overflow-hidden min-w-0">
          <header className="flex h-14 lg:h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
            <SidebarTrigger className="text-slate-600 hover:text-slate-900 -ml-1">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div className="min-w-0">
              {page.group && (
                <p className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-400 leading-none mb-1">
                  Admin <ChevronRight className="w-3 h-3" /> {page.group}
                </p>
              )}
              <h1 className="text-base lg:text-lg font-bold text-slate-900 truncate leading-tight">{page.title}</h1>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                <a href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">View Store</span>
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <div className="mx-auto w-full max-w-[1400px]">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default AdminLayout
