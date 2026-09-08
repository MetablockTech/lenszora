import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categories, API_URL } from "@/lib/api";
import { ChevronRight, Grid, Zap } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  level?: string;
  parentId?: any;
}

const GENDER_CARDS = [
  {
    id: 'men',
    label: 'MEN',
    sublabel: "Men's Eyewear",
    href: '/shop?gender=men',
    badge: null as string | null,
    bgSlugKey: 'eyeglass',
    subItems: [
      { label: 'Eyeglasses', href: '/shop?gender=men&category=eyeglasses' },
      { label: 'Sunglasses', href: '/shop?gender=men&category=sunglasses' },
      { label: 'Contact Lenses', href: '/shop?gender=men&category=contact-lenses' },
    ],
    gradient: 'from-slate-900/90 to-black/80',
    btnColor: '#DAAB34', btnText: '#000',
    btnShadow: 'rgba(218,171,52,0.35)',
  },
  {
    id: 'women',
    label: 'WOMEN',
    sublabel: "Women's Eyewear",
    href: '/shop?gender=women',
    badge: null as string | null,
    bgSlugKey: 'sunglass',
    subItems: [
      { label: 'Eyeglasses', href: '/shop?gender=women&category=eyeglasses' },
      { label: 'Sunglasses', href: '/shop?gender=women&category=sunglasses' },
      { label: 'Contact Lenses', href: '/shop?gender=women&category=contact-lenses' },
    ],
    gradient: 'from-slate-900/90 to-black/80',
    btnColor: '#DAAB34', btnText: '#000',
    btnShadow: 'rgba(218,171,52,0.35)',
  },
  {
    id: 'kids',
    label: 'KIDS',
    sublabel: "Children's Eyewear",
    href: '/shop?gender=kids',
    badge: null as string | null,
    bgSlugKey: 'contact',
    subItems: [
      { label: 'Eyeglasses', href: '/shop?gender=kids&category=eyeglasses' },
      { label: 'Sunglasses', href: '/shop?gender=kids&category=sunglasses' },
      { label: 'Contact Lenses', href: '/shop?gender=kids&category=contact-lenses' },
    ],
    gradient: 'from-slate-900/90 to-black/80',
    btnColor: '#DAAB34', btnText: '#000',
    btnShadow: 'rgba(218,171,52,0.35)',
  },
  {
    id: 'sale',
    label: 'SALE',
    sublabel: 'Hot Deals & Offers',
    href: '/shop?sale=true',
    badge: 'UP TO 50% OFF',
    bgSlugKey: 'accessor',
    subItems: [
      { label: 'Eyeglasses Sale', href: '/shop?sale=true&category=eyeglasses' },
      { label: 'Sunglasses Sale', href: '/shop?sale=true&category=sunglasses' },
      { label: 'Accessories Sale', href: '/shop?sale=true&category=accessories' },
    ],
    gradient: 'from-red-900/60 to-black/80',
    btnColor: '#ef4444', btnText: '#fff',
    btnShadow: 'rgba(239,68,68,0.4)',
  },
];

const TopCategories = () => {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categories.list();
        setAllCategories(data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const getImage = (slugKey: string): string | null => {
    const dbCat = allCategories.find(c =>
      c.slug?.toLowerCase().includes(slugKey) ||
      c.name?.toLowerCase().includes(slugKey)
    );
    if (!dbCat?.image) return null;
    return dbCat.image.startsWith('http') ? dbCat.image : `${API_URL}${dbCat.image}`;
  };

  if (loading) return null;

  return (
    <section className="py-10 lg:py-14 bg-background relative z-40 border-b border-white/5">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-playfair">
                Shop By Collection
              </h2>
              <p className="text-xs text-slate-400 font-medium">Men · Women · Kids · Sale — find your perfect eyewear</p>
            </div>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 4 Gender Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {GENDER_CARDS.map((card) => {
            const bgImage = getImage(card.bgSlugKey);
            const isSale = card.id === 'sale';

            return (
              <div
                key={card.id}
                className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col"
                style={{ minHeight: '280px' }}
              >
                {/* Background image */}
                <div className="absolute inset-0">
                  {bgImage ? (
                    <img
                      src={bgImage}
                      alt={card.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-t ${card.gradient}`} />
                </div>

                {/* Sale badge */}
                {card.badge && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                      <Zap className="w-3 h-3 fill-white" />
                      {card.badge}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-end h-full p-5 lg:p-6">
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5" style={{ color: card.btnColor }}>
                      {card.sublabel}
                    </p>
                    <h3
                      className="text-3xl lg:text-4xl font-black tracking-tight text-white font-playfair leading-none"
                      style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
                    >
                      {card.label}
                    </h3>
                  </div>

                  {/* Sub-links */}
                  <div className="flex flex-col gap-1 mb-4">
                    {card.subItems.map((sub) => (
                      <a
                        key={sub.href}
                        href={sub.href}
                        className="text-[11px] font-semibold text-white/60 hover:text-white transition-colors flex items-center gap-1.5 group/link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="w-1 h-1 rounded-full bg-white/30 group-hover/link:bg-amber-400 transition-colors shrink-0" />
                        {sub.label}
                      </a>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <a
                    href={card.href}
                    className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all duration-200 self-start hover:brightness-110"
                    style={{
                      background: card.btnColor,
                      color: card.btnText,
                      boxShadow: `0 4px 12px ${card.btnShadow}`,
                    }}
                  >
                    {isSale ? '🔥 Shop Sale' : `Shop ${card.label}`}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TopCategories;

