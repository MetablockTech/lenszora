import React from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useSidebar, Sidebar, SidebarProvider, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Package, Tag, ShoppingCart, Users, Settings, LogOut, Percent, Link2, LayoutDashboard, Info, Menu, MapPin, ChevronDown, Clock, CheckCircle2, XCircle, Layers, Image as ImageIcon, Calendar, MessageSquare, Gift, Sparkles } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { clearToken, getToken, getUser, products } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { getImageUrl } from '@/lib/utils'

const AdminLayout: React.FC = () => {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const token = getToken()
  const user = getUser()

  const [stats, setStats] = React.useState({ pending: 0, active: 0, rejected: 0 })

  const fetchStats = async () => {
    if (token && user?.role === 'admin') {
      try {
        const data = await products.stats(token)
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch product stats', err)
      }
    }
  }

  const userRole = user?.role
  const userId = user?.id

  React.useEffect(() => {
    if (!token || userRole !== 'admin') {
      navigate('/admin/login')
    } else {
      fetchStats()
      const interval = setInterval(fetchStats, 30000) // Update every 30s
      return () => clearInterval(interval)
    }
  }, [token, userRole, userId, navigate])

  function handleLogout() {
    clearToken()
    navigate('/')
  }

  if (!token || !user || user.role !== 'admin') {
    return null
  }

  const [searchParams] = useSearchParams()
  const currentLevel = searchParams.get('level')

  const isCategorySetupActive = location.pathname.startsWith('/admin/categories') || location.pathname.startsWith('/admin/lens-manager')
  const isVendorManagementActive = location.pathname.startsWith('/admin/vendors')
  const isVendorProductsActive = location.pathname.startsWith('/admin/vendor-products')
  const activeClass = "bg-blue-600 text-white shadow-md hover:bg-blue-600 hover:text-white transition-all duration-200"
  const inactiveClass = "text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"

  const activeSubClass = "bg-blue-600 text-white font-bold shadow-sm"
  const inactiveSubClass = "text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-slate-50">
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="z-20 bg-slate-900 border-r border-slate-800">
          <SidebarHeader className="border-b border-slate-800 p-4">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white overflow-hidden">
                {settings.logoUrl ? (
                  <img
                    src={getImageUrl(settings.logoUrl)}
                    alt={settings.websiteName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  settings.websiteName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="font-bold text-white group-data-[collapsible=icon]:hidden">{settings.websiteName}</span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="mt-2 px-2 overflow-x-hidden scrollbar-hide">
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <NavLink to="/admin" end>
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <LayoutDashboard className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/products">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Package className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Products</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/accessories">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
                        <span className="group-data-[collapsible=icon]:hidden font-medium">Accessories</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/gallery">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <ImageIcon className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Gallery</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>              <SidebarMenuItem>
                <NavLink to="/admin/bulk-products">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <ShoppingCart className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Wholesale Orders</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/product-inquiries">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <MessageSquare className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Inquiries</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/sliders">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Layers className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Sliders</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <NavLink to="/admin/stores">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <MapPin className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Stores</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <NavLink to="/admin/appointments">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Calendar className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Appointments</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              {/* Category Setup Hierarchy */}
              <Collapsible defaultOpen={isCategorySetupActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={isCategorySetupActive ? "bg-slate-800 text-blue-400 font-medium" : inactiveClass}>
                      <Tag className="w-5 h-5 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">Category Setup</span>
                      <ChevronDown className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mt-1 ml-4 border-l border-slate-700/50 space-y-1">
                      <SidebarMenuSubItem>
                        <Link to="/admin/categories?level=main">
                          <SidebarMenuSubButton isActive={currentLevel === 'main'} className={`w-full ${currentLevel === 'main' ? activeSubClass : inactiveSubClass}`}>
                            <span>Categories</span>
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Link to="/admin/categories?level=sub">
                          <SidebarMenuSubButton isActive={currentLevel === 'sub'} className={`w-full ${currentLevel === 'sub' ? activeSubClass : inactiveSubClass}`}>
                            <span>Sub Categories</span>
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Link to="/admin/categories?level=subsub">
                          <SidebarMenuSubButton isActive={currentLevel === 'subsub'} className={`w-full ${currentLevel === 'subsub' ? activeSubClass : inactiveSubClass}`}>
                            <span>Sub Sub Categories</span>
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/eyewear-attributes">
                          {({ isActive }) => (
                            <SidebarMenuSubButton isActive={isActive} className={`w-full ${isActive ? activeSubClass : inactiveSubClass}`}>
                              <span>Eyewear Attributes</span>
                            </SidebarMenuSubButton>
                          )}
                        </NavLink>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/lens-manager">
                          {({ isActive }) => (
                            <SidebarMenuSubButton isActive={isActive} className={`w-full ${isActive ? activeSubClass : inactiveSubClass}`}>
                              <span>Lens Management</span>
                            </SidebarMenuSubButton>
                          )}
                        </NavLink>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <NavLink to="/admin/brands">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Tag className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Brands</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              {/* Vendor Management Hierarchy */}
              <Collapsible defaultOpen={isVendorManagementActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={isVendorManagementActive ? "bg-slate-800 text-blue-400 font-medium" : inactiveClass}>
                      <Users className="w-5 h-5 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">Vendor Management</span>
                      <ChevronDown className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mt-1 ml-4 border-l border-slate-700/50 space-y-1">
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/vendors" end>
                          {({ isActive }) => (
                            <SidebarMenuSubButton isActive={isActive} className={`w-full ${isActive ? activeSubClass : inactiveSubClass}`}>
                              <span>Vendor List</span>
                            </SidebarMenuSubButton>
                          )}
                        </NavLink>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/vendors/create">
                          {({ isActive }) => (
                            <SidebarMenuSubButton isActive={isActive} className={`w-full ${isActive ? activeSubClass : inactiveSubClass}`}>
                              <span>Create Vendor</span>
                            </SidebarMenuSubButton>
                          )}
                        </NavLink>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <NavLink to="/admin/vendors/withdraws">
                          {({ isActive }) => (
                            <SidebarMenuSubButton isActive={isActive} className={`w-full ${isActive ? activeSubClass : inactiveSubClass}`}>
                              <span>Withdraws List</span>
                            </SidebarMenuSubButton>
                          )}
                        </NavLink>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Vendor Products Workflow */}
              <Collapsible defaultOpen={isVendorProductsActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={isVendorProductsActive ? "bg-slate-800 text-blue-400 font-medium" : inactiveClass}>
                      <Package className="w-5 h-5 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">Vendor Products</span>
                      <ChevronDown className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mt-1 ml-4 border-l border-slate-700/50 space-y-1">
                      <SidebarMenuSubItem>
                        <Link to="/admin/vendor-products?status=pending">
                          <SidebarMenuSubButton isActive={currentLevel === 'pending' || (isVendorProductsActive && searchParams.get('status') === 'pending')} className={`w-full justify-between items-center py-2 h-auto gap-2 pr-2 ${searchParams.get('status') === 'pending' ? activeSubClass : inactiveSubClass}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="truncate whitespace-normal text-left leading-tight">New Product Request</span>
                            </div>
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center shrink-0">{stats.pending}</span>
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Link to="/admin/vendor-products?status=active">
                          <SidebarMenuSubButton isActive={searchParams.get('status') === 'active'} className={`w-full justify-between items-center py-2 h-auto gap-2 pr-2 ${searchParams.get('status') === 'active' ? activeSubClass : inactiveSubClass}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="truncate whitespace-normal text-left leading-tight">Approved Products</span>
                            </div>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center shrink-0">{stats.active}</span>
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Link to="/admin/vendor-products?status=rejected">
                          <SidebarMenuSubButton isActive={searchParams.get('status') === 'rejected'} className={`w-full justify-between items-center py-2 h-auto gap-2 pr-2 ${searchParams.get('status') === 'rejected' ? activeSubClass : inactiveSubClass}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="truncate whitespace-normal text-left leading-tight">Denied Products</span>
                            </div>
                            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center shrink-0">{stats.rejected}</span>
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <NavLink to="/admin/orders">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <ShoppingCart className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Orders</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>



              <SidebarMenuItem>
                <NavLink to="/admin/return-requests">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Package className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Returns</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/users">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Users className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Users</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/pincodes">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <MapPin className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Pincodes</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/social-links">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Link2 className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Social Links</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/contact-info">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Info className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Contact Info</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/navigation-manager">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Menu className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Navigation Setup</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/referrals">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Gift className="w-5 h-5 shrink-0 text-amber-400" />
                        <span className="group-data-[collapsible=icon]:hidden">Referrals & Coupons</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <NavLink to="/admin/settings">
                  {({ isActive }) => (
                    <SidebarMenuButton asChild isActive={isActive} className={isActive ? activeClass : inactiveClass}>
                      <a>
                        <Settings className="w-5 h-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-700 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-lg p-2 hover:bg-slate-700/50 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/logo192.png" />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">AD</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-white group-data-[collapsible=icon]:hidden">{settings.websiteName} Admin</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

        <SidebarInset className="bg-slate-50 flex flex-col overflow-hidden">
          <div className="border-b border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:gap-4">
                <SidebarTrigger className="lg:hidden text-slate-900">
                  <Menu className="h-6 w-6" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-xl lg:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-sm text-slate-500 mt-1 hidden lg:block">Manage products, orders, users and site settings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {token ? (
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="w-4 h-4 lg:mr-2" />
                    <span className="hidden lg:inline">Logout</span>
                  </Button>
                ) : (
                  <Link to="/admin/login"><Button size="sm">Login</Button></Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider >
  )
}

export default AdminLayout
