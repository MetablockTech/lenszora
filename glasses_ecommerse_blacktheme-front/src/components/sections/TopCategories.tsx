import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { categories as categoriesAPI, settings, API_URL } from "@/lib/api";

interface NavItem {
  id: string;
  label: string;
  badge?: string | null;
  href: string;
  image: string;
  dbSlugKey?: string;
}

interface NavGroup {
  id: string;
  title: string;
  viewAllHref: string;
  pillBadge?: string | null;
  items: NavItem[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    id: "eyeglasses",
    title: "Eyeglasses",
    viewAllHref: "/shop?category=eyeglasses",
    pillBadge: "with Power",
    items: [
      {
        id: "eyeglasses-men",
        label: "Men",
        href: "/shop?category=eyeglasses&gender=men",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "eyeglass-men"
      },
      {
        id: "eyeglasses-women",
        label: "Women",
        href: "/shop?category=eyeglasses&gender=women",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "eyeglass-women"
      },
      {
        id: "eyeglasses-kids",
        label: "Kids",
        href: "/shop?category=eyeglasses&gender=kids",
        image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "eyeglass-kids"
      },
      {
        id: "eyeglasses-sale",
        label: "On Sale",
        badge: "Starts @₹500",
        href: "/shop?category=eyeglasses&sale=true",
        image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "eyeglass-sale"
      }
    ]
  },
  {
    id: "sunglasses",
    title: "Sunglasses",
    viewAllHref: "/shop?category=sunglasses",
    pillBadge: null,
    items: [
      {
        id: "sunglasses-men",
        label: "Men",
        href: "/shop?category=sunglasses&gender=men",
        image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "sunglass-men"
      },
      {
        id: "sunglasses-women",
        label: "Women",
        href: "/shop?category=sunglasses&gender=women",
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "sunglass-women"
      },
      {
        id: "sunglasses-kids",
        label: "Kids",
        href: "/shop?category=sunglasses&gender=kids",
        image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "sunglass-kids"
      },
      {
        id: "sunglasses-sale",
        label: "On Sale",
        badge: "Starts @₹500",
        href: "/shop?category=sunglasses&sale=true",
        image: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "sunglass-sale"
      }
    ]
  },
  {
    id: "contact-lenses-accessories",
    title: "Contact Lenses & Accessories",
    viewAllHref: "/shop?category=contact-lenses",
    pillBadge: null,
    items: [
      {
        id: "contact-lenses-clear",
        label: "Contact Lenses",
        href: "/shop?category=contact-lenses",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "contact-lens"
      },
      {
        id: "contact-lenses-color",
        label: "Color Lenses",
        href: "/shop?category=contact-lenses&type=color",
        image: "https://images.unsplash.com/photo-1583001809873-a128495da465?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "color-contact"
      },
      {
        id: "lens-solution",
        label: "Solutions",
        href: "/shop?category=accessories&search=solution",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "solution"
      },
      {
        id: "accessories-kit",
        label: "Accessories",
        badge: "Try @ 99",
        href: "/shop?category=accessories",
        image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&auto=format&fit=crop&q=80",
        dbSlugKey: "accessory"
      }
    ]
  }
];

const TopCategories = () => {
  const [navGroups, setNavGroups] = useState<NavGroup[]>(NAVIGATION_GROUPS);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchNavAndCats = async () => {
      try {
        const [catsData, navSettings] = await Promise.all([
          categoriesAPI.list().catch(() => []),
          settings.get("homepage_categories_nav").catch(() => null),
        ]);
        if (catsData) setDbCategories(catsData);
        if (navSettings && navSettings.value && Array.isArray(navSettings.value) && navSettings.value.length > 0) {
          setNavGroups(navSettings.value);
        }
      } catch (err) {
        console.error("Failed to fetch categories / nav settings:", err);
      }
    };
    fetchNavAndCats();
  }, []);

  const getDbImage = (dbSlugKey?: string): string | null => {
    if (!dbSlugKey || dbCategories.length === 0) return null;
    const cat = dbCategories.find(c =>
      c.slug?.toLowerCase().includes(dbSlugKey) ||
      c.name?.toLowerCase().includes(dbSlugKey)
    );
    if (!cat?.image) return null;
    return cat.image.startsWith("http") ? cat.image : `${API_URL}${cat.image}`;
  };

  return (
    <section className="w-full py-8 sm:py-12 lg:py-16 bg-background relative z-20 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Full-width Responsive Container - NO ENCLOSING BOX */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 relative z-10">
        <div className="space-y-10 sm:space-y-14 lg:space-y-16">
          {navGroups.map((group) => (
            <div key={group.id} className="space-y-4 sm:space-y-6">
              {/* Group Header - Clean, Open, Full Width without boxed borders */}
              <div className="flex items-center justify-between pb-1 sm:pb-2">
                <div className="flex items-center gap-3 sm:gap-4">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight font-playfair">
                    {group.title}
                  </h2>
                  {group.pillBadge && (
                    <span className="text-[10px] sm:text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {group.pillBadge}
                    </span>
                  )}
                </div>

                <Link
                  to={group.viewAllHref}
                  className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1.5 group/more transition-colors"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover/more:translate-x-1" />
                </Link>
              </div>

              {/* 4 Cards Grid - Takes Full Width of screen with generous responsive gaps */}
              <div className="grid grid-cols-4 gap-3 sm:gap-5 md:gap-7 lg:gap-9 xl:gap-11">
                {group.items.map((item) => {
                  const finalImage = item.image || getDbImage(item.dbSlugKey);

                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="group flex flex-col items-center select-none"
                    >
                      {/* Image Container Card - Seamless fluid curve, no harsh box border */}
                      <div className="w-full aspect-square rounded-2xl sm:rounded-3xl lg:rounded-[32px] overflow-hidden bg-zinc-900/90 relative shadow-md group-hover:shadow-[0_12px_40px_rgba(218,171,52,0.22)] group-hover:scale-[1.025] group-hover:ring-2 group-hover:ring-amber-400/70 transition-all duration-300">
                        {/* Top-left Badge (Starts @₹500 / Try @ 99) */}
                        {item.badge && (
                          <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 z-10">
                            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black text-[9px] sm:text-xs md:text-sm font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md uppercase tracking-wide inline-block whitespace-nowrap">
                              {item.badge}
                            </span>
                          </div>
                        )}

                        {/* Image */}
                        <img
                          src={finalImage}
                          alt={item.label}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Inner gradient overlay for photo depth on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Label Below Card */}
                      <span className="mt-2.5 sm:mt-3.5 text-xs sm:text-sm md:text-base lg:text-lg font-bold text-slate-200 group-hover:text-amber-400 transition-colors text-center tracking-wide leading-tight">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopCategories;
