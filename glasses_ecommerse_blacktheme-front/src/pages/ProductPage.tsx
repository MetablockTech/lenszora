import { useState, useEffect } from "react";
import { Heart, ShoppingBag, Shield, Star, ChevronRight, Layers, Minus, Plus, ShoppingCart, Store, Zap, Users, Award, Scissors, Info, Sparkles, Check, Glasses, Eye, Truck, ShieldCheck, CheckCircle2, PackageCheck, MessageSquare, Gift, Tag, HelpCircle, BadgePercent, Ruler, Headphones, RefreshCw } from "lucide-react";
import { cn, getImageUrl, calculateProductDiscount, isFrameOnlyLens, colorSwatchBackground, formatColorName } from "@/lib/utils";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGallery from "@/components/product/ProductGallery";
import ProductSpecs from "@/components/product/ProductSpecs";
import ProductReviews from "@/components/product/ProductReviews";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/context/WishlistContext";
import { lens, products, pincodes, categories as categoriesAPI, stores as storesAPI } from "@/lib/api";
import StoreVisitModal from "@/components/modals/StoreVisitModal";
import LensSelectionModal from "@/components/product/LensSelectionModal";
import ProductSlider from "@/components/sections/ProductSlider";

// The live categories API can take several seconds; share one request across product pages
// and keep a slim copy (id, name, slug, parent) for the browser session
type CategoryLite = { _id: string; name?: string; slug?: string; parentId?: string | { _id: string } | null };
const CATEGORIES_CACHE_KEY = 'lz_category_tree_v1';
let categoriesPromise: Promise<CategoryLite[]> | null = null;
const loadCategories = () => {
  if (categoriesPromise) return categoriesPromise;
  try {
    const cached = JSON.parse(sessionStorage.getItem(CATEGORIES_CACHE_KEY) || 'null');
    if (Array.isArray(cached) && cached.length > 0) return (categoriesPromise = Promise.resolve(cached));
  } catch { /* storage unavailable */ }
  categoriesPromise = categoriesAPI.list()
    .then((all: CategoryLite[]) => {
      const slim = all.map((c) => ({ _id: c._id, name: c.name, slug: c.slug, parentId: typeof c.parentId === 'object' ? c.parentId?._id || null : c.parentId }));
      try { sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(slim)); } catch { /* storage full or blocked */ }
      return slim;
    })
    .catch((e: unknown) => { categoriesPromise = null; throw e; });
  return categoriesPromise;
};

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

  // Vendor's active stores: if any, the customer can reserve this product and buy it at the store
  type VendorStore = { _id: string; name: string; addressLine?: string; city?: string; state?: string; phone?: string; isActive?: boolean };
  const [vendorStores, setVendorStores] = useState<VendorStore[]>([]);
  const [showStoreVisit, setShowStoreVisit] = useState(false);
  const productVendorId = product?.vendorId?._id || product?.vendorId;
  useEffect(() => {
    if (!productVendorId) {
      setVendorStores([]);
      return;
    }
    let cancelled = false;
    storesAPI.list({ vendorId: String(productVendorId), isActive: true })
      .then((list: VendorStore[]) => { if (!cancelled) setVendorStores(Array.isArray(list) ? list.filter((s) => s.isActive !== false) : []); })
      .catch(() => { if (!cancelled) setVendorStores([]); });
    return () => { cancelled = true; };
  }, [productVendorId]);

  // Names/slugs of the product's category and all its parents (used to detect contact lenses)
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  // False while the parent categories are still loading, i.e. we don't yet know if this is a contact lens
  const [categoryPathReady, setCategoryPathReady] = useState(false);
  useEffect(() => {
    const cat = product?.category;
    if (!cat || typeof cat !== 'object') {
      setCategoryPath([]);
      setCategoryPathReady(!!product);
      return;
    }
    // The product API sends the parent chain populated (category → parent → grandparent); use it when complete
    let own = [cat.name, cat.slug];
    let node = cat;
    while (node?.parentId && typeof node.parentId === 'object' && node.parentId.name) {
      node = node.parentId;
      own = [...own, node.name, node.slug];
    }
    own = own.filter(Boolean);
    setCategoryPath(own);
    if (!node?.parentId) {
      setCategoryPathReady(true);
      return;
    }
    setCategoryPathReady(false);
    let cancelled = false;
    loadCategories()
      .then((all: CategoryLite[]) => {
        const byId = new Map(all.map((c) => [String(c._id), c]));
        const path = [...own];
        let parentId = node.parentId?._id || node.parentId;
        for (let depth = 0; parentId && depth < 5; depth++) {
          const parent = byId.get(String(parentId));
          if (!parent) break;
          path.push(parent.name, parent.slug);
          parentId = typeof parent.parentId === 'object' ? parent.parentId?._id : parent.parentId;
        }
        if (!cancelled) setCategoryPath(path.filter(Boolean));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCategoryPathReady(true); });
    return () => { cancelled = true; };
  }, [product, product?.category]);

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
    // Frame Only = no lens on the cart item
    const lensInfo = activeLens?.type && !isFrameOnlyLens(activeLens.type) ? {
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

    const isAccessoryKeyword = catName.includes('accessori') || catName.includes('accessory') || catName.includes('solution')
      || catName.includes('cleaner') || catName.includes('cloth') || catName.includes('spray')
      || title.includes('lens cleaner') || title.includes('cleaning solution') || title.includes('microfiber') || title.includes('contact lens solution')
      || tags.includes('accessory') || tags.includes('solution');

    return isAccessoryKeyword && !title.includes('glass') && !title.includes('frame') && !catName.includes('eyeglass');
  };

  // Enable lens selection & power selection modal for ALL eyewear/glasses products
  const allowLensSelection = !checkIsAccessory(product);

  // Contact lenses have no frame: hide "Frame Only" and frame wording.
  // Detected from the product's category or any parent category (e.g. "Color Lenses" under "Contact Lenses").
  const isContactLens = (() => {
    if (!product) return false;
    const text = [...categoryPath, product.title || '', ...(Array.isArray(product.searchTags) ? product.searchTags : [])]
      .join(' ').toLowerCase().replace(/[-_]/g, ' ');
    return /contact\s*lens/.test(text);
  })();
  const frameWord = isContactLens ? '' : 'Frame ';

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

  // ---- Detail panel data ----
  const eyewear = product.eyewearDetails || {};
  const brandName: string = typeof product.brand === 'object' ? product.brand?.name || '' : product.brand || '';
  const frameSummary = isContactLens ? '' : [eyewear.frameType, eyewear.frameShape, eyewear.frameColor, eyewear.frameSize].filter(Boolean).join(' · ');
  const reviewCount: number = product.totalReviews || 0;
  const faceShapes: string[] = (Array.isArray(eyewear.faceShape) ? eyewear.faceShape : [eyewear.faceShape]).filter(Boolean);
  const categoryName: string = typeof product.category === 'object' ? product.category?.name || '' : '';
  const specPills = [
    eyewear.gender && { key: 'gender', icon: Users, label: String(eyewear.gender), color: 'text-[#DAAB34]' },
    eyewear.frameShape && { key: 'shape', icon: Scissors, label: String(eyewear.frameShape), color: 'text-orange-400' },
    faceShapes.length > 0 && { key: 'face', icon: Info, label: `For ${faceShapes.join(' / ')} face`, color: 'text-emerald-400' },
    categoryName && { key: 'category', icon: Layers, label: categoryName, color: 'text-violet-400' },
    eyewear.polarized && { key: 'polarized', icon: Zap, label: 'Polarized', color: 'text-yellow-400' },
    eyewear.uvProtection && { key: 'uv', icon: Shield, label: String(eyewear.uvProtection), color: 'text-green-400' },
    eyewear.prescriptionAvailable && { key: 'rx', icon: Glasses, label: 'Prescription ready', color: 'text-sky-400' },
  ].filter(Boolean) as { key: string; icon: typeof Users; label: string; color: string }[];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <main>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 pb-10 lg:pb-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 lg:mb-6 min-w-0">
            <Link to="/" className="hover:text-amber-400 transition-colors shrink-0">Home</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link to="/shop" className="hover:text-amber-400 transition-colors shrink-0">Shop</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-gray-200 font-medium truncate">{product.title}</span>
          </nav>

          {/* Main product grid — gallery | detail */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-6 lg:gap-10 items-start">

            {/* Gallery: stays in view while the detail column scrolls */}
            <div className="lg:sticky lg:top-[180px] flex flex-col-reverse lg:flex-row gap-3 min-w-0">
              {/* Thumbnails */}
              <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[520px] no-scrollbar shrink-0">
                {(displayImages || []).map((img: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImageIndex(i)}
                    className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-[#161619] border-2 transition-all ${selectedImageIndex === i ? 'border-amber-400' : 'border-white/10 hover:border-amber-400/60'}`}
                  >
                    <img src={getImageUrl(img)} alt={product.title} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>

              {/* Main image */}
              <div className="flex-1 min-w-0">
                <ProductGallery
                  images={displayImages || []}
                  productName={product.title}
                  hideThumbnails
                  currentImage={selectedImageIndex}
                  onImageChange={setSelectedImageIndex}
                />
              </div>
            </div>

            {/* Detail panel */}
            <div className="flex flex-col bg-[#111] border border-white/10 rounded-2xl p-5 lg:p-7 min-w-0 divide-y divide-white/[0.07]">

              {/* Title block */}
              <div className="pb-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {brandName && (
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#DAAB34] mb-1">{brandName}</p>
                    )}
                    <h1 className="text-xl lg:text-2xl font-bold leading-snug text-white">{product.title}</h1>
                    {frameSummary && <p className="text-sm text-slate-400 mt-1">{frameSummary}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product._id)}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={`shrink-0 h-10 w-10 rounded-full border flex items-center justify-center transition-colors ${isWishlisted ? 'border-red-500/50 bg-red-500/10 text-red-500' : 'border-white/15 text-slate-300 hover:border-white/30 hover:text-white'}`}
                  >
                    <Heart className="h-[18px] w-[18px]" fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Social proof: only when there is something to show */}
                {(reviewCount > 0 || (product.totalOrders || 0) > 0) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    {reviewCount > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#f5a623] text-[#f5a623]" />
                        <b className="text-slate-200">{(product.averageRating || 0).toFixed(1)}</b>
                        <span>({reviewCount} reviews)</span>
                      </span>
                    )}
                    {(product.totalOrders || 0) > 0 && <span>{product.totalOrders} bought</span>}
                  </div>
                )}

                {specPills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {specPills.map(({ key, icon: Icon, label, color }) => (
                      <span key={key} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                        <Icon className={`h-3 w-3 ${color}`} />
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price + offers */}
              <div className="py-5 space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-3xl font-extrabold text-[#DAAB34]">₹{displayPrice.toLocaleString()}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-base text-slate-500 line-through">₹{originalPrice.toLocaleString()}</span>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400">{discountLabel || `${discount}% OFF`}</span>
                    </>
                  )}
                </div>
                {hasDiscount && originalPrice > displayPrice && (
                  <p className="text-xs font-semibold text-emerald-400">You save ₹{(originalPrice - displayPrice).toLocaleString()}</p>
                )}

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                    <Tag className="w-3.5 h-3.5" /> Offers
                  </div>
                  <p className="flex items-start gap-2">
                    <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">COUPON</span>
                    <span>Use <strong className="font-mono text-white">LENS10</strong> for flat 10% off at checkout</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">EMI</span>
                    <span>No-cost EMI from <strong className="text-white">₹{Math.round(displayPrice / 3).toLocaleString()}/month</strong></span>
                  </p>
                </div>
              </div>

              {/* Options: colour, attributes, quantity */}
              <div className="py-5 space-y-5">
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                      {frameWord}Colour
                      {selectedColor && <span className="ml-2 normal-case tracking-normal text-slate-200">{formatColorName(selectedColor)}</span>}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((color: string) => (
                        <button
                          key={color}
                          type="button"
                          title={formatColorName(color)}
                          aria-label={formatColorName(color)}
                          onClick={() => setSelectedColor(color)}
                          className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-[#111] transition-all ${selectedColor === color ? 'ring-2 ring-[#DAAB34] scale-110' : 'ring-1 ring-white/15 hover:ring-white/40'}`}
                          style={{ background: colorSwatchBackground(color, product.colorSwatches) }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {product.attributes && product.attributes.length > 0 && product.attributes.map((attr: any) => (
                  attr.values && attr.values.length > 0 && (
                    <div key={attr.name}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">{attr.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map((val: string) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: val }))}
                            className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors ${selectedAttributes[attr.name] === val ? 'border-[#DAAB34] bg-[#DAAB34] text-black' : 'border-white/15 text-slate-200 hover:border-white/30'}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}

                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Qty</p>
                  <div className="flex items-center rounded-lg border border-white/15">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-9 w-9 flex items-center justify-center text-slate-200 hover:text-white">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm font-bold text-white">{quantity}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(displayStock, quantity + 1))} className="h-9 w-9 flex items-center justify-center text-slate-200 hover:text-white">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {displayStock > 0 && displayStock <= 5 && <span className="text-xs font-semibold text-orange-400">Only {displayStock} left</span>}
                  {displayStock <= 0 && <span className="text-xs font-semibold text-red-400">Out of stock</span>}
                </div>
              </div>

              {/* Lens / power + purchase actions */}
              <div className="pt-5 space-y-3">
                {allowLensSelection && (
                  selectedLens ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#DAAB34]/30 bg-[#DAAB34]/[0.06] p-3.5">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-[#DAAB34]">
                          <Check className="h-4 w-4 shrink-0" />
                          <span className="truncate">{selectedLens.type?.name}{selectedLens.package?.name ? ` — ${selectedLens.package.name}` : ''}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {selectedLens.prescription ? (
                            selectedLens.prescription.method === 'upload' ? 'Prescription uploaded' :
                            selectedLens.prescription.method === 'later' ? 'Power to be shared after order' :
                            'Eye power added'
                          ) : selectedLens.package?.price ? `+₹${selectedLens.package.price}` : isContactLens ? 'No power selected' : 'Frame only (no lenses)'}
                        </p>
                      </div>
                      <button type="button" onClick={() => setShowLensModal(true)} className="shrink-0 rounded-lg border border-[#DAAB34]/40 px-3 py-1.5 text-xs font-bold text-[#DAAB34] hover:bg-[#DAAB34]/10">
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowLensModal(true)}
                      className="w-full flex items-center gap-3 rounded-xl border border-[#DAAB34]/40 bg-[#DAAB34]/[0.06] p-3.5 text-left transition-colors hover:bg-[#DAAB34]/10"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DAAB34]/15">
                        {isContactLens ? <Sparkles className="h-5 w-5 text-[#DAAB34]" /> : <Glasses className="h-5 w-5 text-[#DAAB34]" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#DAAB34]">{isContactLens ? 'Add Your Power' : 'Select Lenses & Add Power'}</span>
                        <span className="block text-xs text-slate-400 mt-0.5">
                          {isContactLens ? 'Prescription or zero power, before you order' : 'With power, zero power or frame only'}
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-[#DAAB34]" />
                    </button>
                  )
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (allowLensSelection && !selectedLens) {
                        setIsBuyNowFlow(false);
                        setShowLensModal(true);
                      } else {
                        handleAddToCart();
                      }
                    }}
                    disabled={displayStock <= 0}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={displayStock <= 0}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#DAAB34] to-[#F5C542] text-sm font-extrabold text-black shadow-[0_4px_14px_rgba(218,171,52,0.3)] transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    <Zap className="h-4 w-4 fill-black" /> Buy Now
                  </button>
                </div>

                {/* Buy at store: reserve online, show the visit pass at the vendor's store */}
                {vendorStores.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowStoreVisit(true)}
                    disabled={displayStock <= 0}
                    className="w-full flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DAAB34]/40 text-sm font-bold text-[#DAAB34] transition-colors hover:bg-[#DAAB34]/10 disabled:opacity-40"
                  >
                    <Store className="h-4 w-4" />
                    Buy at Store · {vendorStores.length === 1 ? vendorStores[0].city || vendorStores[0].name : `${vendorStores.length} stores`}
                  </button>
                )}

                {/* Vendor info */}
                {vendorData && (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#1a1a1a]">
                      {vendorData.logo ? <img src={getImageUrl(vendorData.logo)} alt={vendorData.name} className="h-full w-full object-contain" /> : <Store className="h-5 w-5 text-slate-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Sold by</p>
                      <p className="text-sm font-bold text-white truncate">{vendorData.name}</p>
                      {vendorData.location && <p className="text-xs text-slate-400 truncate">{vendorData.location}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Below-fold: Specs + Reviews (grid) → Description → Related */}
        <div className="bg-background py-8 lg:py-12">
          <div className="w-full px-4 lg:px-8 xl:px-12 space-y-10 max-w-[1600px] mx-auto">
            
            {/* Included In The Box Showcase */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-wide">Included In Your Package</h3>
                  <p className="text-xs text-slate-400">Every eyewear order comes with our signature luxury care kit at no extra charge</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center text-center group hover:border-amber-400/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                    <Glasses className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{isContactLens ? 'Sealed Lens Pack' : 'Premium Frame'}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{isContactLens ? 'Sterile, factory-sealed blister packs' : 'Handcrafted with precision alignment'}</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center text-center group hover:border-amber-400/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Magnetic Hard Case</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Sleek protective leatherette case</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center text-center group hover:border-amber-400/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Microfiber Cloth</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Ultra-soft streak-free cleaning cloth</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center text-center group hover:border-amber-400/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Lens Spray Solution</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Complimentary anti-fog cleaner</p>
                </div>
              </div>
            </div>

            {/* Why Choose Lensezora Guarantee Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">German Robotic Precision</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Each lens is edged using robotic CNC machinery for 99.9% prescription accuracy.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Optometrist Inspection</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Certified eye specialists perform multi-point quality checks prior to shipping.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex items-start gap-4">
                <div className="p-3 bg-sky-500/10 text-sky-400 rounded-lg shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Zero-Risk Fitting Policy</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">If your frame fit or vision power feels uncomfortable, we exchange it free of charge.</p>
                </div>
              </div>
            </div>

            {/* Need Help CTA Banner */}
            <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-amber-400 text-black rounded-full font-bold">
                  <Headphones className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{isContactLens ? 'Confused About Your Lens Power?' : 'Confused About Eyewear Power or Frame Size?'}</h4>
                  <p className="text-xs text-slate-300 mt-1">Our certified optical advisors are available to assist you in picking the right lens & frame.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/contact"
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg"
                >
                  Chat with Optometrist
                </Link>
                <a
                  href="tel:+919876543210"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors border border-slate-700"
                >
                  Call Support
                </a>
              </div>
            </div>

            {/* Specs + Reviews — matching layout of product grid above */}
            <div className="flex flex-col items-stretch lg:grid lg:grid-cols-[1fr_400px] gap-6 lg:items-start w-full">
              <ProductSpecs specifications={specifications} warranty={productWarranty} />
              <ProductReviews productId={product._id} averageRating={product.averageRating || 0} totalReviews={product.totalReviews || 0} />
            </div>

            {/* Product Story — full width */}
            <div className="premium-card p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-4 text-white">Product Story & Craftsmanship</h3>
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm font-medium" dangerouslySetInnerHTML={{ __html: product.description || '<p>No detailed description available for this product.</p>' }} />
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
      <StoreVisitModal
        isOpen={showStoreVisit}
        onClose={() => setShowStoreVisit(false)}
        productId={product._id}
        productTitle={product.title}
        stores={vendorStores}
        variantSku={currentVariant?.sku}
        color={selectedColor || undefined}
      />
      <LensSelectionModal
        isOpen={showLensModal}
        onClose={() => {
          setShowLensModal(false);
        }}
        product={product}
        framePrice={basePrice}
        hideFrameOnly={isContactLens}
        contactLensMode={isContactLens}
        typesPending={!isContactLens && !categoryPathReady}
        onSelect={(data) => {
          setSelectedLens(data);
          handleAddToCart(data, true);
          setShowLensModal(false);
          if (isBuyNowFlow) {
            setIsBuyNowFlow(false);
            // Use setTimeout to let LensSelectionModal's window.history.go(-depth) settle
            // before navigating, otherwise history reversal cancels checkout navigation
            setTimeout(() => {
              navigate('/checkout');
            }, 150);
          }
        }}
        productTitle={product.title}
        vendorId={typeof product.vendorId === 'object' ? product.vendorId._id : product.vendorId}
      />
    </div>
  );
};

export default ProductPage;
