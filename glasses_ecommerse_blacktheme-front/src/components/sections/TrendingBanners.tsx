import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { products, sliders } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Play, Sparkles } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface TrendingItem {
  _id: string;
  title: string;
  image: string;
  tagline?: string;
  link: string;
  price?: number;
  badge?: string;
}

const TrendingBanners = () => {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      containScroll: "trimSnaps",
      dragFree: true,
    },
    [Autoplay({ delay: 3500, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    fetchTrendingData();
  }, []);

  async function fetchTrendingData() {
    try {
      setLoading(true);
      const [sliderList, productList] = await Promise.all([
        sliders.list().catch(() => []),
        products.list({ isBestSeller: true, limit: 6 }).catch(() => []),
      ]);

      const trendingCards: TrendingItem[] = [];

      // 1. Add Admin Trending Sliders
      if (sliderList && sliderList.length > 0) {
        sliderList.forEach((s: any) => {
          if (s.bannerType === "Trending Banner" && s.isActive) {
            trendingCards.push({
              _id: s._id,
              title: s.title || "Trending Collection",
              image: s.image,
              tagline: s.subtitle || "EXCLUSIVE EYEWEAR COLLECTION",
              badge: "FEATURED",
              link: s.buttonLink || "/shop",
            });
          }
        });
      }

      // The section exists only for the admin's Trending Banners: with none active, hide it
      if (trendingCards.length === 0) {
        setItems([]);
        return;
      }

      // 2. Add Bestseller / Featured Products as Trending Cards
      const rawProducts = Array.isArray(productList) ? productList : (productList?.products || []);
      if (rawProducts && rawProducts.length > 0) {
        rawProducts.forEach((p: any) => {
          const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.thumbnail || p.image);
          if (img) {
            trendingCards.push({
              _id: p._id,
              title: p.title,
              image: img,
              price: p.price,
              tagline: p.eyewearDetails?.frameShape ? `${p.eyewearDetails.frameShape.toUpperCase()} FRAME` : "BESTSELLER EYEWEAR",
              badge: "TRENDING NOW",
              link: `/product/${p._id}`,
            });
          }
        });
      }

      setItems(trendingCards);
    } catch (error) {
      console.error("Failed to fetch trending cards:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Nothing while loading, and nothing at all without an active Trending Banner
  if (loading || items.length === 0) return null;


  return (
    <section className="py-10 md:py-14 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header matching Lenskart design */}
        <div className="flex items-center justify-between mb-8 px-1">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span className="text-blue-500 font-black">#Trending</span>
              <span className="text-white font-bold">at LensZora</span>
            </h2>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={scrollPrev}
              className="p-2.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              className="p-2.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex gap-5 py-2">
            {items.map((item) => (
              <div
                key={item._id}
                className="embla__slide flex-[0_0_68%] sm:flex-[0_0_38%] md:flex-[0_0_28%] lg:flex-[0_0_20%] min-w-0"
              >
                <Link
                  to={item.link}
                  className="group relative block h-[300px] sm:h-[320px] md:h-[340px] rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-slate-950 border border-slate-800"
                >
                  {/* Background Image */}
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                  {/* Top Badge */}
                  {item.badge && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-amber-400 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-full shadow-lg">
                      {item.badge}
                    </div>
                  )}

                  {/* Content Footer */}
                  <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end text-white space-y-2">
                    <h3 className="text-xl font-black tracking-wider uppercase text-white drop-shadow-md line-clamp-1">
                      {item.title}
                    </h3>

                    {item.price && (
                      <div className="text-amber-400 font-extrabold text-sm">
                        ₹{item.price.toLocaleString()}
                      </div>
                    )}

                    {/* Tagline */}
                    {item.tagline && (
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 drop-shadow line-clamp-2">
                        {item.tagline}
                      </p>
                    )}

                    {/* CTA Button */}
                    <div className="pt-2">
                      <div className="inline-flex items-center gap-1.5 font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                        <span>Shop Now</span>
                        <Play className="w-3 h-3 fill-current transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendingBanners;
