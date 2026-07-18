import React, { useEffect, useState } from 'react'
import { products, getToken, inquiries, orders, getUser, settings } from '@/lib/api'
import {
  Package,
  Plus,
  Minus,
  AlertCircle,
  ShoppingCart,
  TrendingUp,
  Boxes,
  Star,
  Loader2,
  Check
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { useNavigate } from 'react-router-dom'

const BulkMarketplacePage: React.FC = () => {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const isProcessingRef = React.useRef(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const navigate = useNavigate()
  const user = getUser()
  const token = getToken()

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'manual'>('razorpay')
  const [manualPaymentSettings, setManualPaymentSettings] = useState<any>(null)
  const [paymentProof, setPaymentProof] = useState<string>('')
  const [utrNumber, setUTRNumber] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)
  const [showCheckoutStep, setShowCheckoutStep] = useState(false)

  useEffect(() => {
    fetchBulkProductsAndSettings()
  }, [])

  async function fetchBulkProductsAndSettings() {
    try {
      setLoading(true)
      const data = await products.list({ isBulk: 'true' })
      setList(data)
      const initialQtys: Record<string, number> = {}
      data.forEach((p: any) => {
        initialQtys[p._id] = p.minOrderQuantity || 1
      })
      setQuantities(initialQtys)

      try {
        const paymentData = await settings.get('manual_payment_settings')
        if (paymentData && paymentData.value) {
          setManualPaymentSettings(paymentData.value)
          if (paymentData.value.razorpayEnabled === false && paymentData.value.enabled) {
            setPaymentMethod('manual')
          }
        }
      } catch (e) {
        console.error('Failed to load payment settings', e)
      }
    } catch (error) {
      console.error('Failed to fetch bulk products:', error)
      toast({
        title: "Connection Error",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQtyChange = (id: string, delta: number, moq: number, stock: number) => {
    setQuantities(prev => {
      const current = prev[id] || moq
      const next = Math.max(moq, Math.min(stock, current + delta))
      return { ...prev, [id]: next }
    })
  }

  const handleSendInquiry = async () => {
    if (!token || !user) {
      toast({ title: "Login Required", description: "Please login to send inquiries.", variant: "destructive" })
      navigate('/auth')
      return
    }

    try {
      setActionLoading(true)
      const qty = quantities[selectedProduct._id] || selectedProduct.minOrderQuantity
      await inquiries.create({
        productId: selectedProduct._id,
        userId: user.id || user._id,
        quantity: qty,
        message: `Inquiry for ${selectedProduct.title} (Wholesale)`,
      }, token)

      toast({
        title: "Inquiry Sent",
        description: "Our team will review your request and get back to you shortly.",
      })
      setSelectedProduct(null)
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send inquiry", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingProof(true)
    try {
      const { url } = await orders.uploadProof(file, token)
      setPaymentProof(url)
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload screenshot", variant: "destructive" })
    } finally {
      setUploadingProof(false)
    }
  }
  const handleBuyNow = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (isProcessingRef.current) return;
    if (!token || !user) {
      toast({ title: "Login Required", description: "Please login to place orders.", variant: "destructive" })
      navigate('/auth')
      return
    }

    try {
      isProcessingRef.current = true;
      if (paymentMethod === 'manual') {
        if (!paymentProof) { toast({ title: "Proof required", description: "Upload payment screenshot", variant: "destructive" }); isProcessingRef.current = false; return; }
        if (!utrNumber) { toast({ title: "UTR required", description: "Enter UTR number", variant: "destructive" }); isProcessingRef.current = false; return; }
      }
      
      setActionLoading(true)
      const qty = quantities[selectedProduct._id] || selectedProduct.minOrderQuantity
      
      const orderPayload = {
        userId: user.id || user._id,
        items: [{
          productId: selectedProduct._id,
          vendorId: selectedProduct.vendorId || selectedProduct.vendor?._id,
          title: selectedProduct.title,
          price: selectedProduct.price,
          quantity: qty,
          image: selectedProduct.thumbnail || selectedProduct.images?.[0] || '',
        }],
        total: qty * selectedProduct.price,
        shippingAddress: {
          firstName: user.firstName || 'Vendor',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          address: 'Please update in profile',
          city: '',
          state: '',
          zipCode: '',
          country: 'India'
        },
        paymentStatus: 'pending',
        orderStatus: 'pending',
        paymentMethod,
        paymentProof: paymentMethod === 'manual' ? paymentProof : undefined,
        utrNumber: paymentMethod === 'manual' ? utrNumber : undefined
      }

      const orderResponse = await orders.create(orderPayload, token)
      
      if (paymentMethod === 'manual') {
        if (orderResponse.success) {
          toast({ title: "Order Placed", description: "Please wait for admin verification." })
          setSelectedProduct(null)
          setPaymentProof('')
          setUTRNumber('')
          navigate(`/orders/${orderResponse.orderId}`)
        } else {
          toast({ title: "Error", description: "Failed to place manual order", variant: "destructive" })
        }
        setActionLoading(false)
        isProcessingRef.current = false;
        return
      }
      
      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        const options = {
          key: orderResponse.key,
          amount: orderResponse.amount,
          currency: orderResponse.currency,
          name: 'Visionary Emporium',
          description: `Wholesale Order #${orderResponse.orderId}`,
          order_id: orderResponse.razorpayOrderId,
          handler: async (response: any) => {
            try {
              const verifyResponse = await orders.verifyPayment({
                orderId: orderResponse.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })

              if (verifyResponse.success) {
                toast({ title: "Payment Successful", description: "Wholesale order confirmed." })
                setSelectedProduct(null)
                navigate(`/orders/${orderResponse.orderId}`)
              } else {
                toast({ title: "Payment Failed", description: "Verification failed.", variant: "destructive" })
              }
            } catch (err: any) {
              toast({ title: "Error", description: "Error verifying payment: " + err.message, variant: "destructive" })
            }
          },
          prefill: {
            name: `${user.firstName || ''} ${user.lastName || ''}`,
            email: user.email || '',
            contact: user.phone || '',
          },
          notes: {
            orderId: orderResponse.orderId,
            bulkOrder: true
          },
          modal: {
            ondismiss: function() {
              setActionLoading(false)
              isProcessingRef.current = false;
            }
          }
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', function (response: any) {
           toast({ title: "Payment Failed", description: response.error.description, variant: "destructive" })
           setActionLoading(false)
           isProcessingRef.current = false;
        });
        rzp.open()
      }
    } catch (error: any) {
      toast({ title: "Order Failed", description: error.message || "Something went wrong", variant: "destructive" })
      setActionLoading(false)
      isProcessingRef.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 p-2 lg:p-4 overflow-x-hidden">
      <div className="relative z-10 max-w-[1700px] mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
              <div key={i} className="h-60 bg-white rounded-xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No wholesale stock available</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3">
            {list.map((product) => (
              <div
                key={product._id}
                className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#DAAB34] transition-all duration-300 shadow-sm"
              >
                <div
                  className="aspect-[3/2] relative overflow-hidden bg-slate-100/50 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <img
                    src={getImageUrl(product.thumbnail || (product.images && product.images.length > 0 ? product.images[0] : ''))}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    <div className="bg-white/95 backdrop-blur-md px-1 py-0.5 rounded shadow-sm border border-slate-100">
                      <span className="text-[6px] text-slate-400 font-bold uppercase block -mb-0.5">Rate</span>
                      <span className="text-[9px] font-black text-[#DAAB34]">₹{product.price}</span>
                    </div>
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-1">
                    <div className="bg-slate-900/80 backdrop-blur-md px-1.5 py-0.5 rounded shadow-sm border border-white/10 flex items-center justify-center min-w-[50px]">
                      <span className="text-[7px] font-black text-white uppercase tracking-tighter text-center">Stock: {product.stock}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between items-center text-center">
                  <div className="mb-2 w-full">
                    <h3
                      className="text-[10px] font-bold text-slate-800 line-clamp-1 leading-tight group-hover:text-[#DAAB34] transition-colors cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.title}
                    </h3>
                    <div className="my-1 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                      <span className="text-sm font-black text-[#DAAB34]">₹{product.price}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1 overflow-hidden">
                      <span className="text-[6.5px] text-slate-400 font-bold px-1 py-0.5 bg-slate-50 rounded border border-slate-100 whitespace-nowrap">MOQ: {product.minOrderQuantity}</span>
                      <span className="text-[6.5px] text-slate-400 font-bold uppercase tracking-tight truncate">SKU: {product.sku}</span>
                    </div>
                  </div>
                  <div className="space-y-2 w-full">
                    <Button
                      onClick={() => setSelectedProduct(product)}
                      className="w-full bg-[#DAAB34] hover:bg-black text-white rounded-xl text-[10px] font-black tracking-widest uppercase h-11 transition-all active:scale-95 border-0 shadow-sm"
                    >
                      See Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => {
        if (!open) {
          setSelectedProduct(null)
          setTimeout(() => setShowCheckoutStep(false), 300) // delay to not flash size change
        }
      }}>
        <DialogContent className={`w-[calc(100%-1.5rem)] ${showCheckoutStep ? 'sm:max-w-xl' : 'sm:max-w-4xl'} max-h-[90vh] bg-white rounded-2xl p-0 overflow-y-auto overflow-x-hidden border-0 shadow-2xl no-scrollbar transition-all duration-300`}>
          {selectedProduct && !showCheckoutStep && (
            <div className="flex flex-col md:flex-row h-full w-full max-w-full overflow-hidden">
              <div className="w-full md:w-1/2 bg-slate-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 p-4 sm:p-8">
                <div className="h-64 sm:h-80 md:h-full w-full flex items-center justify-center rounded-xl bg-white p-4 shadow-sm overflow-hidden">
                  <img
                    src={getImageUrl(selectedProduct.thumbnail || selectedProduct.images?.[0] || '')}
                    alt={selectedProduct.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0 p-5 sm:p-8 bg-white flex flex-col w-full max-w-full overflow-hidden">
                <div className="mb-4 text-left">
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-[#DAAB34]/10 border border-[#DAAB34]/20 mb-3">
                    <span className="text-[9px] font-black text-[#DAAB34] uppercase tracking-wider">Wholesale SKU</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight mb-4 break-words">{selectedProduct.title}</h2>
                  <div className="flex items-center gap-4 py-3 border-y border-slate-50 mb-5">
                    <div className="flex-1 text-left">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Model ID</span>
                      <span className="text-[11px] text-slate-600 font-mono font-bold leading-none break-all">{selectedProduct.sku}</span>
                    </div>
                    <div className="pl-4 border-l border-slate-100 text-left">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Rate</span>
                      <span className="text-xl font-black text-[#DAAB34] leading-none">₹{selectedProduct.price}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100 text-left">
                      <span className="text-[8px] text-slate-400 font-bold uppercase block -mb-0.5">Min Order</span>
                      <span className="text-sm font-black text-slate-800">{selectedProduct.minOrderQuantity} Units</span>
                    </div>
                    <div className="bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100 text-left">
                      <span className="text-[8px] text-slate-400 font-bold uppercase block -mb-0.5">Availability</span>
                      <span className="text-sm font-black text-emerald-600 truncate">{selectedProduct.stock} Stock</span>
                    </div>
                  </div>
                  <div className="text-left mb-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-left">Distribution Details</span>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-medium max-h-[60px] sm:max-h-[80px] overflow-y-auto no-scrollbar break-all">
                      {selectedProduct.description || "Premium wholesale listing. High-quality materials and construction. Ideal for retail stores and distribution."}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100">
                  <div className="mb-4 text-center">
                    <span className="inline-block text-[9px] font-black text-[#DAAB34] uppercase tracking-[2px] bg-[#DAAB34]/5 px-4 py-1.5 rounded-full border border-[#DAAB34]/10">
                      Bill Total: ₹{(quantities[selectedProduct._id] || selectedProduct.minOrderQuantity) * selectedProduct.price}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-1 border border-slate-200 h-10 sm:h-12 w-full sm:w-auto">
                      <button
                        onClick={() => handleQtyChange(selectedProduct._id, -1, selectedProduct.minOrderQuantity, selectedProduct.stock)}
                        className="w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center hover:bg-[#DAAB34]/10 text-slate-400 hover:text-[#DAAB34] transition-all bg-white shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                      </button>
                      <div className="text-center px-4 sm:px-4">
                        <span className="text-base sm:text-lg font-black text-slate-900 leading-none">{quantities[selectedProduct._id] || selectedProduct.minOrderQuantity}</span>
                      </div>
                      <button
                        onClick={() => handleQtyChange(selectedProduct._id, 1, selectedProduct.minOrderQuantity, selectedProduct.stock)}
                        className="w-10 h-8 sm:h-10 rounded-lg flex items-center justify-center hover:bg-[#DAAB34]/10 text-slate-400 hover:text-[#DAAB34] transition-all bg-white shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
                      <Button
                        onClick={() => {
                          if (!token || !user) {
                            toast({ title: "Login Required", description: "Please login to place orders.", variant: "destructive" })
                            navigate('/auth')
                            return
                          }
                          setShowCheckoutStep(true)
                        }}
                        className="w-full sm:flex-1 bg-black hover:bg-slate-900 text-white rounded-xl text-[9px] sm:text-[10px] font-black tracking-[3px] uppercase h-10 sm:h-12 border-0 shadow-lg"
                      >
                        Buy Now
                      </Button>
                      <Button
                        disabled={actionLoading}
                        onClick={handleSendInquiry}
                        className="w-full sm:flex-1 bg-[#DAAB34] hover:bg-[#C0962B] text-black rounded-xl text-[9px] sm:text-[10px] font-black tracking-[3px] uppercase h-10 sm:h-12 border-0 shadow-lg shadow-[#DAAB34]/20"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Inquiry'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedProduct && showCheckoutStep && (
            <div className="flex flex-col h-full w-full bg-white p-6 sm:p-8 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <button 
                  onClick={() => setShowCheckoutStep(false)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-600 shrink-0"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="flex items-center gap-3 w-full">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 hidden sm:block">
                    <img src={getImageUrl(selectedProduct.thumbnail || selectedProduct.images?.[0] || '')} alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Checkout</h2>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate block">{selectedProduct.title}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black p-5 sm:p-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xl shadow-slate-900/10">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Bill</span>
                  <span className="text-2xl sm:text-3xl font-black text-white">₹{(quantities[selectedProduct._id] || selectedProduct.minOrderQuantity) * selectedProduct.price}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Quantity</span>
                  <span className="text-xs sm:text-sm font-bold text-white bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/5 shadow-sm">{quantities[selectedProduct._id] || selectedProduct.minOrderQuantity} Units</span>
                </div>
              </div>

              <div className="mb-6 flex-1">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-3 block text-left">Select Payment Mode</span>
                <div className="flex flex-col gap-3 mb-4">
                  {(!manualPaymentSettings || manualPaymentSettings.razorpayEnabled !== false) && (
                    <div
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`w-full border p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-[#DAAB34] bg-[#DAAB34]/5 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-[#DAAB34]' : 'border-slate-300'}`}>
                            {paymentMethod === 'razorpay' && <div className="w-2 h-2 rounded-full bg-[#DAAB34]" />}
                          </div>
                          <div>
                            <span className={`block text-sm font-black ${paymentMethod === 'razorpay' ? 'text-[#DAAB34]' : 'text-slate-800'}`}>Razorpay / Online Support</span>
                            <span className="text-[10px] text-slate-500 font-medium">Pay instantly via UPI, Cards, Netbanking</span>
                          </div>
                      </div>
                    </div>
                  )}
                  
                  {manualPaymentSettings && manualPaymentSettings.enabled && (
                    <div
                      onClick={() => setPaymentMethod('manual')}
                      className={`w-full border p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === 'manual' ? 'border-[#DAAB34] bg-[#DAAB34]/5 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'manual' ? 'border-[#DAAB34]' : 'border-slate-300'}`}>
                            {paymentMethod === 'manual' && <div className="w-2 h-2 rounded-full bg-[#DAAB34]" />}
                          </div>
                          <div>
                            <span className={`block text-sm font-black ${paymentMethod === 'manual' ? 'text-[#DAAB34]' : 'text-slate-800'}`}>Manual Bank Transfer</span>
                            <span className="text-[10px] text-slate-500 font-medium">Transfer amount manually and upload proof</span>
                          </div>
                      </div>
                    </div>
                  )}
                </div>

                {paymentMethod === 'manual' && manualPaymentSettings && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-4 animate-in fade-in duration-300">
                    {manualPaymentSettings.instructions && (
                      <div className="text-xs text-slate-600 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                        {manualPaymentSettings.instructions}
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      {manualPaymentSettings.qrCode && (
                        <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-[9px] font-bold text-slate-400 tracking-wider mb-2 uppercase">Scan to Pay</span>
                            <img src={getImageUrl(manualPaymentSettings.qrCode)} alt="QR Code" className="w-32 h-32 object-contain" />
                        </div>
                      )}
                      
                      <div className="flex-1 flex flex-col gap-3 justify-center">
                        {manualPaymentSettings.upiId && (
                            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">UPI ID</span>
                              <span className="text-sm font-mono font-bold text-[#DAAB34] break-all">{manualPaymentSettings.upiId}</span>
                            </div>
                        )}
                        {manualPaymentSettings.bankDetails && (
                            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Bank Details</span>
                              <pre className="text-[10px] font-mono text-slate-700 whitespace-pre-wrap">{manualPaymentSettings.bankDetails}</pre>
                            </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4 mt-2">
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Upload Payment Proof</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={utrNumber}
                            onChange={(e) => setUTRNumber(e.target.value)}
                            placeholder="Enter 12-digit UTR *"
                            className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#DAAB34] transition-colors shadow-sm"
                          />
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="vendor-proof-upload"
                          />
                          <label
                                htmlFor="vendor-proof-upload"
                                className={`w-full h-[46px] flex items-center justify-center gap-2 border rounded-xl cursor-pointer transition-all text-xs font-bold shadow-sm ${paymentProof
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                  : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                                  }`}
                              >
                                {uploadingProof ? (
                                  <span className="animate-pulse flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</span>
                                ) : paymentProof ? (
                                  <>
                                    <Check className="w-4 h-4" /> Proof Attached
                                  </>
                                ) : (
                                  "📸 Attach Screenshot *"
                                )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-2">
                <Button
                  disabled={actionLoading}
                  onClick={handleBuyNow}
                  className="w-full bg-[#DAAB34] hover:bg-black text-white rounded-xl text-xs font-black tracking-[2px] uppercase h-14 border-0 shadow-lg shadow-[#DAAB34]/20 transition-all active:scale-95"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${(quantities[selectedProduct._id] || selectedProduct.minOrderQuantity) * selectedProduct.price}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BulkMarketplacePage
