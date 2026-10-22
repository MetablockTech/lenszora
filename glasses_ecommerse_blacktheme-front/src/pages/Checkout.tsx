import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/hooks/use-cart'
import { orders, addresses, pincodes, getUser } from '@/lib/api'
import { getToken } from '@/lib/api'
import { Trash2, ChevronRight, AlertCircle, MapPin, Plus, Check, Edit2, Tag, Home, Briefcase, Star, Sparkles, X, Mail } from 'lucide-react'
import { getImageUrl, isFrameOnlyLens } from '@/lib/utils'
import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'
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

  // Amazon-style address form state
  const [newAddressData, setNewAddressData] = useState({
    name: getUser()?.name || '',
    phone: getUser()?.phone || '',
    email: getUser()?.email || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'home' as 'home' | 'work' | 'other',
    isDefault: false,
    saveToAccount: true,
  })

  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [editAddressData, setEditAddressData] = useState<any>({})
  const [isSavingAddress, setIsSavingAddress] = useState(false)

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
    const phone = address.phone || getUser()?.phone || 'customer'
    setFormData(prev => ({
      firstName: address.name.split(' ')[0] || address.name || 'Customer',
      lastName: address.name.split(' ').slice(1).join(' ') || '',
      email: prev.email || getUser()?.email || `${phone}@lenszora.com`,
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

  async function handleSaveNewAddress(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!newAddressData.name.trim()) {
      toast({ title: "Name Required", description: "Please enter recipient full name", variant: "destructive" })
      return
    }
    if (!newAddressData.phone.trim() || newAddressData.phone.length < 10) {
      toast({ title: "Phone Required", description: "Please enter a valid 10-digit mobile number", variant: "destructive" })
      return
    }
    if (!newAddressData.addressLine1.trim()) {
      toast({ title: "Address Required", description: "Please enter house no. / building / street address", variant: "destructive" })
      return
    }
    if (!newAddressData.pincode.trim() || newAddressData.pincode.length !== 6) {
      toast({ title: "Pincode Required", description: "Please enter a valid 6-digit pincode", variant: "destructive" })
      return
    }

    setIsSavingAddress(true)
    try {
      if (newAddressData.saveToAccount && token) {
        // Save address to database
        const created = await addresses.create({
          name: newAddressData.name,
          phone: newAddressData.phone,
          addressLine1: newAddressData.addressLine1,
          addressLine2: newAddressData.addressLine2,
          city: newAddressData.city,
          state: newAddressData.state,
          pincode: newAddressData.pincode,
          addressType: newAddressData.addressType,
          isDefault: newAddressData.isDefault || savedAddresses.length === 0,
        }, token)

        toast({ title: "Address Saved!", description: "New delivery address saved to your account." })

        const updatedList = await addresses.list(token)
        setSavedAddresses(updatedList)
        selectAddress(created)
      } else {
        // Temporary shipping address for current checkout
        setFormData({
          firstName: newAddressData.name.split(' ')[0] || '',
          lastName: newAddressData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email || getUser()?.email || '',
          phone: newAddressData.phone,
          address: `${newAddressData.addressLine1}${newAddressData.addressLine2 ? ', ' + newAddressData.addressLine2 : ''}`,
          city: newAddressData.city,
          state: newAddressData.state,
          zipCode: newAddressData.pincode,
          country: 'India',
        })
        checkPincodeAvailability(newAddressData.pincode)
        setShowNewAddressForm(false)
      }
    } catch (err: any) {
      toast({ title: "Error Saving Address", description: err.message || "Failed to save address", variant: "destructive" })
    } finally {
      setIsSavingAddress(false)
    }
  }

  async function handleUpdateAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!editingAddress) return
    try {
      setIsSavingAddress(true)
      await addresses.update(editingAddress._id, editAddressData, token)
      toast({ title: "Address Updated", description: "Address details updated successfully." })

      const updatedList = await addresses.list(token)
      setSavedAddresses(updatedList)

      if (selectedAddressId === editingAddress._id) {
        selectAddress({ ...editingAddress, ...editAddressData })
      }

      setEditingAddress(null)
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update address", variant: "destructive" })
    } finally {
      setIsSavingAddress(false)
    }
  }

  async function handleDeleteAddress(addressId: string) {
    if (!confirm("Are you sure you want to delete this address?")) return
    try {
      await addresses.remove(addressId, token)
      toast({ title: "Address Removed", description: "Address deleted from your account." })

      const updatedList = await addresses.list(token)
      setSavedAddresses(updatedList)

      if (selectedAddressId === addressId) {
        if (updatedList.length > 0) {
          selectAddress(updatedList[0])
        } else {
          setSelectedAddressId(null)
          setShowNewAddressForm(true)
        }
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to delete address", variant: "destructive" })
    }
  }

  const getAddressTypeBadge = (type: string) => {
    switch (type) {
      case 'home':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            <Home className="w-3.5 h-3.5" /> HOME
          </span>
        )
      case 'work':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5" /> WORK / OFFICE
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" /> OTHER
          </span>
        )
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
      const activeToken = token || getToken()
      const { orders } = await import('@/lib/api')
      const res = await orders.uploadProof(file, activeToken)
      const uploadedUrl = res.url || res.path
      if (!uploadedUrl) throw new Error('Invalid response from server')
      setPaymentProof(uploadedUrl)
    } catch (error: any) {
      console.error('Upload failed', error)
      alert(error?.message || 'Failed to upload proof. Please try again.')
    } finally {
      setUploadingProof(false)
    }
  }

  async function handlePayment(e?: React.MouseEvent) {
    e?.preventDefault();
    if (isProcessingRef.current) return;

    let currentFormData = { ...formData };

    // If formData is missing name, address or phone, try syncing from newAddressData if valid
    if ((!currentFormData.firstName || !currentFormData.address || !currentFormData.phone) && newAddressData.name && newAddressData.phone && newAddressData.addressLine1 && newAddressData.pincode) {
      const nameParts = newAddressData.name.trim().split(' ');
      currentFormData = {
        firstName: nameParts[0] || newAddressData.name || 'Customer',
        lastName: nameParts.slice(1).join(' ') || '',
        email: currentFormData.email || getUser()?.email || `${newAddressData.phone}@lenszora.com`,
        phone: newAddressData.phone,
        address: `${newAddressData.addressLine1}${newAddressData.addressLine2 ? ', ' + newAddressData.addressLine2 : ''}`,
        city: newAddressData.city || 'City',
        state: newAddressData.state || 'State',
        zipCode: newAddressData.pincode,
        country: 'India',
      };
      setFormData(currentFormData);
    }

    // Ensure email is populated (fallback if user logged in via phone OTP without email)
    if (!currentFormData.email) {
      currentFormData.email = getUser()?.email || `${currentFormData.phone || 'customer'}@lenszora.com`;
      setFormData(currentFormData);
    }

    if (!currentFormData.firstName || !currentFormData.address || !currentFormData.phone || !currentFormData.zipCode) {
      alert('Please fill all required delivery address fields (Full Name, Phone, Address Line 1, Pincode).');
      return;
    }

    // Check pincode serviceability if not checked yet
    let currentDeliveryInfo = deliveryInfo;
    if (!currentDeliveryInfo && currentFormData.zipCode && currentFormData.zipCode.length === 6) {
      try {
        currentDeliveryInfo = await pincodes.check(currentFormData.zipCode);
        setDeliveryInfo(currentDeliveryInfo);
      } catch (err) {
        console.error('Failed to verify pincode:', err);
      }
    }

    if (currentDeliveryInfo && currentDeliveryInfo.serviceable === false) {
      alert(`Delivery is not available for pincode ${currentFormData.zipCode}. Please select a different address or pincode.`);
      return;
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
          lens: isFrameOnlyLens(item.lens) ? undefined : item.lens,
        })),
        couponCode: appliedCoupon?.code,
        discountAmount: couponDiscount,
        total: finalTotal,
        shippingAddress: currentFormData,
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

  // Zero-power and frame-only lenses have no eye power to edit
  const lensNeedsPower = (lens: any) => {
    const name = String(lens?.type?.name || lens?.typeName || lens?.name || '').toLowerCase();
    return !(lens?.type?.skipPowerEntry || name.includes('zero') || name.includes('frame only'));
  };

  const formatSph = (v?: string) => {
    if (v === undefined || v === null || v === '') return '—';
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? `+${v}` : String(v);
  };

  const describePrescription = (p: any) => {
    if (!p) return 'Power not added yet';
    if (p.method === 'later') return 'Power: will share after order (WhatsApp / Call)';
    if (p.method === 'upload') return `Prescription uploaded${p.fileName ? ` (${p.fileName})` : ''}`;
    const eye = (label: string, e: any) => {
      if (!e) return `${label}: —`;
      const cyl = e.cyl && Number(e.cyl) !== 0 ? ` / ${e.cyl} × ${e.axis || 0}°` : '';
      return `${label}: ${formatSph(e.sph)}${cyl}`;
    };
    return `${eye('R', p.od)}  ·  ${eye('L', p.os)}${p.pd ? `  ·  PD ${p.pd}` : ''}`;
  };

  // stacked = phone layout: big image on top, details below (desktop sidebar keeps the compact row)
  const renderCartItems = (stacked = false) => (
    <>
      {cart.map((item, idx) => {
        const productUrl = `/product/${item.productId}`;
        const lensBlock = item.lens && !isFrameOnlyLens(item.lens) && (
          <div className="space-y-1.5 mt-2">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider break-words line-clamp-2">
              Lens: {item.lens.packageName || item.lens.name} (+₹{item.lens.price.toLocaleString()})
            </p>
            {lensNeedsPower(item.lens) && (
              <div className={`text-[11px] rounded-md px-2 py-1.5 border ${item.lens.prescription ? 'border-green-500/20 bg-green-500/5 text-green-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                {describePrescription(item.lens.prescription)}
              </div>
            )}
            <button
              onClick={() => setEditingIndex(idx)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-amber-300 border border-gold/40 hover:border-gold rounded-md px-2.5 py-1 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              {!lensNeedsPower(item.lens) ? 'Change Lens' : item.lens.prescription ? 'Edit Power' : 'Add Power'}
            </button>
          </div>
        );
        const lineTotal = `₹${((item.price + (item.lens?.price || 0)) * item.quantity).toLocaleString()}`;

        if (stacked) {
          return (
            <div key={`${item.productId}-${idx}`} className="pb-5 border-b border-zinc-800 last:border-0 last:pb-0">
              <div className="relative">
                <Link to={productUrl} aria-label={`View ${item.title}`} className="block w-full aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                  <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-contain" />
                </Link>
                <button
                  onClick={() => removeFromCart(item.productId, item.variant?.sku)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/60 backdrop-blur text-gray-300 hover:text-red-500 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Link to={productUrl} className="block mt-3 group/details">
                <h3 className="font-semibold text-white leading-snug line-clamp-2 group-hover/details:text-gold transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <p className="text-sm text-gray-400">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                  <p className="font-bold text-white">{lineTotal}</p>
                </div>
              </Link>
              {lensBlock}
            </div>
          );
        }

        return (
          <div
            key={`${item.productId}-${idx}`}
            className="flex gap-4 pb-4 border-b border-zinc-800 last:border-0 relative group"
          >
            <Link to={productUrl} className="shrink-0" aria-label={`View ${item.title}`}>
              <img
                src={getImageUrl(item.image)}
                alt={item.title}
                className="h-16 w-16 object-cover rounded-lg hover:opacity-80 transition-opacity"
              />
            </Link>
            <div className="flex-1 min-w-0 pr-6">
              <Link to={productUrl} className="block group/details">
                <h3 className="font-medium text-white truncate group-hover/details:text-gold transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400">
                  Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                </p>
              </Link>
              {lensBlock}
              <p className="font-semibold text-white mt-1">{lineTotal}</p>
            </div>
            <button
              onClick={() => removeFromCart(item.productId, item.variant?.sku)}
              className="absolute top-0 right-0 p-1 text-gray-500 hover:text-red-500 transition-colors"
              title="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <main className="py-8 lg:py-12 w-full flex flex-col">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6">
          <h1 className="text-3xl lg:text-4xl font-playfair font-bold text-white mb-8">
            Checkout
          </h1>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 w-full">
            {/* Phones: products first, then address/billing, then summary + pay */}
            <div className="lg:hidden bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-xl font-playfair font-bold text-white mb-4">
                Your Items ({cart.length})
              </h2>
              <div className="space-y-5">
                {renderCartItems(true)}
              </div>
            </div>

            {/* Left: Shipping Form */}
            <div className="lg:col-span-2 space-y-8 w-full min-w-0">
              {/* Saved Addresses Section (Amazon Style) */}
              {savedAddresses.length > 0 && !showNewAddressForm && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
                    <div>
                      <h2 className="text-2xl font-playfair font-bold text-white flex items-center gap-2.5">
                        <MapPin className="h-6 w-6 text-gold" />
                        Select Delivery Address
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">Choose a saved address or add a new one for 1-click shipping</p>
                    </div>
                    <button
                      onClick={() => {
                        setNewAddressData({
                          name: getUser()?.name || '',
                          phone: getUser()?.phone || '',
                          addressLine1: '',
                          addressLine2: '',
                          city: '',
                          state: '',
                          pincode: '',
                          addressType: 'home',
                          isDefault: false,
                          saveToAccount: true,
                        });
                        setShowNewAddressForm(true);
                      }}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold text-xs px-4 py-2.5 rounded-xl hover:brightness-110 transition-all shrink-0 uppercase tracking-wider shadow-lg shadow-gold/10"
                    >
                      <Plus className="h-4 w-4 stroke-[3]" />
                      Add New Address
                    </button>
                  </div>

                  {/* Saved Address Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr._id;
                      return (
                        <div
                          key={addr._id}
                          onClick={() => selectAddress(addr)}
                          className={`group relative border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                            isSelected
                              ? 'border-gold bg-gold/10 shadow-lg shadow-gold/5 ring-1 ring-gold/40'
                              : 'border-zinc-800 bg-black/40 hover:border-zinc-700 hover:bg-zinc-900/40'
                          }`}
                        >
                          <div>
                            {/* Header Badge Row */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getAddressTypeBadge(addr.addressType)}
                                {addr.isDefault && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Default
                                  </span>
                                )}
                              </div>
                              {/* Radio selection indicator */}
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isSelected ? 'border-gold bg-gold' : 'border-zinc-600 group-hover:border-zinc-400'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                              </div>
                            </div>

                            {/* Name & Phone */}
                            <h3 className="font-bold text-base text-white">{addr.name}</h3>
                            <p className="text-xs text-amber-400/90 font-mono mt-0.5">{addr.phone}</p>

                            {/* Full Address */}
                            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                              {addr.addressLine1}
                              {addr.addressLine2 && `, ${addr.addressLine2}`}
                            </p>
                            <p className="text-xs text-gray-400 font-medium mt-1">
                              {addr.city}, {addr.state} - <span className="font-mono text-gray-200 font-bold">{addr.pincode}</span>
                            </p>
                          </div>

                          {/* Action Bar */}
                          <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-zinc-800/80">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddress(addr);
                                setEditAddressData({ ...addr });
                              }}
                              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(addr._id);
                              }}
                              className="text-xs text-red-400/80 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-950/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>

                            {isSelected ? (
                              <span className="text-[11px] font-bold text-gold flex items-center gap-1 bg-gold/20 px-2.5 py-1 rounded-lg">
                                <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAddress(addr);
                                }}
                                className="text-xs font-semibold text-gray-300 group-hover:text-gold transition-colors"
                              >
                                Deliver Here &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Email Field for saved address users */}
              {savedAddresses.length > 0 && !showNewAddressForm && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl"
                >
                  <h2 className="text-lg font-playfair font-bold text-white flex items-center gap-2 mb-4">
                    <Mail className="h-5 w-5 text-gold" />
                    Contact & Receipt Email
                  </h2>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-gray-500 font-normal">(for order updates & invoice)</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-gold placeholder:text-gray-600 text-sm"
                      placeholder="name@example.com"
                    />
                    <p className="text-[11px] text-gray-500 mt-1.5">We'll send your order confirmation and tax invoice to this email.</p>
                  </div>
                </motion.div>
              )}

              {/* New Address Form (Amazon Style) */}
              {(showNewAddressForm || savedAddresses.length === 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                    <div>
                      <h2 className="text-2xl font-playfair font-bold text-white flex items-center gap-2">
                        <Plus className="h-6 w-6 text-gold" />
                        Add a New Delivery Address
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">Enter your shipping details. Address will be saved for 1-click checkout next time.</p>
                    </div>
                    {savedAddresses.length > 0 && (
                      <button
                        onClick={() => setShowNewAddressForm(false)}
                        className="text-xs text-gold hover:underline font-bold"
                      >
                        &larr; Back to Saved Addresses
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveNewAddress} className="space-y-5">
                    {/* 1-Click Address Type Selection Chips (Amazon Style) */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                        Address Type
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { type: 'home', label: 'Home', icon: Home, sub: 'All day delivery' },
                          { type: 'work', label: 'Office / Work', icon: Briefcase, sub: '9 AM - 6 PM delivery' },
                          { type: 'other', label: 'Other', icon: MapPin, sub: 'Other location' },
                        ].map(({ type, label, icon: Icon, sub }) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewAddressData({ ...newAddressData, addressType: type as any })}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                              newAddressData.addressType === type
                                ? 'border-gold bg-gold/15 text-white ring-1 ring-gold'
                                : 'border-zinc-800 bg-black/40 text-gray-400 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-1 ${newAddressData.addressType === type ? 'text-gold' : 'text-gray-400'}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                            <span className="text-[10px] text-gray-400 hidden sm:block">{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddressData.name}
                          onChange={(e) => setNewAddressData({ ...newAddressData, name: e.target.value })}
                          className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-gold placeholder:text-gray-600 text-sm"
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                          10-digit Mobile <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={newAddressData.phone}
                          onChange={(e) => setNewAddressData({ ...newAddressData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-gold placeholder:text-gray-600 text-sm font-mono"
                          placeholder="9876543210"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                          Email Address <span className="text-gray-500 font-normal">(Receipt & Invoice)</span>
                        </label>
                        <input
                          type="email"
                          value={newAddressData.email}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewAddressData({ ...newAddressData, email: val });
                            setFormData(prev => ({ ...prev, email: val }));
                          }}
                          className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-gold placeholder:text-gray-600 text-sm"
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                        Address Line 1 (House No., Flat, Building, Street) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddressData.addressLine1}
                        onChange={(e) => setNewAddressData({ ...newAddressData, addressLine1: e.target.value })}
                        className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-gold placeholder:text-gray-600 text-sm"
                        placeholder="e.g. Flat 402, Building A, Sunshine Apartments"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                        Address Line 2 (Area, Colony, Landmark) (Optional)
                      </label>
                      <input
                        type="text"
                        value={newAddressData.addressLine2}
                        onChange={(e) => setNewAddressData({ ...newAddressData, addressLine2: e.target.value })}
                        className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-gold placeholder:text-gray-600 text-sm"
                        placeholder="e.g. Near HDFC Bank, M.G. Road"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                          Pincode <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={newAddressData.pincode}
                          onChange={(e) => {
                            const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setNewAddressData({ ...newAddressData, pincode: pin });
                            if (pin.length === 6) {
                              checkPincodeAvailability(pin);
                            }
                          }}
                          className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-gold placeholder:text-gray-600 text-sm font-mono"
                          placeholder="6-digit Pincode"
                        />
                        {checkingPincode && <span className="text-[11px] text-gold animate-pulse mt-1 block">Checking pincode availability...</span>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddressData.city}
                          onChange={(e) => setNewAddressData({ ...newAddressData, city: e.target.value })}
                          className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-gold placeholder:text-gray-600 text-sm"
                          placeholder="e.g. Mumbai"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddressData.state}
                          onChange={(e) => setNewAddressData({ ...newAddressData, state: e.target.value })}
                          className="w-full bg-black border border-zinc-800 text-white p-3 rounded-xl focus:outline-none focus:border-gold placeholder:text-gray-600 text-sm"
                          placeholder="e.g. Maharashtra"
                        />
                      </div>
                    </div>

                    {/* Auto-Save & Default Checkboxes */}
                    <div className="pt-2 space-y-2 border-t border-zinc-800">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={newAddressData.saveToAccount}
                          onChange={(e) => setNewAddressData({ ...newAddressData, saveToAccount: e.target.checked })}
                          className="w-4 h-4 rounded border-zinc-700 text-gold focus:ring-gold bg-black"
                        />
                        <span className="text-xs text-gray-300 group-hover:text-white font-medium">
                          Save this address to my account for 1-click checkout next time
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={newAddressData.isDefault}
                          onChange={(e) => setNewAddressData({ ...newAddressData, isDefault: e.target.checked })}
                          className="w-4 h-4 rounded border-zinc-700 text-gold focus:ring-gold bg-black"
                        />
                        <span className="text-xs text-gray-300 group-hover:text-white font-medium">
                          Make this my default shipping address
                        </span>
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs py-3 rounded-xl transition-colors uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingAddress}
                        className="flex-1 bg-gradient-to-r from-amber-500 via-gold to-yellow-600 text-black font-bold text-xs py-3.5 rounded-xl hover:brightness-110 transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-gold/10 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isSavingAddress ? 'Saving Address...' : 'Save & Use This Address'}
                      </button>
                    </div>
                  </form>
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

                {/* Cart Items (desktop; phones show them above the form) */}
                <div className="hidden lg:block space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {renderCartItems()}
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
          openPowerForm
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
            toast({
              title: "Lens updated",
              description: lensNeedsPower(updatedItem.lens) ? describePrescription(lensData.prescription) : updatedItem.lens.name
            });
            setEditingIndex(null);
          }}
        />
      )}

      {/* Quick Address Edit Modal */}
      {editingAddress && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8 text-white relative"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <h3 className="text-xl font-bold font-playfair flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-gold" /> Edit Delivery Address
              </h3>
              <button
                onClick={() => setEditingAddress(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editAddressData.name || ''}
                  onChange={(e) => setEditAddressData({ ...editAddressData, name: e.target.value })}
                  className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-xl text-sm focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={editAddressData.phone || ''}
                  onChange={(e) => setEditAddressData({ ...editAddressData, phone: e.target.value })}
                  className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-xl text-sm font-mono focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={editAddressData.addressLine1 || ''}
                  onChange={(e) => setEditAddressData({ ...editAddressData, addressLine1: e.target.value })}
                  className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-xl text-sm focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={editAddressData.addressLine2 || ''}
                  onChange={(e) => setEditAddressData({ ...editAddressData, addressLine2: e.target.value })}
                  className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-xl text-sm focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={editAddressData.pincode || ''}
                    onChange={(e) => setEditAddressData({ ...editAddressData, pincode: e.target.value })}
                    className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-xl text-sm font-mono focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editAddressData.city || ''}
                    onChange={(e) => setEditAddressData({ ...editAddressData, city: e.target.value })}
                    className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-xl text-sm focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={editAddressData.state || ''}
                    onChange={(e) => setEditAddressData({ ...editAddressData, state: e.target.value })}
                    className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded-xl text-sm focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Address Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['home', 'work', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditAddressData({ ...editAddressData, addressType: type })}
                      className={`py-2 text-xs font-bold rounded-lg border capitalize transition-colors ${
                        editAddressData.addressType === type
                          ? 'border-gold bg-gold/20 text-gold'
                          : 'border-zinc-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingAddress(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="flex-1 bg-gold text-black font-bold text-xs py-2.5 rounded-xl hover:bg-gold/90 transition-colors uppercase tracking-wider"
                >
                  {isSavingAddress ? 'Saving...' : 'Update Address'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Checkout
