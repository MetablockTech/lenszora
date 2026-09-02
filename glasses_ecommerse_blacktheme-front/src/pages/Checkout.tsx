import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/use-cart'
import { orders, addresses, pincodes, getUser } from '@/lib/api'
import { getToken } from '@/lib/api'
import { Trash2, ChevronRight, AlertCircle, MapPin, Plus, Check, Edit2, Tag } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import LensSelectionModal from '@/components/product/LensSelectionModal'

interface SavedAddress {
  _id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  addressType: 'home' | 'work' | 'other';
}

const Checkout = () => {
  const { cart, total: cartTotal, clearCart, removeFromCart, updateItem } = useCart()
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const navigate = useNavigate()
  const token = getToken()
  const [loading, setLoading] = useState(false)
  const isProcessingRef = React.useRef(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null)
  const [checkingPincode, setCheckingPincode] = useState(false)
  const [shippingCost, setShippingCost] = useState(0)

  // Recalculate shipping cost whenever delivery info or cart total changes
  useEffect(() => {
    if (deliveryInfo?.deliveryRules && deliveryInfo.deliveryRules.length > 0) {
      // Sort rules by minOrderValue descending
      const sortedRules = [...deliveryInfo.deliveryRules].sort((a: any, b: any) => b.minOrderValue - a.minOrderValue)
      const applicableRule = sortedRules.find((rule: any) => cartTotal >= rule.minOrderValue)
      setShippingCost(applicableRule ? applicableRule.deliveryCharge : 0) // Default to 0? Or should we default to lowest tier? Plan says 0 if unconfigured, but tiered rules usually imply coverage. Let's assume 0 if no rule matches (e.g. strict highest value check).
    } else {
      setShippingCost(0)
    }
  }, [deliveryInfo, cartTotal])

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [myCoupons, setMyCoupons] = useState<any[]>([])

  useEffect(() => {
    async function loadCoupons() {
      try {
        const { coupons } = await import('@/lib/api')
        const list = await coupons.getMyCoupons(token)
        setMyCoupons(list || [])
      } catch (err) {
        console.error('Failed to load my coupons:', err)
      }
    }
    if (token) loadCoupons()
  }, [token])

  async function handleApplyCoupon(codeToApply?: string) {
    const code = (codeToApply || couponCode).trim()
    if (!code) return
    setApplyingCoupon(true)
    try {
      const { coupons } = await import('@/lib/api')
      const result = await coupons.apply(code, cartTotal)
      setAppliedCoupon(result)
      setCouponDiscount(result.discountAmount)
      setCouponCode(result.code)
    } catch (err: any) {
      alert(err.message || 'Invalid coupon code')
    } finally {
      setApplyingCoupon(false)
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponDiscount(0)
    setCouponCode('')
  }

  const finalTotal = Math.max(0, cartTotal + shippingCost - couponDiscount)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: getUser()?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  })

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'manual'>('razorpay')
  const [manualPaymentSettings, setManualPaymentSettings] = useState<any>(null)
  const [paymentProof, setPaymentProof] = useState<string>('')
  const [utrNumber, setUTRNumber] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)

  // Fetch manual payment settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await import('@/lib/api').then(m => m.settings.get('manual_payment_settings'))
        console.log('[DEBUG] Manual payment settings fetched:', data)
        if (data && data.value) {
          console.log('[DEBUG] QR Code path:', data.value.qrCode)
          setManualPaymentSettings(data.value)

          // Switch to manual if razorpay is disabled
          if (data.value.razorpayEnabled === false && data.value.enabled) {
            setPaymentMethod('manual')
          }
        }
      } catch (err) {
        console.error('Failed to load payment settings', err)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    // Check if user is logged in
    if (!token) {
      navigate('/auth?redirect=/checkout')
      return
    }
    setAuthChecked(true)

    // Ensure email is set even if not in initial state (e.g. if user matches logged in user)
    const user = getUser();
    if (user && user.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }

    loadSavedAddresses()
  }, [token, navigate])

  async function loadSavedAddresses() {
    try {
      const data = await addresses.list(token)
      setSavedAddresses(data)

      // Auto-select default address
      const defaultAddr = data.find((addr: SavedAddress) => addr.isDefault)
      if (defaultAddr && !selectedAddressId) {
        selectAddress(defaultAddr)
      }
    } catch (error) {
      console.error('Failed to load addresses:', error)
    }
  }

  function selectAddress(address: SavedAddress) {
    setSelectedAddressId(address._id)
    setFormData(prev => ({
      firstName: address.name.split(' ')[0] || '',
      lastName: address.name.split(' ').slice(1).join(' ') || '',
      email: prev.email || getUser()?.email || '', // Use existing form email, or fallback to user email
      phone: address.phone,
      address: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}`,
      city: address.city,
      state: address.state,
      zipCode: address.pincode,
      country: 'India',
    }))
    setShowNewAddressForm(false)
    checkPincodeAvailability(address.pincode)
  }

  async function checkPincodeAvailability(pincode: string) {
    if (pincode.length !== 6) {
      setDeliveryInfo(null)
      return
    }

    try {
      setCheckingPincode(true)
      const result = await pincodes.check(pincode)
      setDeliveryInfo(result)
    } catch (error) {
      setDeliveryInfo(null)
    } finally {
      setCheckingPincode(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="py-12 text-center">Loading...</div>
        <Footer />
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-playfair font-bold mb-4 text-white">Your Cart is Empty</h1>
            <p className="text-gray-400 mb-6">Add some products before checking out.</p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Continue Shopping
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }



  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingProof(true)
    try {
      // Use correct upload endpoint for proofs
      const { url } = await import('@/lib/api').then(m => m.orders.uploadProof(file, token))
      setPaymentProof(url)
    } catch (error) {
      console.error('Upload failed', error)
      alert('Failed to upload proof. Please try again.')
    } finally {
      setUploadingProof(false)
    }
  }

  async function handlePayment(e?: React.MouseEvent) {
    e?.preventDefault();
    if (isProcessingRef.current) return;

    if (!formData.firstName || !formData.email || !formData.address || !formData.phone) {
      alert('Please fill all required fields')
      return
    }

    if (!deliveryInfo || !deliveryInfo.serviceable) {
      alert('Delivery is not available for this pincode. Please select a different address.')
      return
    }

    if (paymentMethod === 'manual') {
      if (!paymentProof) {
        alert('Please upload the payment proof screenshot.')
        return
      }
      if (!utrNumber) {
        alert('Please enter the UTR / Transaction Number.')
        return
      }
    }

    isProcessingRef.current = true;
    setLoading(true)
    try {
      // Create order
      const orderData = {
        items: cart.map((item) => ({
          productId: item.productId,
          vendorId: item.vendorId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          lens: item.lens,
        })),
        couponCode: appliedCoupon?.code,
        discountAmount: couponDiscount,
        total: finalTotal,
        shippingAddress: formData,
        paymentMethod,
        paymentProof: paymentMethod === 'manual' ? paymentProof : undefined,
        utrNumber: paymentMethod === 'manual' ? utrNumber : undefined
      }

      const orderResponse = await orders.create(orderData, token)

      if (paymentMethod === 'manual') {
        if (orderResponse.success) {
          clearCart()
          alert('Order placed successfully! Please wait for admin verification.')
          navigate(`/orders/${orderResponse.orderId}`)
        } else {
          alert('Failed to place manual order.')
          setLoading(false)
          isProcessingRef.current = false;
        }
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
          description: `Order #${orderResponse.orderId}`,
          order_id: orderResponse.razorpayOrderId,
          handler: async (response: any) => {
            try {
              const verifyResponse = await orders.verifyPayment({
                orderId: orderResponse.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })

              if (verifyResponse.success) {
                clearCart()
                alert('Payment successful! Order confirmed.')
                navigate(`/orders/${orderResponse.orderId}`)
              } else {
                alert('Payment verification failed')
              }
            } catch (err: any) {
              alert('Error verifying payment: ' + err.message)
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone,
          },
          notes: {
            orderId: orderResponse.orderId,
          },
          modal: {
            ondismiss: function () {
              setLoading(false)
              isProcessingRef.current = false;
            }
          }
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', function (response: any) {
          alert("Payment Failed: " + response.error.description)
          setLoading(false)
          isProcessingRef.current = false;
        });
        rzp.open()
      }
    } catch (err: any) {
      alert('Error creating order: ' + err.message)
      setLoading(false)
      isProcessingRef.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <main className="py-8 lg:py-12 w-full flex flex-col">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6">
          <h1 className="text-3xl lg:text-4xl font-playfair font-bold text-white mb-8">
            Checkout
          </h1>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 w-full">
            {/* Left: Shipping Form */}
            <div className="lg:col-span-2 space-y-8 w-full min-w-0">
              {/* Saved Addresses */}
              {savedAddresses.length > 0 && !showNewAddressForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-playfair font-bold text-white flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Select Delivery Address
                    </h2>
                    <button
                      onClick={() => navigate('/addresses')}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Manage Addresses
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {savedAddresses.map((address) => (
                      <div
                        key={address._id}
                        onClick={() => selectAddress(address)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedAddressId === address._id
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{address.addressType}</span>
                            {address.isDefault && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          {selectedAddressId === address._id && (
                            <Check className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <p className="font-semibold text-sm">{address.name}</p>
                        <p className="text-sm text-gray-400">{address.phone}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-400">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="w-full border-2 border-dashed border-zinc-700 rounded-lg p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:border-zinc-600 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Add New Address
                  </button>
                </motion.div>
              )}

              {/* Shipping Information Form */}
              {(showNewAddressForm || savedAddresses.length === 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-playfair font-bold text-white flex items-center gap-2">
                      <ChevronRight className="h-5 w-5" />
                      Shipping Address
                    </h2>
                    {savedAddresses.length > 0 && (
                      <button
                        onClick={() => setShowNewAddressForm(false)}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Use Saved Address
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                          className="w-full bg-black border border-zinc-800 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                          className="w-full bg-black border border-zinc-800 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-black border border-zinc-800 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-black border border-zinc-800 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Address *
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-black border border-zinc-800 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                        placeholder="123 Main Street"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full bg-black border border-zinc-800 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full bg-black border border-zinc-800 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                          placeholder="Maharashtra"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => {
                            const pin = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setFormData({ ...formData, zipCode: pin })
                            if (pin.length === 6) {
                              checkPincodeAvailability(pin)
                            }
                          }}
                          className="w-full bg-black border border-zinc-800 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                          placeholder="400001"
                          maxLength={6}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        className="w-full border border-zinc-800 p-2 rounded-lg bg-zinc-900 text-gray-400"
                        disabled
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Delivery Info */}
              {deliveryInfo && (
                <div className={`border rounded-lg p-4 ${deliveryInfo.serviceable
                  ? 'bg-green-900/20 border-green-800'
                  : 'bg-red-900/20 border-red-800'
                  }`}>
                  <div className="flex gap-3">
                    <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${deliveryInfo.serviceable ? 'text-green-400' : 'text-red-400'
                      }`} />
                    <div>
                      <h3 className={`font-semibold ${deliveryInfo.serviceable ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {deliveryInfo.serviceable ? 'Delivery Available' : 'Delivery Not Available'}
                      </h3>
                      <p className={`text-sm mt-1 ${deliveryInfo.serviceable ? 'text-green-300' : 'text-red-300'
                        }`}>
                        {deliveryInfo.message}
                        {deliveryInfo.serviceable && deliveryInfo.city && (
                          <span className="block mt-1">
                            Delivering to: {deliveryInfo.city}, {deliveryInfo.state}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-2xl font-playfair font-bold text-white mb-6">Payment Method</h2>
                <div className="space-y-4">
                  {/* Razorpay Option */}
                  {(!manualPaymentSettings || manualPaymentSettings.razorpayEnabled !== false) && (
                    <div
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`border rounded-lg p-4 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'razorpay'
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-blue-500' : 'border-gray-500'}`}>
                          {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                        <span className="font-semibold">Razorpay Secure Payment</span>
                      </div>
                      {/* <credit-card-icon className="text-gray-400" /> */}
                    </div>
                  )}

                  {/* Manual Payment Option */}
                  {manualPaymentSettings && manualPaymentSettings.enabled && (
                    <div
                      onClick={() => setPaymentMethod('manual')}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'manual'
                        ? 'border-yellow-500 bg-yellow-900/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'manual' ? 'border-yellow-500' : 'border-gray-500'}`}>
                          {paymentMethod === 'manual' && <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />}
                        </div>
                        <span className={`font-semibold ${paymentMethod === 'manual' ? 'text-yellow-500' : 'text-gray-200'}`}>Manual Payment (UPI / Bank Transfer)</span>
                      </div>

                      {paymentMethod === 'manual' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-4 pl-4 md:pl-8 space-y-6 pt-2"
                        >
                          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl space-y-4 shadow-inner">
                            <p className="text-sm text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                              {manualPaymentSettings.instructions || "Please transfer the amount to the details below."}
                            </p>

                            {manualPaymentSettings.upiId && (
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">UPI ID</span>
                                <div className="flex items-start md:items-center justify-between bg-black border border-zinc-800 p-3 rounded-lg group hover:border-zinc-700 transition-colors gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="font-mono text-yellow-500 text-sm md:text-base break-all">{manualPaymentSettings.upiId}</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(manualPaymentSettings.upiId);
                                      alert('UPI ID copied!');
                                    }}
                                    className="text-gray-500 hover:text-white px-2 py-1 text-xs uppercase font-bold tracking-wide transition-colors"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            )}

                            {manualPaymentSettings.bankDetails && (
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Details</span>
                                <div className="bg-black border border-zinc-800 p-3 rounded-lg text-sm text-gray-300 relative group hover:border-zinc-700 transition-colors w-full overflow-hidden">
                                  <div className="whitespace-pre-wrap word-break-all break-words leading-relaxed font-mono w-full min-w-0">
                                    {manualPaymentSettings.bankDetails}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(manualPaymentSettings.bankDetails);
                                      alert('Bank Details copied!');
                                    }}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-white px-2 py-1 text-xs uppercase font-bold tracking-wide transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            )}


                            {/* QR Code Section */}
                            <div className="flex flex-col gap-1.5 items-center pt-2">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Scan QR Code</span>
                              {manualPaymentSettings.qrCode ? (
                                <div className="bg-white p-2 rounded-xl">
                                  <img
                                    src={getImageUrl(manualPaymentSettings.qrCode)}
                                    alt="Payment QR"
                                    className="w-40 h-40 object-contain"
                                    onLoad={() => console.log('[DEBUG] QR Code image loaded successfully')}
                                    onError={(e) => console.error('[DEBUG] QR Code image failed to load:', getImageUrl(manualPaymentSettings.qrCode))}
                                  />
                                </div>
                              ) : (
                                <div className="text-xs text-yellow-400 border border-yellow-800 bg-yellow-900/20 p-3 rounded text-center">
                                  QR Code not available. Please use UPI ID or Bank Details above.
                                </div>
                              )}
                            </div>

                          </div>

                          <div className="space-y-4 border-t border-zinc-800/50 pt-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-200 mb-2">
                                UTR / Transaction Number <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={utrNumber}
                                onChange={(e) => setUTRNumber(e.target.value)}
                                className="w-full bg-black border border-zinc-700 p-3 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all placeholder:text-gray-600"
                                placeholder="e.g. 321456879546"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-200 mb-2">
                                Payment Screenshot <span className="text-red-500">*</span>
                              </label>
                              <div className="relative group">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                  id="proof-upload"
                                />
                                <label
                                  htmlFor="proof-upload"
                                  className={`w-full flex items-center justify-center gap-3 border border-dashed rounded-lg p-8 cursor-pointer transition-all ${paymentProof
                                    ? 'bg-green-900/10 border-green-500/50'
                                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                                    }`}
                                >
                                  {uploadingProof ? (
                                    <span className="text-yellow-500 animate-pulse font-medium">Uploading proof...</span>
                                  ) : paymentProof ? (
                                    <div className="text-center">
                                      <span className="text-green-500 flex items-center justify-center gap-2 font-medium mb-2">
                                        <Check className="w-5 h-5" /> Screenshot Uploaded
                                      </span>
                                      <p className="text-xs text-green-400/70">Click to replace</p>
                                    </div>
                                  ) : (
                                    <div className="text-center space-y-2">
                                      <span className="text-gray-400 block font-medium group-hover:text-gray-300">Click to upload payment screenshot</span>
                                      <p className="text-xs text-gray-600">Supports JPG, PNG, WEBP</p>
                                    </div>
                                  )}
                                </label>
                              </div>
                              {paymentProof && (
                                <div className="mt-3">
                                  <img
                                    src={getImageUrl(paymentProof)}
                                    alt="Proof"
                                    className="h-24 rounded-lg border border-green-500/30 object-cover shadow-lg"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-400">Secure Payment</h3>
                  <p className="text-sm text-blue-300 mt-1">
                    Your payment is secured and encrypted using Razorpay.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1 w-full min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 static lg:sticky top-24"
              >
                <h2 className="text-2xl font-playfair font-bold text-white mb-6">
                  Order Summary
                </h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.productId}-${idx}`}
                      className="flex gap-4 pb-4 border-b border-zinc-800 last:border-0 relative group"
                    >
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className="h-16 w-16 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-white truncate">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                        </p>
                        {item.lens && (
                          <div className="space-y-1 mt-1">
                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider break-words line-clamp-2">
                              Lens: {item.lens.packageName || item.lens.name} (+₹{item.lens.price.toLocaleString()})
                            </p>
                            {item.lens.prescription && (
                              <p className="text-[9px] text-green-500 font-medium">✓ Prescription Added</p>
                            )}
                            <button
                              onClick={() => setEditingIndex(idx)}
                              className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                            >
                              <Edit2 className="w-2.5 h-2.5" /> Edit Power
                            </button>
                          </div>
                        )}
                        <p className="font-semibold text-white mt-1">
                          ₹{((item.price + (item.lens?.price || 0)) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variant?.sku)}
                        className="absolute top-0 right-0 p-1 text-gray-500 hover:text-red-500 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="border-t border-zinc-800 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-sm font-semibold text-gray-300">
                    <span className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-amber-400" /> Apply Coupon</span>
                  </div>

                  {appliedCoupon ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-emerald-400 text-xs">{appliedCoupon.code}</span>
                        <p className="text-[11px] text-emerald-300">₹{appliedCoupon.discountAmount} Discount Applied!</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-400 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white uppercase focus:border-amber-500 outline-none flex-1 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1.5 rounded-lg text-xs disabled:opacity-50 transition-colors"
                      >
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}

                  {/* My Available Coupons Pills */}
                  {myCoupons.length > 0 && !appliedCoupon && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] text-gray-400 font-semibold">Your Available Coupons:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {myCoupons.map((c) => (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => handleApplyCoupon(c.code)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 text-[10px] font-mono px-2 py-1 rounded transition-all flex items-center gap-1"
                          >
                            <span>{c.code}</span>
                            <span className="bg-amber-500/20 text-amber-400 text-[9px] px-1 rounded">
                              {c.discountType === 'flat' ? `₹${c.discountValue}` : `${c.discountValue}%`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="border-t border-zinc-800 pt-4 space-y-2">
                  <div className="flex justify-between text-sm flex-wrap gap-2">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-right">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm flex-wrap gap-2 text-emerald-400 font-semibold">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm flex-wrap gap-2">
                    <span className="text-gray-400">Shipping</span>
                    <span className="text-right">{shippingCost === 0 ? 'FREE' : `₹${shippingCost.toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-zinc-800">
                    <span>Total</span>
                    <span className="text-amber-400">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={loading || !deliveryInfo?.serviceable}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading
                    ? 'Processing...'
                    : paymentMethod === 'manual'
                      ? 'Submit Order'
                      : 'Pay with Razorpay'
                  }
                </button>

                <button
                  onClick={() => navigate('/shop')}
                  className="w-full mt-2 border border-zinc-800 text-white py-2 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Continue Shopping
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {editingIndex !== null && (
        <LensSelectionModal
          isOpen={true}
          onClose={() => setEditingIndex(null)}
          product={{ 
             vendorId: cart[editingIndex].vendorId,
             lensSettings: cart[editingIndex].lens?.lensSettings || { allowLensSelection: true, lensTypes: [] }
          }}
          productTitle={cart[editingIndex].title}
          vendorId={cart[editingIndex].vendorId}
          initialData={cart[editingIndex].lens}
          onSelect={(lensData) => {
            const updatedItem = { 
              ...cart[editingIndex], 
              lens: {
                typeId: lensData.type?._id,
                typeName: lensData.type?.name,
                packageId: lensData.package?._id,
                packageName: lensData.package?.name || lensData.type?.name,
                name: lensData.package?.name || lensData.type?.name,
                price: lensData.package?.price || 0,
                prescription: lensData.prescription,
                type: lensData.type,
                package: lensData.package,
                lensSettings: cart[editingIndex].lens?.lensSettings // Preserve settings
              }
            };
            updateItem(editingIndex, updatedItem);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  )
}

export default Checkout
