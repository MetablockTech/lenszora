import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Sun, Eye, Shapes, Tag, Sparkles, ArrowRight, ShieldCheck, PackageCheck, Layers } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface SubSubCategory {
  _id: string;
  name: string;
  slug: string;
}

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  subcategories: SubSubCategory[];
}

interface MainCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  subcategories: SubCategory[];
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
}

interface EyewearMegaMenuProps {
  categorySlug?: string;
  categories?: MainCategory[];
  brands?: Brand[];
  navConfig?: Record<string, any>;
  onItemClick?: () => void;
}

const DEFAULT_FALLBACK_BRANDS: Brand[] = [
  { _id: "rayban", name: "Ray-Ban", slug: "ray-ban" },
  { _id: "oakley", name: "Oakley", slug: "oakley" },
  { _id: "gucci", name: "Gucci", slug: "gucci" },
  { _id: "prada", name: "Prada", slug: "prada" },
  { _id: "carrera", name: "Carrera", slug: "carrera" },
  { _id: "vogue", name: "Vogue Eyewear", slug: "vogue" },
];

const EyewearMegaMenu = ({ categorySlug = "", categories = [], brands = [], onItemClick }: EyewearMegaMenuProps) => {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeBrands = (Array.isArray(brands) && brands.length > 0) ? brands : DEFAULT_FALLBACK_BRANDS;

  const normalizedSlug = (categorySlug || "").toLowerCase();

  const currentCategory = safeCategories.find(cat => 
    cat && (
      cat.slug?.toLowerCase() === normalizedSlug || 
      cat.name?.toLowerCase() === normalizedSlug ||
      cat._id === categorySlug
    )
  ) || safeCategories[0];

  const currentCatSlug = (currentCategory?.slug || normalizedSlug || "").toLowerCase();
  const currentCatName = (currentCategory?.name || "").toLowerCase();

  const isBrands = normalizedSlug === "brands" || currentCatSlug === "brands" || normalizedSlug.includes("brand");
  const isLensCategory = normalizedSlug.includes("contact") || currentCatSlug.includes("contact") || currentCatName.includes("contact");
  const isSunglasses = normalizedSlug.includes("sunglass") || currentCatSlug.includes("sunglass") || currentCatName.includes("sunglass");
  const isAccessories = (normalizedSlug.includes("accessor") || currentCatSlug.includes("accessor") || currentCatName.includes("accessor")) && 
                        !normalizedSlug.includes("eyeglass") && !currentCatSlug.includes("eyeglass") && !currentCatName.includes("eyeglass");

  const eyeglassesCategory = safeCategories.find(c => 
    c && (c.name?.toLowerCase().includes("eyeglass") || c.slug?.toLowerCase().includes("eyeglass"))
  ) || currentCategory;

  const dbSubCategories = Array.isArray(eyeglassesCategory?.subcategories) ? eyeglassesCategory.subcategories : [];

  // 1. BRANDS MEGA MENU
  if (isBrands) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute left-0 right-0 top-full bg-slate-950 shadow-2xl border-t border-white/10 z-50 py-8 px-6 text-white backdrop-blur-2xl"
      >
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1 & 2: Top Brands Grid */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">All Top Brands</h3>
                </div>
                <Link to="/brands" onClick={onItemClick} className="text-[10px] text-amber-400 hover:underline font-bold">
                  View All Brands →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {safeBrands.slice(0, 9).map((brand) => (
                  <Link
                    key={brand._id || brand.slug}
                    to={`/shop?brand=${brand._id}`}
                    onClick={onItemClick}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-amber-500/15 border border-slate-800 hover:border-amber-500/40 text-xs font-extrabold text-slate-200 hover:text-amber-400 transition-all flex flex-col items-center justify-center text-center gap-1 group shadow-sm"
                  >
                    {brand.logo ? (
                      <img src={getImageUrl(brand.logo)} alt={brand.name} className="h-6 object-contain filter grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                      <span className="truncate w-full">{brand.name}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 3: Brand Collections */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Brand Collections</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "Luxury Designer Brands", query: "luxury" },
                  { name: "Premium Eyewear Brands", query: "premium" },
                  { name: "Sports & Outdoor Brands", query: "sports" },
                  { name: "Everyday Budget Value Brands", query: "budget" },
                  { name: "Official Brand Care Kits", category: "accessories" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.category ? `/shop?category=${item.category}` : `/shop?brandType=${item.query}`}
                      onClick={onItemClick}
                      className="text-slate-300 hover:text-amber-400 transition-colors block py-1 border-b border-white/5 last:border-0"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Brand Showcase Promo Card */}
            <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-6 rounded-2xl border border-amber-500/30 flex flex-col justify-between relative overflow-hidden group shadow-xl">
              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  <Tag className="w-3 h-3" />
                  <span>100% Authentic</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Official Brand <span className="text-amber-400">Store</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Browse certified original frames from Ray-Ban, Oakley, Gucci, Vogue & more with manufacturer warranty.
                </p>
              </div>

              <div className="pt-4 relative z-10">
                <Link
                  to="/brands"
                  onClick={onItemClick}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all"
                >
                  <span>Explore All Brands</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 2. ACCESSORIES MEGA MENU
  if (isAccessories) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute left-0 right-0 top-full bg-slate-950 shadow-2xl border-t border-white/10 z-50 py-8 px-6 text-white backdrop-blur-2xl"
      >
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Cleaning & Maintenance */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Cleaning & Sprays</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "Anti-Fog Cleaning Sprays", search: "anti-fog" },
                  { name: "Lens Cleaning Solutions", search: "solution" },
                  { name: "Microfiber Cleaning Cloths", search: "microfiber" },
                  { name: "Pre-Moistened Lens Wipes", search: "wipes" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={`/shop?category=accessories&search=${encodeURIComponent(item.search)}`}
                      onClick={onItemClick}
                      className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Cases & Travel Protection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Cases & Pouches</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "Hard Shell Eyewear Cases", search: "hard case" },
                  { name: "Leather Glasses Cases", search: "leather case" },
                  { name: "Soft Microfiber Travel Pouches", search: "pouch" },
                  { name: "Contact Lens Storage Cases", search: "lens case" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={`/shop?category=accessories&search=${encodeURIComponent(item.search)}`}
                      onClick={onItemClick}
                      className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Repair Kits & Straps */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <PackageCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Kits & Accessories</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "Eyewear Screw Repair Kits", search: "repair kit" },
                  { name: "Eyewear Chains & Neck Cords", search: "chain" },
                  { name: "Anti-Slip Ear Grips", search: "grip" },
                  { name: "Complete Eyewear Care Kit", search: "care kit" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={`/shop?category=accessories&search=${encodeURIComponent(item.search)}`}
                      onClick={onItemClick}
                      className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Accessories Care Kit Promo Card */}
            <div className="bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-950 p-6 rounded-2xl border border-amber-500/30 flex flex-col justify-between relative overflow-hidden group shadow-xl">
              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>Essential Protection</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Protect Your <span className="text-amber-400">Glasses</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Keep your lenses smudge-free, scratch-resistant, and clear with premium care kits and accessories.
                </p>
              </div>

              <div className="pt-4 relative z-10">
                <Link
                  to="/shop?category=accessories"
                  onClick={onItemClick}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all"
                >
                  <span>Shop All Accessories</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 3. CONTACT LENSES MEGA MENU
  if (isLensCategory) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute left-0 right-0 top-full bg-slate-950 shadow-2xl border-t border-white/10 z-50 py-8 px-6 text-white backdrop-blur-2xl"
      >
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Lens Types */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Eye className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Lens Types</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "Single Vision", query: "single-vision" },
                  { name: "Progressive", query: "progressive" },
                  { name: "Bifocal", query: "bifocal" },
                  { name: "Computer Lens", query: "computer-lens" },
                  { name: "Blue Filter", query: "blue-filter" },
                  { name: "Photochromic", query: "photochromic" },
                  { name: "High Index", query: "high-index" },
                  { name: "Polarized", query: "polarized" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={`/shop?lensType=${item.query}`}
                      onClick={onItemClick}
                      className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Shop by Need */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Shop by Need</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "Computer Use", query: "computer-use" },
                  { name: "Driving", query: "driving" },
                  { name: "Outdoor", query: "outdoor" },
                  { name: "Reading", query: "reading" },
                  { name: "Progressive", query: "progressive" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={`/shop?need=${item.query}`}
                      onClick={onItemClick}
                      className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact Lens Care Kit & Solutions */}
            <div className="space-y-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 border-b border-amber-500/30 pb-2 mb-3">
                <PackageCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Care Kit & Solutions</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "All-in-One Lens Solution", search: "solution" },
                  { name: "Lens Storage Travel Case", search: "lens case" },
                  { name: "Multi-Purpose Disinfectant", search: "disinfectant" },
                  { name: "Lens Tweezers & Inserter", search: "lens kit" },
                  { name: "Complete Contact Care Kit", search: "care kit" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={`/shop?category=accessories&search=${encodeURIComponent(item.search)}`}
                      onClick={onItemClick}
                      className="text-slate-200 hover:text-amber-400 transition-colors block py-0.5 flex items-center justify-between"
                    >
                      <span>{item.name}</span>
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono uppercase">CARE</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: AI Lens Advisor Promo Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-2xl border border-amber-500/30 flex flex-col justify-between relative overflow-hidden group shadow-xl">
              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Powered Guide</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Find Your Lens <span className="text-amber-400">→</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Confused about prescription lenses? Let our AI Lens Advisor analyze your prescription and recommend the perfect match.
                </p>
              </div>

              <div className="pt-4 relative z-10">
                <Link
                  to="/shop"
                  onClick={onItemClick}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all"
                >
                  <span>Launch AI Lens Advisor</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <Eye className="absolute -right-6 -bottom-6 w-36 h-36 text-amber-500/10 pointer-events-none group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 4. SUNGLASSES MEGA MENU
  if (isSunglasses) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute left-0 right-0 top-full bg-slate-950 shadow-2xl border-t border-white/10 z-50 py-8 px-6 text-white backdrop-blur-2xl"
      >
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Column 1: For (Gender) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Gender</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {["Men", "Women", "Kids", "Unisex"].map((gender) => (
                  <li key={gender}>
                    <Link
                      to={`/shop?category=sunglasses&gender=${gender.toLowerCase()}`}
                      onClick={onItemClick}
                      className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                    >
                      {gender}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Shape */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Shapes className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Frame Shape</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "Aviator", query: "aviator" },
                  { name: "Wayfarer", query: "wayfarer" },
                  { name: "Round", query: "round" },
                  { name: "Square", query: "square" },
                  { name: "Cat Eye", query: "cat-eye" },
                ].map((shape) => (
                  <li key={shape.name}>
                    <Link
                      to={`/shop?category=sunglasses&frameShape=${shape.query}`}
                      onClick={onItemClick}
                      className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                    >
                      {shape.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Top Brands */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Tag className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Top Brands</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {safeBrands.slice(0, 6).map((brand) => (
                  <li key={brand._id || brand.slug}>
                    <Link
                      to={`/shop?category=sunglasses&brand=${brand._id}`}
                      onClick={onItemClick}
                      className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5 flex items-center justify-between"
                    >
                      <span>{brand.name}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/brands"
                    onClick={onItemClick}
                    className="text-amber-400 hover:underline text-[11px] font-bold block pt-1"
                  >
                    View All Brands →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Type & Protection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Sun className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Type & Feature</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "Polarized Lenses", query: "polarized" },
                  { name: "100% UV Protection", query: "uv-protection" },
                  { name: "Sports & Outdoor", query: "sports" },
                  { name: "Driving Sunglasses", query: "driving" },
                  { name: "Fashion & Luxury", query: "fashion" },
                ].map((typeItem) => (
                  <li key={typeItem.name}>
                    <Link
                      to={`/shop?category=sunglasses&type=${typeItem.query}`}
                      onClick={onItemClick}
                      className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                    >
                      {typeItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 5: Sunglasses Care Kit & Accessories */}
            <div className="space-y-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 border-b border-amber-500/30 pb-2 mb-3">
                <PackageCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Care Kits</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "Anti-Glare Cleaner Spray", search: "lens cleaner" },
                  { name: "Microfiber Cleaning Cloth", search: "microfiber" },
                  { name: "Hard Leather Case", search: "leather case" },
                  { name: "UV Travel Pouch & Chain", search: "pouch" },
                  { name: "Sunglasses Care Kit", search: "care kit" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={`/shop?category=accessories&search=${encodeURIComponent(item.search)}`}
                      onClick={onItemClick}
                      className="text-slate-200 hover:text-amber-400 transition-colors block py-0.5 flex items-center justify-between"
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono uppercase">CARE</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 5. EYEGLASSES / DEFAULT MEGA MENU
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 right-0 top-full bg-slate-950 shadow-2xl border-t border-white/10 z-50 py-8 px-6 text-white backdrop-blur-2xl"
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Shop By Gender */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Gender</h3>
            </div>
            <ul className="space-y-2 text-xs font-semibold">
              {["Men", "Women", "Kids", "Unisex"].map((g) => (
                <li key={g}>
                  <Link
                    to={`/shop?category=${eyeglassesCategory?.slug || "eyeglasses"}&gender=${g.toLowerCase()}`}
                    onClick={onItemClick}
                    className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                  >
                    {g} Eyeglasses
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Shop By Frame Shape */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
              <Shapes className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Frame Shape</h3>
            </div>
            <ul className="space-y-2 text-xs font-semibold">
              {["Rectangle", "Square", "Round", "Cat-Eye", "Aviator", "Wayfarer"].map((shape) => (
                <li key={shape}>
                  <Link
                    to={`/shop?category=${eyeglassesCategory?.slug || "eyeglasses"}&frameShape=${shape.toLowerCase()}`}
                    onClick={onItemClick}
                    className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                  >
                    {shape}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Frame Types & Lens Categories */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Types & Lenses</h3>
            </div>
            <ul className="space-y-2 text-xs font-semibold">
              {[
                { name: "Full Rim Frames", query: "full-rim" },
                { name: "Half Rim / Supra", query: "half-rim" },
                { name: "Rimless Minimalist", query: "rimless" },
                { name: "Computer & Blue Light", query: "blue-filter" },
                { name: "Reading Glasses", query: "reading" },
                { name: "Progressive & Bifocal Lenses", query: "progressive" },
                { name: "Zero Power Frames", query: "zero-power" },
              ].map((rim) => (
                <li key={rim.name}>
                  <Link
                    to={`/shop?category=${eyeglassesCategory?.slug || "eyeglasses"}&frameType=${rim.query}`}
                    onClick={onItemClick}
                    className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                  >
                    {rim.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Top Eyeglasses Brands */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
              <Tag className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Eyewear Brands</h3>
            </div>
            <ul className="space-y-2 text-xs font-semibold">
              {safeBrands.slice(0, 6).map((brand) => (
                <li key={brand._id || brand.slug}>
                  <Link
                    to={`/shop?category=eyeglasses&brand=${brand._id}`}
                    onClick={onItemClick}
                    className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                  >
                    {brand.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/brands"
                  onClick={onItemClick}
                  className="text-amber-400 hover:underline text-[11px] font-bold block pt-1"
                >
                  View All Brands →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EyewearMegaMenu;
