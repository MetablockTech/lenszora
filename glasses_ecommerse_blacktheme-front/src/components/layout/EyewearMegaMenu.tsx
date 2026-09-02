import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Sun, Eye, Glasses, Shapes, Tag, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
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
  categories: MainCategory[];
  brands: Brand[];
  navConfig?: Record<string, any>;
  onItemClick?: () => void;
}

const EyewearMegaMenu = ({ categorySlug = "", categories, brands, onItemClick }: EyewearMegaMenuProps) => {
  const normalizedSlug = categorySlug.toLowerCase();
  const isLensCategory = normalizedSlug.includes("contact") || normalizedSlug.includes("lens");
  const isSunglasses = normalizedSlug.includes("sunglasses");

  const currentCategory = categories.find(cat => cat.slug === categorySlug) || categories[0];

  // 1. LENS MEGA MENU SPECIFICATION
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

            {/* Column 3 & 4: AI Lens Advisor Promo Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-2xl border border-amber-500/30 flex flex-col justify-between relative overflow-hidden group shadow-xl">
              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Powered Guide</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Find Your Lens <span className="text-amber-400">→</span>
                </h2>
                <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                  Confused about prescription lenses? Let our AI Lens Advisor analyze your prescription and lifestyle to recommend the exact perfect lens coating & index.
                </p>
              </div>

              <div className="pt-4 relative z-10">
                <Link
                  to="/shop"
                  onClick={onItemClick}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-all"
                >
                  <span>Launch AI Lens Advisor</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Decorative Background Icon */}
              <Eye className="absolute -right-6 -bottom-6 w-36 h-36 text-amber-500/10 pointer-events-none group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 2. SUNGLASSES MEGA MENU SPECIFICATION
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: For (Gender) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">For</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {["Men", "Women", "Kids"].map((gender) => (
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

            {/* Column 2: Type */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Sun className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Type</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  { name: "Polarized", query: "polarized" },
                  { name: "UV Protection", query: "uv-protection" },
                  { name: "Sports", query: "sports" },
                  { name: "Driving", query: "driving" },
                  { name: "Fashion", query: "fashion" },
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

            {/* Column 3: Shape */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Shapes className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Shape</h3>
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

            {/* Column 4: Featured Brands */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
                <Tag className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Popular Brands</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {brands.slice(0, 6).map((brand) => (
                  <Link
                    key={brand._id}
                    to={`/shop?brand=${brand.slug || brand._id}`}
                    onClick={onItemClick}
                    className="p-2 rounded-lg bg-black/40 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/30 text-xs font-bold text-slate-300 hover:text-amber-400 transition-all text-center truncate"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 3. DYNAMIC BRANDS & GENERAL EYEGLASSES MEGA MENU
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
          {/* Shop By Gender */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Shop By Gender</h3>
            </div>
            <ul className="space-y-2 text-xs font-semibold">
              {["Men", "Women", "Kids", "Unisex"].map((g) => (
                <li key={g}>
                  <Link
                    to={`/shop?category=${currentCategory?.slug || "eyeglasses"}&gender=${g.toLowerCase()}`}
                    onClick={onItemClick}
                    className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                  >
                    {g}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop By Frame Shape */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
              <Shapes className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Shop By Shape</h3>
            </div>
            <ul className="space-y-2 text-xs font-semibold">
              {["Rectangle", "Square", "Round", "Cat-Eye", "Aviator", "Wayfarer"].map((shape) => (
                <li key={shape}>
                  <Link
                    to={`/shop?category=${currentCategory?.slug || "eyeglasses"}&frameShape=${shape.toLowerCase()}`}
                    onClick={onItemClick}
                    className="text-slate-300 hover:text-amber-400 transition-colors block py-0.5"
                  >
                    {shape}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dynamic Brands List */}
          <div className="md:col-span-2 space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-3">
              <Tag className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Featured Brands</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {brands.map((brand) => (
                <Link
                  key={brand._id}
                  to={`/shop?brand=${brand._id}`}
                  onClick={onItemClick}
                  className="p-3 rounded-xl bg-black/60 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-xs font-bold text-slate-200 hover:text-amber-400 transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{brand.name}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EyewearMegaMenu;
