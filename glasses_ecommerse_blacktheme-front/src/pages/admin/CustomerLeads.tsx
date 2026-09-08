import React, { useEffect, useState } from 'react'
import { users as usersApi, getToken } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import {
  ShoppingCart,
  Heart,
  Phone,
  MessageCircle,
  Mail,
  Search,
  User,
  Clock,
  Eye,
  X,
  Package,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LeadUser {
  _id: string;
  name?: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  cart?: Array<{
    productId: any;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    lens?: {
      packageName?: string;
      name?: string;
      price: number;
      prescription?: {
        od: { sph: string; cyl: string; axis: string };
        os: { sph: string; cyl: string; axis: string };
        pd: string;
      };
    };
    variant?: any;
    updatedAt?: string;
  }>;
  wishlist?: Array<{
    _id: string;
    title: string;
    price: number;
    image?: string;
    category?: string;
    brand?: string;
    inStock?: boolean;
  }>;
}

export default function CustomerLeads() {
  const token = getToken()
  const [leads, setLeads] = useState<LeadUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'cart' | 'wishlist'>('all')
  const [selectedLead, setSelectedLead] = useState<LeadUser | null>(null)

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    setLoading(true)
    try {
      const data = await usersApi.getActiveLeads(token)
      setLeads(data || [])
    } catch (error) {
      console.error('Failed to load leads:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtered Leads logic
  const filteredLeads = leads.filter((user) => {
    const hasCart = user.cart && user.cart.length > 0
    const hasWishlist = user.wishlist && user.wishlist.length > 0

    if (activeTab === 'cart' && !hasCart) return false
    if (activeTab === 'wishlist' && !hasWishlist) return false

    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    const nameMatch = user.name?.toLowerCase().includes(query)
    const phoneMatch = user.phone?.toLowerCase().includes(query)
    const emailMatch = user.email?.toLowerCase().includes(query)
    const cartMatch = user.cart?.some(item => item.title.toLowerCase().includes(query))
    const wishlistMatch = user.wishlist?.some(item => item.title.toLowerCase().includes(query))

    return nameMatch || phoneMatch || emailMatch || cartMatch || wishlistMatch
  })

  // Calculate Metrics
  const totalLeads = leads.length
  const totalCartValue = leads.reduce((sum, u) => {
    const userCartTotal = (u.cart || []).reduce((cSum, i) => cSum + ((i.price + (i.lens?.price || 0)) * i.quantity), 0)
    return sum + userCartTotal
  }, 0)
  const totalCartCount = leads.filter(u => u.cart && u.cart.length > 0).length
  const totalWishlistCount = leads.filter(u => u.wishlist && u.wishlist.length > 0).length

  // Generate WhatsApp Message
  const getWhatsAppUrl = (user: LeadUser) => {
    const cleanPhone = user.phone.replace(/[^0-9]/g, '')
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    
    const cartItems = (user.cart || []).map(i => i.title).join(', ')
    const cartTotal = (user.cart || []).reduce((cSum, i) => cSum + ((i.price + (i.lens?.price || 0)) * i.quantity), 0)

    let message = `Hello ${user.name || 'Valued Customer'}, `
    if (user.cart && user.cart.length > 0) {
      message += `We noticed you left ${user.cart.length} item(s) in your LensZora cart (${cartItems}) worth ₹${cartTotal.toLocaleString()}. `
      message += `Do you need any help with your optical prescription or completing your order? We are happy to assist you!`
    } else if (user.wishlist && user.wishlist.length > 0) {
      message += `We saw your saved items on LensZora wishlist (${user.wishlist.map(w => w.title).join(', ')}). `
      message += `Would you like an exclusive discount or assistance to place your order?`
    } else {
      message += `Thank you for visiting LensZora!`
    }

    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            Cart & Wishlist Leads
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track customer shopping carts & wishlists in real-time to convert leads into sales.
          </p>
        </div>

        <button
          onClick={loadLeads}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg transition-colors border border-slate-300 shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Leads</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <User className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalLeads}</p>
          <p className="text-xs text-slate-500 mt-1">Active customer profiles</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cart Total Value</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">₹{totalCartValue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">{totalCartCount} active carts</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saved Wishlists</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Heart className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalWishlistCount}</p>
          <p className="text-xs text-slate-500 mt-1">Customers with wishlists</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contactable</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Phone className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">
            {leads.filter(u => u.phone).length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Ready for phone/WhatsApp outreach</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Leads ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cart'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Active Carts ({totalCartCount})
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'wishlist'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Heart className="h-4 w-4" />
            Wishlists ({totalWishlistCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
          />
        </div>
      </div>

      {/* Main Leads List */}
      {loading ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading active leads...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Package className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Matching Customer Leads</h3>
          <p className="text-slate-500 text-sm mt-1">Try clearing your search query or check back later.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((user) => {
            const cartItems = user.cart || []
            const wishlistItems = user.wishlist || []
            const cartTotal = cartItems.reduce((sum, item) => sum + ((item.price + (item.lens?.price || 0)) * item.quantity), 0)

            return (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Customer Info Box */}
                  <div className="space-y-2 min-w-[250px]">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-blue-100 text-blue-700 font-extrabold text-base flex items-center justify-center border border-blue-200">
                        {(user.name || user.phone || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {user.name || 'Unnamed Customer'}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          ID: #{user._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-mono font-bold text-slate-800">{user.phone}</span>
                      </div>
                      {user.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Last Active: {new Date(user.updatedAt || user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cart & Wishlist Summary */}
                  <div className="flex-1 grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {/* Cart Section */}
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Cart ({cartItems.length} items)
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          ₹{cartTotal.toLocaleString()}
                        </span>
                      </div>

                      {cartItems.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No items in cart</p>
                      ) : (
                        <div className="space-y-2">
                          {cartItems.slice(0, 2).map((item, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-xs bg-white p-1.5 rounded border border-slate-200">
                              {item.image && (
                                <img src={getImageUrl(item.image)} alt={item.title} className="h-8 w-8 object-cover rounded border border-slate-100" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-800 truncate font-semibold">{item.title}</p>
                                <p className="text-slate-500 text-[10px]">
                                  Qty: {item.quantity} × ₹{(item.price + (item.lens?.price || 0)).toLocaleString()}
                                  {item.lens && <span className="text-blue-600 font-bold ml-1">+ Lens</span>}
                                </p>
                              </div>
                            </div>
                          ))}
                          {cartItems.length > 2 && (
                            <p className="text-[10px] text-blue-600 font-bold">+ {cartItems.length - 2} more item(s)</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Wishlist Section */}
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5" />
                          Wishlist ({wishlistItems.length} items)
                        </span>
                      </div>

                      {wishlistItems.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No saved wishlist items</p>
                      ) : (
                        <div className="space-y-2">
                          {wishlistItems.slice(0, 2).map((wItem, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-xs bg-white p-1.5 rounded border border-slate-200">
                              {wItem.image && (
                                <img src={getImageUrl(wItem.image)} alt={wItem.title} className="h-8 w-8 object-cover rounded border border-slate-100" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-800 truncate font-semibold">{wItem.title}</p>
                                <p className="text-amber-600 text-[10px] font-bold">₹{wItem.price?.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                          {wishlistItems.length > 2 && (
                            <p className="text-[10px] text-rose-600 font-bold">+ {wishlistItems.length - 2} more saved item(s)</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Outreach Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                    <a
                      href={getWhatsAppUrl(user)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>

                    <a
                      href={`tel:${user.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </a>

                    <button
                      onClick={() => setSelectedLead(user)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300"
                    >
                      <Eye className="h-4 w-4 text-slate-600" />
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Customer Lead Modal */}
      {selectedLead && (
        <AnimatePresence>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-400" />
                    {selectedLead.name || 'Unnamed Customer'}'s Saved Items
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">Phone: {selectedLead.phone} | ID: {selectedLead._id}</p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Cart Details Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-amber-600" />
                      Active Cart ({selectedLead.cart?.length || 0} Items)
                    </span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      Total: ₹{(selectedLead.cart || []).reduce((sum, item) => sum + ((item.price + (item.lens?.price || 0)) * item.quantity), 0).toLocaleString()}
                    </span>
                  </h4>

                  {(!selectedLead.cart || selectedLead.cart.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No items currently in cart.</p>
                  ) : (
                    <div className="space-y-4 divide-y divide-slate-200">
                      {selectedLead.cart.map((item, idx) => (
                        <div key={idx} className="pt-4 first:pt-0 flex flex-col sm:flex-row gap-4 items-start">
                          {item.image && (
                            <img src={getImageUrl(item.image)} alt={item.title} className="h-16 w-16 object-cover rounded-lg border border-slate-200 shrink-0 bg-white" />
                          )}
                          <div className="flex-1 space-y-1">
                            <h5 className="font-bold text-slate-900 text-sm">{item.title}</h5>
                            <p className="text-xs text-slate-500">
                              Quantity: <span className="text-slate-900 font-bold">{item.quantity}</span> | Base Price: ₹{item.price.toLocaleString()}
                            </p>

                            {item.lens && (
                              <div className="mt-2 bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-sm">
                                <p className="font-bold text-blue-700 uppercase tracking-wider mb-1">
                                  Lens Package: {item.lens.packageName || item.lens.name} (+₹{item.lens.price.toLocaleString()})
                                </p>
                                {item.lens.prescription && (
                                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                                    <div>
                                      <p className="font-bold text-slate-900 border-b border-slate-200 pb-0.5">OD (Right Eye)</p>
                                      <p>SPH: {item.lens.prescription.od?.sph || '0.00'}</p>
                                      <p>CYL: {item.lens.prescription.od?.cyl || '0.00'}</p>
                                      <p>AXIS: {item.lens.prescription.od?.axis || '0'}°</p>
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 border-b border-slate-200 pb-0.5">OS (Left Eye)</p>
                                      <p>SPH: {item.lens.prescription.os?.sph || '0.00'}</p>
                                      <p>CYL: {item.lens.prescription.os?.cyl || '0.00'}</p>
                                      <p>AXIS: {item.lens.prescription.os?.axis || '0'}°</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-extrabold text-amber-600 text-base">
                              ₹{((item.price + (item.lens?.price || 0)) * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Wishlist Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Saved Wishlist ({selectedLead.wishlist?.length || 0} Items)
                  </h4>

                  {(!selectedLead.wishlist || selectedLead.wishlist.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No saved wishlist items.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {selectedLead.wishlist.map((wItem) => (
                        <div key={wItem._id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          {wItem.image && (
                            <img src={getImageUrl(wItem.image)} alt={wItem.title} className="h-12 w-12 object-cover rounded shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 text-xs truncate">{wItem.title}</p>
                            <p className="text-amber-600 text-xs font-extrabold mt-0.5">₹{wItem.price?.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-t border-slate-200">
                <div className="flex gap-2">
                  <a
                    href={getWhatsAppUrl(selectedLead)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Phone className="h-4 w-4" />
                    Call Customer
                  </a>
                </div>

                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
