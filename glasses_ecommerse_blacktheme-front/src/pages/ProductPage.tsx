import { useState, useEffect } from "react";
import { Heart, ShoppingBag, Shield, Star, ChevronRight, Layers, Minus, Plus, ShoppingCart, Store, Zap, Users, Award, Scissors, Info, Sparkles, Check, Glasses, Eye } from "lucide-react";
import { cn, getImageUrl, calculateProductDiscount } from "@/lib/utils";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGallery from "@/components/product/ProductGallery";
import ProductSpecs from "@/components/product/ProductSpecs";
import ProductReviews from "@/components/product/ProductReviews";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/context/WishlistContext";
import { lens, products, pincodes } from "@/lib/api";
import LensSelectionModal from "@/components/product/LensSelectionModal";
import ProductSlider from "@/components/sections/ProductSlider";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lens states
  const [showLensModal, setShowLensModal] = useState(false);
  const [selectedLens, setSelectedLens] = useState<any>(null);
  const [isBuyNowFlow, setIsBuyNowFlow] = useState(false);

  // Dynamic selections
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = product ? isInWishlist(product._id) : false;

  // Discovery states
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [vendorData, setVendorData] = useState<any>(null);

  // Pincode checker state
  const [pincode, setPincode] = useState("");
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    loadProduct();
  }, [id]);

  async function loadProduct() {
    try {
      setLoading(true);
      setSelectedImageIndex(0);
      const data = await products.get(id!);
      if (!data || !data._id) {
        throw new Error('Product not found');
      }
      setProduct(data);

      // Set defaults immediately
      if (data.colors && data.colors.length > 0) {
        setSelectedColor(data.colors[0]);
      } else {
        setSelectedColor("");
      }

      if (data.attributes && data.attributes.length > 0) {
        const defaults: Record<string, string> = {};
        data.attributes.forEach((attr: any) => {
          if (attr.values && attr.values.length > 0) {
            defaults[attr.name] = attr.values[0];
          }
        });
        setSelectedAttributes(defaults);
      } else {
        setSelectedAttributes({});
      }

      // Vendor details initialization
      if (data.vendorId && typeof data.vendorId === 'object') {
        const v = data.vendorId;
        const addressObj = (v.address && typeof v.address === 'object') ? v.address : {};
        const locParts = [addressObj.city, addressObj.state, addressObj.country].filter(Boolean);
        const locationStr = locParts.length > 0 ? locParts.join(', ') : (addressObj.street || '');
        
        setVendorData({
          name: v.businessName || v.storeName || "Verified Seller",
          logo: v.logo || null,
          rating: Number(v.rating) || 5.0,
          totalReviews: Number(v.totalReviews) || Number(data.totalReviews) || 0,
          totalProducts: Number(v.totalProducts) || 1,
          location: locationStr
        });
      } else {
        setVendorData({
          name: "Verified Seller",
          logo: null,
          rating: 5.0,
          totalReviews: Number(data.totalReviews) || 0,
          totalProducts: 1,
          location: ""
        });
      }

      // Page is ready instantly!
      setLoading(false);

      // Load related products asynchronously in background
      loadRelatedProducts(data);
    } catch (err) {
      console.error('Failed to load product:', err);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive"
      });
      setLoading(false);
      navigate('/shop');
    }
  }

  async function loadRelatedProducts(data: any) {
    try {
      const currentVendorId = typeof data.vendorId === 'object' ? data.vendorId?._id : data.vendorId;
      const currentCategoryId = typeof data.category === 'object' ? data.category?._id : data.category;

      let sameVendor: any[] = [];
      let sameCategory: any[] = [];

      if (currentVendorId) {
        try {
          const vRes = await products.list({ vendorId: currentVendorId, limit: 12 });
          const vList = Array.isArray(vRes) ? vRes : (vRes?.products || []);
          sameVendor = vList.filter((p: any) => p._id !== data._id);
        } catch (e) {}
      }

      if (currentCategoryId) {
        try {
          const cRes = await products.list({ category: currentCategoryId, limit: 12 });
          const cList = Array.isArray(cRes) ? cRes : (cRes?.products || []);
          sameCategory = cList.filter((p: any) => p._id !== data._id);
        } catch (e) {}
      }

      setVendorProducts(sameVendor);
      setSimilarProducts(sameCategory);
    } catch (e) {
      console.warn('Failed to load related products:', e);
    }
  }

  const handlePincodeCheck = async () => {
    if (pincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive"
      });
      return;
    }

    try {
      setCheckingPincode(true);
      const result = await pincodes.check(pincode);
      setPincodeStatus(result);

      if (!result.serviceable) {
        toast({
          title: "Delivery Not Available",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking pincode:', error);
      toast({
        title: "Error",
        description: "Failed to check pincode. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCheckingPincode(false);
    }
  };

  const getCurrentVariant = () => {
    if (!product || !product.hasVariants || !product.variants || product.variants.length === 0) return null;
    const currentSelection: Record<string, string> = { ...selectedAttributes };
    if (selectedColor) currentSelection["Color"] = selectedColor;
    return product.variants.find((variant: any) => {
      const variantValues = variant.variantValues || {};
      return Object.keys(currentSelection).every(key => variantValues[key] === currentSelection[key]);
    });
  };

  const currentVariant = getCurrentVariant();

  const getValidImages = () => {
    if (!product) return [];
    let list: string[] = [];
    if (currentVariant?.images && Array.isArray(currentVariant.images) && currentVariant.images.length > 0) {
      list = currentVariant.images;
    } else if (Array.isArray(product?.images) && product.images.length > 0) {
      list = product.images;
    } else if (typeof product?.images === 'string' && product.images) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) list = parsed;
        else list = [product.images];
      } catch {
        list = [product.images];
      }
    }

    if (list.length === 0 && product) {
      if (product.thumbnail) list.push(product.thumbnail);
      if (product.image && !list.includes(product.image)) list.push(product.image);
    }

    return list.filter((img: any) => typeof img === 'string' && img.trim() !== '');
  };

  const displayImages = getValidImages();

  // All Hooks MUST be declared at top-level before early returns!
  useEffect(() => {
    if (displayImages.length > 0 && selectedImageIndex >= displayImages.length) {
      setSelectedImageIndex(0);
    }
  }, [displayImages.length, selectedImageIndex]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Link to="/shop" className="text-primary hover:underline">Return to Shop</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const computeProductPricing = () => {
    const variant = getCurrentVariant();
    const lensPrice = Number(selectedLens?.package?.price || 0);

    const calc = calculateProductDiscount(product, variant);

    return {
      basePrice: calc.sellingPrice,
      displayPrice: calc.sellingPrice + lensPrice,
      originalPrice: calc.hasDiscount ? calc.mrpPrice + lensPrice : 0,
      hasDiscount: calc.hasDiscount,
      discount: calc.discountPercentage,
      discountLabel: calc.discountLabel
    };
  };

  const displayStock = currentVariant
    ? (currentVariant.stock ?? 999)
    : (product?.stock && product.stock > 0 ? product.stock : 999);

  const { basePrice, displayPrice, originalPrice, hasDiscount, discount, discountLabel } = computeProductPricing();

  const handleAddToCart = (lensData?: any, stayOnPage = true) => {
    if (displayStock <= 0) {
      toast({ title: "Out of Stock", description: "This variant is currently out of stock.", variant: "destructive" });
      return;
    }
    const variantInfo = currentVariant ? { sku: currentVariant.sku, variantValues: currentVariant.variantValues } : null;
    const activeLens = lensData || selectedLens; // Use passed lens or state selected lens
    const lensInfo = activeLens?.type ? {
      typeId: activeLens.type._id,
      typeName: activeLens.type.name,
      packageId: activeLens.package?._id,
      packageName: activeLens.package?.name || activeLens.type.name,
      name: activeLens.package?.name || activeLens.type.name,
      price: activeLens.package?.price || 0,
      prescription: activeLens.prescription,
      // Store settings for re-editing in checkout
      type: activeLens.type,
      package: activeLens.package,
      lensSettings: product.lensSettings 
    } : undefined;

    addToCart({ 
      productId: product._id, 
      vendorId: product.vendorId?._id || product.vendorId,
      title: product.title, 
      price: basePrice, 
      quantity, 
      image: displayImages?.[0] || "", 
      variant: variantInfo, 
      lens: lensInfo 
    });
    toast({ title: "Added to Cart!", description: `${product.title} has been added to your cart.` });
    if (!stayOnPage) setSelectedLens(null);
  };

  const checkIsAccessory = (prod: any) => {
    if (!prod) return false;
    const catName = (typeof prod.category === 'object' ? prod.category?.name || prod.category?.slug : '')?.toLowerCase() || '';
    const title = (prod.title || '').toLowerCase();
    const tags = Array.isArray(prod.searchTags) ? prod.searchTags.join(' ').toLowerCase() : '';

    return catName.includes('accessori') || catName.includes('accessory') || catName.includes('solution')
      || catName.includes('cleaner') || catName.includes('cloth') || catName.includes('spray') || catName.includes('case')
      || title.includes('lens cleaner') || title.includes('cleaning solution') || title.includes('microfiber') || title.includes('eyewear case') || title.includes('contact lens solution')
      || tags.includes('accessory') || tags.includes('solution')
      || prod?.lensSettings?.allowLensSelection === false;
  };

  // Enable lens selection for eyewear products, but disable for Accessories & Solutions
  const allowLensSelection = !checkIsAccessory(product) && product?.lensSettings?.disableLensSelection !== true;

  const handleBuyNow = () => {
    if (displayStock <= 0) {
      toast({ title: "Out of Stock", description: "This variant is currently out of stock.", variant: "destructive" });
      return;
    }

    if (allowLensSelection && !selectedLens) {
      setIsBuyNowFlow(true);
      setShowLensModal(true);
      toast({ title: "Select your Lens & Power", description: "Choose your lens package or zero power option to proceed directly to checkout." });
    } else {
      handleAddToCart(selectedLens, true);
      navigate('/checkout');
    }
  };

  const getReturnPolicyText = (policy: any) => {
    if (!policy) return '14-day returns';
    if (typeof policy === 'string') return policy;
    if (typeof policy === 'object') {
      if (policy.policyText && typeof policy.policyText === 'string') return policy.policyText;
      if (policy.returnPeriodDays) return `${policy.returnPeriodDays}-day returns`;
      if (policy.allowReturns === false) return 'Non-returnable';
      if (policy.allowReturns) return 'Returns available';
    }
    return '14-day returns';
  };

  const getWarrantyText = (w: any) => {
    if (!w) return '6 Months Warranty';
    if (typeof w === 'string') return w;
    if (typeof w === 'object') {
      if (w.text) return String(w.text);
      if (w.duration) return `${w.duration} Warranty`;
    }
    return String(w);
  };

  const rawWarranty = product.eyewearDetails?.warranty || product.warranty;
  const productWarranty = getWarrantyText(rawWarranty);

  const specifications: { label: string; value: string }[] = [];

  if (product) {
    if (product.sku) specifications.push({ label: "SKU / Model Code", value: String(product.sku) });
    
    if (product.brand) {
      const bName = typeof product.brand === 'object' ? product.brand.name : product.brand;
      if (bName) specifications.push({ label: "Brand", value: String(bName) });
    }

    if (product.category) {
      const cName = typeof product.category === 'object' ? product.category.name : product.category;
      if (cName) specifications.push({ label: "Category", value: String(cName) });
    }

    if (product.eyewearDetails && typeof product.eyewearDetails === 'object') {
      const details = product.eyewearDetails;
      const detailMap = [
        { key: 'gender', label: 'Gender' },
        { key: 'frameType', label: 'Frame Type' },
        { key: 'frameShape', label: 'Frame Shape' },
        { key: 'frameMaterial', label: 'Frame Material' },
        { key: 'frameColor', label: 'Frame Color' },
        { key: 'glassColor', label: 'Lens / Glass Color' },
        { key: 'frameSize', label: 'Frame Size' },
        { key: 'frameWidth', label: 'Frame Width' },
        { key: 'frameDimensions', label: 'Frame Dimensions' },
        { key: 'bridgeSize', label: 'Bridge Size' },
        { key: 'templeLength', label: 'Temple Length' },
        { key: 'lensWidth', label: 'Lens Width' },
        { key: 'weight', label: 'Weight' },
        { key: 'weightGroup', label: 'Weight Group' },
        { key: 'countryOfOrigin', label: 'Country of Origin' },
        { key: 'modelNo', label: 'Model Number' },
        { key: 'prescriptionAvailable', label: 'Prescription Supported', isBool: true },
        { key: 'uvProtection', label: 'UV Protection' },
        { key: 'polarized', label: 'Polarized', isBool: true },
        { key: 'faceShape', label: 'Ideal for Face Shape' },
        { key: 'style', label: 'Style' },
        { key: 'features', label: 'Special Features' },
      ];
      detailMap.forEach(item => {
        const val = details[item.key as keyof typeof details];
        if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
          const strVal = item.isBool
            ? (val ? 'Yes' : 'No')
            : (typeof val === 'object' ? (Array.isArray(val) ? val.join(', ') : JSON.stringify(val)) : String(val));
          specifications.push({ label: item.label, value: strVal });
        }
      });
    }

    if (Array.isArray(product.attributes)) {
      product.attributes.forEach((attr: any) => {
        if (attr && attr.name && attr.values) {
          if (!specifications.some(s => s.label.toLowerCase() === String(attr.name).toLowerCase())) {
            const val = Array.isArray(attr.values) ? attr.values.join(", ") : String(attr.values);
            if (val) specifications.push({ label: String(attr.name), value: val });
          }
        }
      });
    }

    if (product.unit) specifications.push({ label: "Unit", value: String(product.unit) });
    if (product.minOrderQuantity && product.minOrderQuantity > 1) {
      specifications.push({ label: "Minimum Order Quantity", value: String(product.minOrderQuantity) });
    }
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <main>
        {/* Breadcrumb */}
        <div style={{ background: 'var(--color-background, #09090b)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '.73rem', color: '#6b7280', padding: '7px 32px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 4px' }}>›</span>
          <Link to="/shop" style={{ color: '#6b7280', textDecoration: 'none' }}>Shop</Link>
          <span style={{ margin: '0 4px' }}>›</span>
          <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{product.title}</span>
        </div>

        {/* Main product grid — thumbnails | image | detail */}
        <div className="flex flex-col lg:grid lg:grid-cols-[90px_1fr_400px] bg-[#111] min-h-[calc(100vh-140px)]">

          {/* Thumbnails */}
          <div className="flex flex-row lg:flex-col gap-2.5 p-4 lg:pl-3.5 overflow-x-auto border-b lg:border-b-0 lg:border-r border-white/10 bg-[#111] order-2 lg:order-1 no-scrollbar">
            {(displayImages || []).map((img: string, i: number) => (
              <div
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                style={{ minWidth: 72, width: 72, height: 72, border: `1.5px solid ${selectedImageIndex === i ? '#DAAB34' : 'rgba(255,255,255,0.15)'}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color .15s', flexShrink: 0 }}>
                <img src={getImageUrl(img)} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }} />
              </div>
            ))}
            {(displayImages || []).length === 0 && (
              <div style={{ width: 72, height: 72, border: '1.5px solid #DAAB34', borderRadius: 8, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 76 38" fill="none" width="56" height="28"><rect x="2" y="8" width="30" height="22" rx="11" stroke="#DAAB34" strokeWidth="3" /><rect x="44" y="8" width="30" height="22" rx="11" stroke="#DAAB34" strokeWidth="3" /><line x1="32" y1="19" x2="44" y2="19" stroke="#DAAB34" strokeWidth="2.5" /></svg>
              </div>
            )}
            {hasDiscount && (
              <div style={{ background: '#ef4444', color: '#fff', fontSize: '.72rem', fontWeight: 700, borderRadius: 6, padding: '3px 7px', textAlign: 'center', marginTop: 4 }}>
                {discountLabel || `${discount}% OFF`}
              </div>
            )}
          </div>

          {/* Main image */}
          <div className="flex items-start justify-center p-4 lg:p-6 bg-[#0d0d0d] border-b lg:border-b-0 lg:border-r border-white/10 relative order-1 lg:order-2">
            <ProductGallery
              images={displayImages || []}
              productName={product.title}
              hideThumbnails
              currentImage={selectedImageIndex}
              onImageChange={setSelectedImageIndex}
            />
          </div>

          {/* Detail panel */}
          <div className="flex flex-col gap-[14px] p-6 lg:p-8 bg-[#111] overflow-y-auto order-3">

            {/* Rating row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: i < Math.round(product.averageRating || 0) ? '#f5a623' : '#444', fontSize: '1rem' }}>★</span>
              ))}
              <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#e5e7eb' }}>{(product.averageRating || 0).toFixed(1)}</span>
              <span style={{ color: '#6b7280', fontSize: '.8rem' }}>{product.totalReviews || 0} reviews</span>
            </div>

            {/* Product name + sub */}
            <div>
              {product.brand && (
                <div style={{ fontSize: '.73rem', fontWeight: 700, color: '#DAAB34', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 4 }}>
                  {typeof product.brand === 'object' ? product.brand.name : product.brand}
                </div>
              )}
              <h1 style={{ fontSize: '1.18rem', fontWeight: 700, lineHeight: 1.35, color: '#f9fafb', margin: 0 }}>{product.title}</h1>
              <div style={{ fontSize: '.82rem', color: '#9ca3af', marginTop: 2 }}>
                {[product.eyewearDetails?.frameType, product.eyewearDetails?.frameShape, product.eyewearDetails?.frameColor, product.eyewearDetails?.frameSize].filter(Boolean).join(' · ')}
              </div>
            </div>

            {/* Orders / wishlist */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.78rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              <span>{product.totalOrders || 0} Orders</span>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <span>{product.wishlistCount || 0} Wish Listed</span>
            </div>

            {/* Specs pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {product.eyewearDetails?.gender && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', border: '1.5px solid rgba(218,171,52,0.3)', borderRadius: 6, fontSize: '.67rem', fontWeight: 600, color: '#DAAB34', background: 'rgba(218,171,52,0.08)', cursor: 'default', letterSpacing: '.3px' }}>
                  <Users style={{ width: 11, height: 11 }} />{String(product.eyewearDetails.gender).toUpperCase()}
                </div>
              )}
              {product.brand && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', border: '1.5px solid rgba(96,165,250,0.3)', borderRadius: 6, fontSize: '.67rem', fontWeight: 600, color: '#60a5fa', background: 'rgba(96,165,250,0.08)', letterSpacing: '.3px' }}>
                  <Award style={{ width: 11, height: 11 }} />{String(typeof product.brand === 'object' ? product.brand.name : product.brand).toUpperCase()}
                </div>
              )}
              {product.eyewearDetails?.frameShape && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', border: '1.5px solid rgba(251,146,60,0.3)', borderRadius: 6, fontSize: '.67rem', fontWeight: 600, color: '#fb923c', background: 'rgba(251,146,60,0.08)', letterSpacing: '.3px' }}>
                  <Scissors style={{ width: 11, height: 11 }} />{String(product.eyewearDetails.frameShape).toUpperCase()}
                </div>
              )}
              {product.eyewearDetails?.faceShape && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', border: '1.5px solid rgba(74,222,128,0.3)', borderRadius: 6, fontSize: '.67rem', fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.08)', letterSpacing: '.3px' }}>
                  <Info style={{ width: 11, height: 11 }} />FOR {String(Array.isArray(product.eyewearDetails.faceShape) ? product.eyewearDetails.faceShape.join('/') : product.eyewearDetails.faceShape).toUpperCase()} FACE
                </div>
              )}
              {product.category && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', border: '1.5px solid rgba(167,139,250,0.3)', borderRadius: 6, fontSize: '.67rem', fontWeight: 600, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', letterSpacing: '.3px' }}>
                  <Layers style={{ width: 11, height: 11 }} />{String(typeof product.category === 'object' ? product.category.name : product.category).toUpperCase()}
                </div>
              )}
              {product.eyewearDetails?.polarized && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', border: '1.5px solid rgba(234,179,8,0.4)', borderRadius: 6, fontSize: '.67rem', fontWeight: 700, color: '#eab308', background: 'rgba(234,179,8,0.1)', letterSpacing: '.3px' }}>
                  ⚡ POLARIZED
                </div>
              )}
              {product.eyewearDetails?.uvProtection && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', border: '1.5px solid rgba(34,197,94,0.4)', borderRadius: 6, fontSize: '.67rem', fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', letterSpacing: '.3px' }}>
                  <Shield style={{ width: 11, height: 11 }} />{String(product.eyewearDetails.uvProtection).toUpperCase()}
                </div>
              )}
              {product.eyewearDetails?.prescriptionAvailable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', border: '1.5px solid rgba(56,189,248,0.4)', borderRadius: 6, fontSize: '.67rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', letterSpacing: '.3px' }}>
                  👓 PRESCRIPTION READY
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.55rem', fontWeight: 800, color: '#DAAB34' }}>₹{displayPrice.toLocaleString()}</span>
                {hasDiscount && (
                  <>
                    <span style={{ fontSize: '.95rem', color: '#6b7280', textDecoration: 'line-through' }}>₹{originalPrice.toLocaleString()}</span>
                    <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.14)', padding: '3px 9px', borderRadius: 20 }}>{discountLabel || `${discount}% OFF`}</span>
                  </>
                )}
              </div>
              {hasDiscount && originalPrice > displayPrice && (
                <div style={{ fontSize: '.78rem', color: '#22c55e', fontWeight: 600, marginTop: 4 }}>
                  🎉 You save ₹{(originalPrice - displayPrice).toLocaleString()}!
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

            {/* Frame Colour */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <div style={{ fontSize: '.73rem', fontWeight: 600, color: '#6b7280', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 7 }}>Frame Colour</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {product.colors.map((color: string) => (
                    <div
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
                        backgroundColor: color.toLowerCase(),
                        border: selectedColor === color ? '2px solid #DAAB34' : '2px solid transparent',
                        transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all .15s',
                        outline: selectedColor === color ? '1px solid #DAAB34' : 'none',
                        outlineOffset: 2
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Frame Size from attributes */}
            {product.attributes && product.attributes.length > 0 && product.attributes.map((attr: any) => (
              attr.values && attr.values.length > 0 && (
                <div key={attr.name}>
                  <div style={{ fontSize: '.73rem', fontWeight: 600, color: '#6b7280', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 7 }}>{attr.name}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {attr.values.map((val: string) => (
                      <button
                        key={val}
                        onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: val }))}
                        style={{
                          padding: '6px 13px',
                          border: selectedAttributes[attr.name] === val ? '1.5px solid #DAAB34' : '1.5px solid rgba(255,255,255,0.15)',
                          borderRadius: 6, fontSize: '.8rem', fontWeight: 500, cursor: 'pointer',
                          background: selectedAttributes[attr.name] === val ? '#DAAB34' : 'transparent',
                          color: selectedAttributes[attr.name] === val ? '#000' : '#e5e7eb',
                          fontFamily: "'DM Sans', sans-serif",
                          transition: 'all .15s'
                        }}
                      >{val}</button>
                    ))}
                  </div>
                </div>
              )
            ))}

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

            {/* Delivery check */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 8, color: '#e5e7eb' }}>🚚 Check Delivery</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ flex: 1, border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '8px 11px', fontFamily: "'DM Sans',sans-serif", fontSize: '.82rem', outline: 'none', background: 'transparent', color: '#e5e7eb' }}
                  onFocus={e => e.target.style.borderColor = '#DAAB34'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
                <button
                  onClick={handlePincodeCheck}
                  style={{ background: '#DAAB34', color: '#000', border: 'none', borderRadius: 7, padding: '8px 14px', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                >
                  {checkingPincode ? '...' : 'Check'}
                </button>
              </div>
              {pincodeStatus && (
                <div style={{ marginTop: 6, fontSize: '.75rem', fontWeight: 600, color: pincodeStatus.serviceable ? '#22c55e' : '#ef4444' }}>
                  {pincodeStatus.serviceable ? '✅ ' : '❌ '}{pincodeStatus.message}
                </div>
              )}
            </div>

            {/* Qty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '.73rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px' }}>Qty</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', color: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus style={{ width: 13, height: 13 }} /></button>
                <span style={{ width: 40, textAlign: 'center', fontWeight: 700, fontSize: '.9rem', color: '#f9fafb' }}>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(displayStock, quantity + 1))} style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', color: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus style={{ width: 13, height: 13 }} /></button>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

            {/* Lens Customization Selection Box */}
            {allowLensSelection && (
              <div style={{ background: 'rgba(218,171,52,0.06)', border: '1.5px solid rgba(218,171,52,0.25)', borderRadius: 12, padding: 14, marginTop: 10, marginBottom: 12 }}>
                {selectedLens ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#DAAB34', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Check style={{ width: 14, height: 14 }} /> {selectedLens.type?.name} — {selectedLens.package?.name || 'Selected'}
                      </div>
                      <div style={{ fontSize: '.74rem', color: '#9ca3af', marginTop: 2 }}>
                        {selectedLens.prescription ? (
                          selectedLens.prescription.method === 'upload' ? '📄 Prescription Slip Uploaded' :
                          selectedLens.prescription.method === 'later' ? '📲 Submit Power Later via WhatsApp/Call' :
                          '✍️ Eye Power Values Entered'
                        ) : selectedLens.package?.price ? `+₹${selectedLens.package.price}` : 'Frame Only (No Lenses)'}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowLensModal(true)}
                      style={{ background: 'transparent', color: '#DAAB34', border: '1px solid rgba(218,171,52,0.4)', borderRadius: 6, padding: '5px 11px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: '.84rem', fontWeight: 700, color: '#DAAB34', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Glasses style={{ width: 16, height: 16 }} /> Select Lenses & Eye Power
                      </div>
                      <span style={{ fontSize: '.68rem', background: '#DAAB34', color: '#000', fontWeight: 800, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                        Step 1
                      </span>
                    </div>
                    <p style={{ fontSize: '.76rem', color: '#9ca3af', marginBottom: 10, lineHeight: 1.3 }}>
                      Choose <strong>With Power</strong> (Prescription / Zero Power) or <strong>Frame Only</strong> before ordering.
                    </p>
                    <button
                      onClick={() => setShowLensModal(true)}
                      style={{ width: '100%', background: 'rgba(218,171,52,0.14)', color: '#DAAB34', border: '1.5px solid #DAAB34', borderRadius: 8, padding: '10px 0', fontSize: '.84rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}
                    >
                      <Sparkles style={{ width: 15, height: 15 }} /> Select Lenses & Add Power →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons: BUY NOW + ADD TO CART + WISHLIST */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
              <button
                onClick={handleBuyNow}
                disabled={displayStock <= 0}
                style={{ background: 'linear-gradient(135deg, #DAAB34 0%, #F5C542 100%)', color: '#000', border: 'none', borderRadius: 10, padding: '14px 0', fontFamily: "'DM Sans',sans-serif", fontSize: '.92rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: displayStock <= 0 ? 0.4 : 1, boxShadow: '0 4px 14px rgba(218,171,52,0.3)' }}
              >
                <Zap style={{ width: 17, height: 17, fill: '#000' }} /> BUY NOW
              </button>
              <button
                onClick={() => handleAddToCart()}
                disabled={displayStock <= 0}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '14px 0', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: displayStock <= 0 ? 0.4 : 1 }}
              >
                <ShoppingCart style={{ width: 16, height: 16 }} /> Add to Cart
              </button>
              <button
                onClick={() => toggleWishlist(product._id)}
                style={{ background: 'transparent', color: isWishlisted ? '#ef4444' : '#e5e7eb', border: `1.5px solid ${isWishlisted ? '#ef4444' : 'rgba(255,255,255,0.2)'}`, borderRadius: 10, padding: '12px 14px', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Heart style={{ width: 18, height: 18, fill: isWishlisted ? '#ef4444' : 'none' }} />
              </button>
            </div>

            {/* Vendor info */}
            {vendorData && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {vendorData.logo ? <img src={getImageUrl(vendorData.logo)} alt={vendorData.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Store style={{ width: 24, height: 24, color: '#6b7280' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#f9fafb' }}>{vendorData.name}</div>
                    <div style={{ fontSize: '.73rem', color: '#6b7280' }}>
                      {vendorData.totalProducts} products · {vendorData.totalReviews} reviews
                      {vendorData.location ? ` · 📍 ${vendorData.location}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Below-fold: Specs + Reviews (grid) → Description → Related */}
        <div className="bg-background py-8 lg:py-12">
          <div className="w-full px-4 lg:px-8 xl:px-12 space-y-10 max-w-[1600px] mx-auto">
            
            {/* Specs + Reviews — matching layout of product grid above */}
            <div className="flex flex-col items-stretch lg:grid lg:grid-cols-[1fr_400px] gap-6 lg:items-start w-full">
              <ProductSpecs specifications={specifications} warranty={productWarranty} />
              <ProductReviews productId={product._id} averageRating={product.averageRating || 0} totalReviews={product.totalReviews || 0} />
            </div>

            {/* Product Story — full width */}
            <div className="premium-card p-8 rounded-2xl bg-secondary/10">
              <h3 className="text-lg font-bold mb-6 border-b border-white/5 pb-4">Product Story</h3>
              <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed text-sm font-medium" dangerouslySetInnerHTML={{ __html: product.description || '<p>No detailed description available for this product.</p>' }} />
            </div>

            {(vendorProducts && vendorProducts.length > 0) && (
              <ProductSlider
                title="More From The Store"
                subtitle="Explore other curated pieces from this vendor"
                products={vendorProducts.map(p => ({ ...p, salePrice: p.discountPrice }))}
                viewAllLink="/shop"
                viewAllText="View All Products"
              />
            )}

            {(similarProducts && similarProducts.length > 0) && (
              <ProductSlider
                title="Similar Masterpieces"
                subtitle="You might also appreciate these exquisite designs"
                products={similarProducts.map(p => ({ ...p, salePrice: p.discountPrice }))}
                viewAllLink="/shop"
                viewAllText="Explore All"
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
      <LensSelectionModal
        isOpen={showLensModal}
        onClose={() => {
          setShowLensModal(false);
        }}
        product={product}
        framePrice={basePrice}
        onSelect={(data) => {
          setSelectedLens(data);
          handleAddToCart(data, true);
          setShowLensModal(false);
          if (isBuyNowFlow) {
            setIsBuyNowFlow(false);
            navigate('/checkout');
          }
        }}
        productTitle={product.title}
        vendorId={typeof product.vendorId === 'object' ? product.vendorId._id : product.vendorId}
      />
    </div>
  );
};

export default ProductPage;
