import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Filter, SlidersHorizontal, ChevronRight, Star, Tag, Zap, ShieldCheck } from 'lucide-react'
import { useSearchParams, useNavigate } from "react-router-dom";
import { products, categories, brands, eyewearAttributes as eyewearAttributesAPI, stores } from "@/lib/api";
import { useWishlist } from "@/context/WishlistContext";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn, getImageUrl } from "@/lib/utils";

interface Product {
  _id: string;
  title: string;
  price: number;
  salePrice?: number;
  description: string;
  images: string[];
  category: any;
  brand: any;
  stock: number;
  averageRating?: number;
  totalReviews?: number;
  eyewearDetails?: {
    frameMaterial?: string;
    frameType?: string;
    frameShape?: string;
    frameColor?: string;
    glassColor?: string;
    polarized?: boolean;
    gender?: string;
    frameSize?: string;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId?: any;
  level?: string;
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

const Shop = () => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [productList, setProductList] = useState<Product[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [brandList, setBrandList] = useState<Brand[]>([]);
  const [eyewearAttributesList, setEyewearAttributesList] = useState<any[]>([]);

  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedFrameType, setSelectedFrameType] = useState("");
  const [selectedFrameShape, setSelectedFrameShape] = useState("");
  const [selectedFrameMaterial, setSelectedFrameMaterial] = useState("");
  const [selectedWeightGroup, setSelectedWeightGroup] = useState("");
  const [selectedFaceShape, setSelectedFaceShape] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [activeStore, setActiveStore] = useState<any>(null);
  const [priceRange, setPriceRange] = useState<number[]>([0, 100000]);
  const [sortBy, setSortBy] = useState("newest");

  async function fetchFilteredProducts() {
    try {
      setLoading(true);

      // Determine category to filter by
      let categoryToFilter = selectedSubSubCategory || selectedSubCategory || selectedMainCategory || undefined;

      const productsData = await products.list({
        category: categoryToFilter,
        brand: selectedBrand || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
        gender: selectedGender || undefined,
        frameType: selectedFrameType || undefined,
        frameShape: selectedFrameShape || undefined,
        frameMaterial: selectedFrameMaterial || undefined,
        weightGroup: selectedWeightGroup || undefined,
        faceShape: selectedFaceShape || undefined,
        vendorId: selectedVendor || undefined,
        search: searchQuery || undefined,
        sort: sortBy === 'price-asc' ? 'price:asc' : sortBy === 'price-desc' ? 'price:desc' : 'createdAt:desc'
      });

      setProductList(productsData);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInitialData() {
    try {
      const [categoriesData, brandsData, attributesData] = await Promise.all([
        categories.list(),
        brands.list(),
        eyewearAttributesAPI.list()
      ]);

      setCategoryList(categoriesData);
      setBrandList(brandsData);
      setEyewearAttributesList(attributesData);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  }

  useEffect(() => {
    async function fetchStoreInfo() {
      if (selectedVendor) {
        try {
          const storeData = await stores.list({ vendorId: selectedVendor });
          if (storeData && storeData.length > 0) {
            setActiveStore(storeData[0]);
          }
        } catch (error) {
          console.error("Failed to fetch store info:", error);
        }
      } else {
        setActiveStore(null);
      }
    }
    fetchStoreInfo();
  }, [selectedVendor]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch products whenever filters change
  useEffect(() => {
    if (categoryList.length > 0) {
      fetchFilteredProducts();
    }
  }, [
    categoryList,
    selectedMainCategory,
    selectedSubCategory,
    selectedSubSubCategory,
    selectedBrand,
    selectedGender,
    selectedFrameType,
    selectedFrameShape,
    selectedFrameMaterial,
    selectedWeightGroup,
    selectedFaceShape,
    priceRange,
    sortBy,
    searchQuery,
    selectedVendor
  ]);

  // Apply URL query parameters after initial data loads
  useEffect(() => {
    if (categoryList.length > 0 && brandList.length > 0) {
      const brandParam = searchParams.get('brand');
      const categoryParam = searchParams.get('category');
      const subcategoryParam = searchParams.get('subcategory');
      const typeParam = searchParams.get('type');
      const genderParam = searchParams.get('gender');
      const frameTypeParam = searchParams.get('frameType');
      const frameShapeParam = searchParams.get('frameShape');
      const frameMaterialParam = searchParams.get('frameMaterial');
      const weightGroupParam = searchParams.get('weightGroup');
      const faceShapeParam = searchParams.get('faceShape');
      const sortParam = searchParams.get('sortBy');
      const searchParam = searchParams.get('search');
      const vendorParam = searchParams.get('vendorId');

      if (brandParam) {
        const brand = brandList.find(b => b.slug === brandParam || b._id === brandParam);
        if (brand) setSelectedBrand(brand._id);
      }

      if (categoryParam) {
        const cat = categoryList.find(c => c.slug === categoryParam || c._id === categoryParam);
        if (cat) setSelectedMainCategory(cat._id);
      }

      if (subcategoryParam) {
        const cat = categoryList.find(c => c.slug === subcategoryParam || c._id === subcategoryParam);
        if (cat) setSelectedSubCategory(cat._id);
      }

      if (typeParam) {
        const cat = categoryList.find(c => c.slug === typeParam || c._id === typeParam);
        if (cat) setSelectedSubSubCategory(cat._id);
      }

      if (genderParam) {
        // Capitalize first letter to match filter options (e.g., "men" -> "Men")
        const capitalizedGender = genderParam.charAt(0).toUpperCase() + genderParam.slice(1).toLowerCase();
        setSelectedGender(capitalizedGender);
      }
      if (frameTypeParam) {
        // Capitalize each word (e.g., "full rim" -> "Full Rim")
        const capitalizedFrameType = frameTypeParam.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        setSelectedFrameType(capitalizedFrameType);
      }
      if (frameShapeParam) {
        // Capitalize first letter (e.g., "rectangle" -> "Rectangle")
        const capitalizedFrameShape = frameShapeParam.charAt(0).toUpperCase() + frameShapeParam.slice(1).toLowerCase();
        setSelectedFrameShape(capitalizedFrameShape);
      }
      if (frameMaterialParam) {
        // Capitalize each word (e.g., "stainless steel" -> "Stainless Steel")
        const capitalizedFrameMaterial = frameMaterialParam.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        setSelectedFrameMaterial(capitalizedFrameMaterial);
      }
      if (weightGroupParam) {
        // Capitalize each word (e.g., "feather light" -> "Feather Light")
        const capitalizedWeightGroup = weightGroupParam.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        setSelectedWeightGroup(capitalizedWeightGroup);
      }
      if (faceShapeParam) {
        // Capitalize first letter (e.g., "oval" -> "Oval")
        const capitalizedFaceShape = faceShapeParam.charAt(0).toUpperCase() + faceShapeParam.slice(1).toLowerCase();
        setSelectedFaceShape(capitalizedFaceShape);
      }
      if (sortParam) setSortBy(sortParam);
      if (searchParam) setSearchQuery(searchParam);
      if (vendorParam) setSelectedVendor(vendorParam);
    }
  }, [categoryList, brandList, searchParams]);

  // Helper functions to get dynamic attribute options
  const getAttributesByType = (type: string) => {
    return eyewearAttributesList.filter(attr => attr.type === type);
  };

  const genderOptions = ['Men', 'Women', 'Unisex', 'Kids'];

  // Custom Frame Type options with predefined icons if not in DB
  const frameTypeOptions = getAttributesByType('frameType').length > 0
    ? getAttributesByType('frameType')
    : [
      { name: 'Full Rim', image: '' },
      { name: 'Half Rim', image: '' },
      { name: 'Rimless', image: '' },
      { name: 'Supra', image: '' }
    ];

  const frameShapeOptions = getAttributesByType('frameShape').length > 0
    ? getAttributesByType('frameShape')
    : [
      { name: 'Geometric', image: '' },
      { name: 'Round', image: '' },
      { name: 'Square', image: '' },
      { name: 'Aviator', image: '' },
      { name: 'Cat-Eye', image: '' },
      { name: 'Wayfarer', image: '' },
      { name: 'Rectangle', image: '' },
      { name: 'Oval', image: '' }
    ];

  const frameMaterialOptions = getAttributesByType('frameMaterial').length > 0
    ? getAttributesByType('frameMaterial').map(a => a.name)
    : ['Stainless Steel', 'Plastic', 'Metal', 'Titanium', 'Acetate', 'TR90'];

  const weightGroupOptions = ['Feather Light', 'Light', 'Average', 'Heavy'];

  const faceShapeOptions = getAttributesByType('faceShape').length > 0
    ? getAttributesByType('faceShape')
    : [
      { name: 'Oval', image: '' },
      { name: 'Square', image: '' },
      { name: 'Round', image: '' },
      { name: 'Heart', image: '' },
      { name: 'Diamond', image: '' },
      { name: 'Oblong', image: '' }
    ];

  // Function to update URL parameters when filters change
  const updateURLParams = () => {
    const params = new URLSearchParams();

    // Add category params
    if (selectedMainCategory) {
      const cat = categoryList.find(c => c._id === selectedMainCategory);
      if (cat) params.set('category', cat.slug);
    }
    if (selectedSubCategory) {
      const cat = categoryList.find(c => c._id === selectedSubCategory);
      if (cat) params.set('subcategory', cat.slug);
    }
    if (selectedSubSubCategory) {
      const cat = categoryList.find(c => c._id === selectedSubSubCategory);
      if (cat) params.set('type', cat.slug);
    }

    // Add brand param
    if (selectedBrand) {
      const brand = brandList.find(b => b._id === selectedBrand);
      if (brand) params.set('brand', brand.slug);
    }

    // Add eyewear attribute params (lowercase for URL)
    if (selectedGender) params.set('gender', selectedGender.toLowerCase());
    if (selectedFrameType) params.set('frameType', selectedFrameType.toLowerCase().replace(/ /g, '-'));
    if (selectedFrameShape) params.set('frameShape', selectedFrameShape.toLowerCase());
    if (selectedFrameMaterial) params.set('frameMaterial', selectedFrameMaterial.toLowerCase().replace(/ /g, '-'));
    if (selectedWeightGroup) params.set('weightGroup', selectedWeightGroup.toLowerCase().replace(/ /g, '-'));
    if (selectedFaceShape) params.set('faceShape', selectedFaceShape.toLowerCase());

    // Add sort param
    if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);

    // Add search param
    if (searchQuery) params.set('search', searchQuery);

    // Add vendor param
    if (selectedVendor) params.set('vendorId', selectedVendor);

    // Update URL without page reload
    const newUrl = params.toString() ? `/shop?${params.toString()}` : '/shop';
    navigate(newUrl, { replace: true });
  };

  // Update URL whenever filters change
  useEffect(() => {
    if (categoryList.length > 0 && brandList.length > 0) {
      updateURLParams();
    }
  }, [selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedBrand, selectedGender, selectedFrameType, selectedFrameShape, selectedFrameMaterial, selectedWeightGroup, selectedFaceShape, sortBy, searchQuery, selectedVendor]);

  const mainCategories = categoryList.filter((c) => !c.parentId);
  const subCategories = categoryList.filter(
    (c) =>
      c.parentId === selectedMainCategory ||
      (typeof c.parentId === "object" && c.parentId?._id === selectedMainCategory)
  );
  const subSubCategories = categoryList.filter(
    (c) =>
      c.parentId === selectedSubCategory ||
      (typeof c.parentId === "object" && c.parentId?._id === selectedSubCategory)
  );

  // Reusable Filter Content Component
  const FilterSidebarContent = () => (
    <div className="space-y-4">
      {/* Frame Type Filter (Visual Grid) */}
      <div className="border border-primary/10 rounded overflow-hidden">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] bg-secondary/30 p-2 border-b border-primary/10">Frame Type</h3>
        <div className="p-2 grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setSelectedFrameType("")}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded border transition-all h-16 text-center",
              selectedFrameType === ""
                ? "border-[#DAAB34] bg-[#DAAB34]/10 text-white"
                : "border-primary/10 bg-transparent text-muted-foreground hover:border-[#DAAB34]/50"
            )}
          >
            <span className="text-[9px] font-bold uppercase">All Types</span>
          </button>
          {frameTypeOptions.map((opt: any) => (
            <button
              key={opt.name}
              onClick={() => setSelectedFrameType(opt.name)}
              className={cn(
                "flex flex-col items-center justify-center p-1 rounded border transition-all h-16 text-center gap-0.5 group relative overflow-hidden",
                selectedFrameType === opt.name
                  ? "border-[#DAAB34] bg-[#DAAB34]/5 text-[#DAAB34] shadow-sm font-black"
                  : "border-primary/5 bg-transparent text-muted-foreground hover:border-[#DAAB34]/30"
              )}
            >
              {opt.image ? (
                <img src={getImageUrl(opt.image)} alt={opt.name} className="h-6 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-8 h-5 bg-slate-800/50 rounded flex items-center justify-center overflow-hidden">
                  <span className="text-[7px] text-slate-500 font-mono">ICON</span>
                </div>
              )}
              <span className="text-[8px] font-bold uppercase tracking-tighter truncate w-full">{opt.name}</span>
              {selectedFrameType === opt.name && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#DAAB34] rounded-full shadow-[0_0_8px_rgba(218,171,52,0.5)]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Shape Filter (Visual Grid) */}
      <div className="border border-primary/10 rounded overflow-hidden">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] bg-secondary/30 p-2 border-b border-primary/10">Frame Shape</h3>
        <div className="p-2 grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setSelectedFrameShape("")}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded border transition-all h-16 text-center",
              selectedFrameShape === ""
                ? "border-[#DAAB34] bg-[#DAAB34]/10 text-white"
                : "border-primary/10 bg-transparent text-muted-foreground hover:border-[#DAAB34]/50"
            )}
          >
            <span className="text-[9px] font-bold uppercase">All Shapes</span>
          </button>
          {frameShapeOptions.map((opt: any) => (
            <button
              key={opt.name}
              onClick={() => setSelectedFrameShape(opt.name)}
              className={cn(
                "flex flex-col items-center justify-center p-1 rounded border transition-all h-16 text-center gap-0.5 group relative overflow-hidden",
                selectedFrameShape === opt.name
                  ? "border-[#DAAB34] bg-[#DAAB34]/5 text-[#DAAB34] shadow-sm font-black"
                  : "border-primary/5 bg-transparent text-muted-foreground hover:border-[#DAAB34]/30"
              )}
            >
              {opt.image ? (
                <img src={getImageUrl(opt.image)} alt={opt.name} className="h-6 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-8 h-5 bg-slate-800/50 rounded flex items-center justify-center overflow-hidden">
                  <span className="text-[7px] text-slate-500 font-mono">ICON</span>
                </div>
              )}
              <span className="text-[8px] font-bold uppercase tracking-tighter truncate w-full">{opt.name}</span>
              {selectedFrameShape === opt.name && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#DAAB34] rounded-full shadow-[0_0_8px_rgba(218,171,52,0.5)]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Face Shape Filter (Visual Grid) */}
      <div className="border border-primary/10 rounded overflow-hidden">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] bg-secondary/30 p-2 border-b border-primary/10">Face Shape</h3>
        <div className="p-2 grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setSelectedFaceShape("")}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded border transition-all h-16 text-center",
              selectedFaceShape === ""
                ? "border-[#DAAB34] bg-[#DAAB34]/10 text-white"
                : "border-primary/10 bg-transparent text-muted-foreground hover:border-[#DAAB34]/50"
            )}
          >
            <span className="text-[9px] font-bold uppercase">All Shapes</span>
          </button>
          {faceShapeOptions.map((opt: any) => (
            <button
              key={opt.name}
              onClick={() => setSelectedFaceShape(opt.name)}
              className={cn(
                "flex flex-col items-center justify-center p-1 rounded border transition-all h-16 text-center gap-0.5 group relative overflow-hidden",
                selectedFaceShape === opt.name
                  ? "border-[#DAAB34] bg-[#DAAB34]/5 text-[#DAAB34] shadow-sm font-black"
                  : "border-primary/5 bg-transparent text-muted-foreground hover:border-[#DAAB34]/30"
              )}
            >
              {opt.image ? (
                <img src={getImageUrl(opt.image)} alt={opt.name} className="h-6 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-8 h-5 bg-slate-800/50 rounded flex items-center justify-center overflow-hidden">
                  <span className="text-[7px] text-slate-500 font-mono">ICON</span>
                </div>
              )}
              <span className="text-[8px] font-bold uppercase tracking-tighter truncate w-full">{opt.name}</span>
              {selectedFaceShape === opt.name && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#DAAB34] rounded-full shadow-[0_0_8px_rgba(218,171,52,0.5)]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div className="border border-primary/20 rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Brands</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="brand"
              value=""
              checked={selectedBrand === ""}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-sm text-muted-foreground hover:text-foreground">
              All Brands
            </span>
          </label>
          {brandList.map((brand) => (
            <label key={brand._id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="brand"
                value={brand._id}
                checked={selectedBrand === brand._id}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-muted-foreground hover:text-foreground">
                {brand.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Gender Filter */}
      <div className="border border-primary/20 rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Gender</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value=""
              checked={selectedGender === ""}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-sm text-muted-foreground hover:text-foreground">
              All
            </span>
          </label>
          {genderOptions.map((gender) => (
            <label key={gender} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value={gender}
                checked={selectedGender === gender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-muted-foreground hover:text-foreground">
                {gender}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Frame Material Filter */}
      <div className="border border-primary/20 rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Frame Material</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="frameMaterial"
              value=""
              checked={selectedFrameMaterial === ""}
              onChange={(e) => setSelectedFrameMaterial(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-sm text-muted-foreground hover:text-foreground">
              All
            </span>
          </label>
          {frameMaterialOptions.map((material) => (
            <label key={material} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="frameMaterial"
                value={material}
                checked={selectedFrameMaterial === material}
                onChange={(e) => setSelectedFrameMaterial(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-muted-foreground hover:text-foreground">
                {material}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Weight Group Filter */}
      <div className="border border-primary/20 rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Weight</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="weightGroup"
              value=""
              checked={selectedWeightGroup === ""}
              onChange={(e) => setSelectedWeightGroup(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-sm text-muted-foreground hover:text-foreground">
              All
            </span>
          </label>
          {weightGroupOptions.map((weight) => (
            <label key={weight} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="weightGroup"
                value={weight}
                checked={selectedWeightGroup === weight}
                onChange={(e) => setSelectedWeightGroup(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-muted-foreground hover:text-foreground">
                {weight}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div className="border border-primary/10 rounded overflow-hidden">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[1px] bg-secondary/30 p-2 border-b border-primary/10">Price Range</h3>
        <div className="p-4 space-y-3">
          <input
            type="range"
            min="0"
            max="15000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full accent-primary h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-[11px] font-bold text-white flex justify-between">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="border border-primary/10 rounded overflow-hidden">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[1px] bg-secondary/30 p-2 border-b border-primary/10">Sort By</h3>
        <div className="p-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-900/50 border border-primary/5 rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary/40"
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-4">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-xl font-playfair font-bold text-foreground mb-1 uppercase tracking-tight">
              Shop Collection
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-70">
              Premium eyewear from top brands
            </p>
          </motion.div>

          {activeStore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-gradient-to-r from-[#DAAB34]/20 via-[#DAAB34]/5 to-transparent border border-[#DAAB34]/30 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#DAAB34] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(218,171,52,0.3)]">
                  <ShoppingBag className="text-black w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-playfair">Exclusive Collection: {activeStore.name}</h2>
                  <p className="text-[10px] text-[#DAAB34] font-bold uppercase tracking-[2px] mt-0.5">Official Lenzora Partner Store</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendor("")}
                className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:text-[#DAAB34]"
              >
                Clear Store Filter
              </button>
            </motion.div>
          )}

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
            {/* Mobile Filter Button */}
            <div className="lg:hidden flex items-center justify-between mb-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-primary/20 bg-secondary/20 hover:bg-secondary/40 text-xs font-bold uppercase tracking-wider h-10 px-4">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#DAAB34]" />
                    Filters & Sort
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-slate-950 border-r border-white/5 p-0 overflow-y-auto custom-scrollbar">
                  <SheetHeader className="p-6 border-b border-white/5">
                    <SheetTitle className="text-sm font-bold uppercase tracking-[3px] text-white flex items-center gap-2">
                      <Filter className="h-4 w-4 text-[#DAAB34]" />
                      Refine Search
                    </SheetTitle>
                    <SheetDescription className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Filter by type, shape, color & more
                    </SheetDescription>
                  </SheetHeader>
                  <div className="p-4 pt-0">
                    <FilterSidebarContent />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {productList.length} Styles
              </div>
            </div>

            {/* Desktop Sidebar Filters */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden lg:block lg:col-span-3"
            >
              <FilterSidebarContent />
            </motion.div>

            {/* Products Grid */}
            <div className="lg:col-span-9">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-96 bg-slate-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : productList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No products found</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-3">
                    <div>
                      Showing {productList.length} products
                      {searchQuery && (
                        <span> for &quot;<strong className="text-white">{searchQuery}</strong>&quot;</span>
                      )}
                    </div>
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          // Also clear from searchParams in URL
                          const params = new URLSearchParams(window.location.search);
                          params.delete("search");
                          navigate(params.toString() ? `/shop?${params.toString()}` : "/shop", { replace: true });
                        }}
                        className="text-[10px] bg-[#DAAB34]/10 text-[#DAAB34] hover:bg-[#DAAB34]/20 border border-[#DAAB34]/20 rounded-full px-3 py-1 font-bold uppercase transition-all"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                    {productList.map((product, index) => (
                      <Link key={product._id} to={`/product/${product._id}`}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="group/card bg-white/5 rounded px-2 py-3 border border-primary/5 hover:border-[#DAAB34]/40 transition-all duration-300 h-full flex flex-col cursor-pointer relative"
                        >
                          {/* Product Image Area */}
                          <div className="relative aspect-[16/10] overflow-hidden bg-transparent mb-3 px-4">
                            {/* Wishlist Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleWishlist(product._id);
                              }}
                              className="absolute top-0 right-0 z-20 w-8 h-8 flex items-center justify-center transition-all duration-300"
                            >
                              <Heart className={cn("h-4 w-4", isInWishlist(product._id) ? "fill-[#DAAB34] text-[#DAAB34]" : "text-slate-400 hover:text-[#DAAB34]")} />
                            </button>

                            <img
                              src={getImageUrl(product.images[0])}
                              alt={product.title}
                              className="w-full h-full object-contain group-hover/card:scale-105 transition-transform duration-700"
                            />

                            {/* Rating Badge (Real Data or NEW) */}
                            <div className="absolute bottom-0 left-0 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                              {product.averageRating && product.averageRating > 0 ? (
                                <>
                                  <span className="text-[10px] font-bold text-slate-900">{product.averageRating.toFixed(1)}</span>
                                  <Star className="w-2.5 h-2.5 fill-[#DAAB34] text-[#DAAB34]" />
                                  <div className="w-[1px] h-2.5 bg-slate-300 mx-0.5"></div>
                                  <span className="text-[9px] text-slate-500 font-medium">{product.totalReviews}</span>
                                </>
                              ) : (
                                <span className="text-[9px] font-black text-[#DAAB34] px-1 uppercase tracking-tighter">NEW</span>
                              )}
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="px-1 flex-grow flex flex-col">
                            <h3 className="text-sm font-bold text-slate-100 mb-0.5 line-clamp-1 group-hover/card:text-[#DAAB34] transition-colors leading-tight">
                              {product.title}
                            </h3>

                            {/* Metadata Subtitle */}
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                                Size: {product.eyewearDetails?.frameSize || 'Medium'}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                                {typeof product.brand === 'string' ? product.brand : product.brand.name}
                              </span>
                            </div>

                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {product.salePrice && product.salePrice < product.price ? (
                                  <>
                                    <span className="text-sm font-black text-slate-100">
                                      ₹{product.salePrice.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-slate-500 line-through">
                                      ₹{product.price.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-black text-[#26a69a]">
                                      ({Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF)
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-black text-slate-100">
                                    ₹{product.price.toLocaleString()}
                                  </span>
                                )}
                              </div>

                              {/* Small Color Circles (Visual Decor) */}
                              <div className="flex -space-x-1">
                                <div className="w-2 h-2 rounded-full bg-slate-700 border border-slate-900 shadow-sm"></div>
                                <div className="w-2 h-2 rounded-full bg-slate-500 border border-slate-900 shadow-sm"></div>
                                <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-900 shadow-sm flex items-center justify-center overflow-hidden">
                                  <span className="text-[5px] font-bold">+2</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
