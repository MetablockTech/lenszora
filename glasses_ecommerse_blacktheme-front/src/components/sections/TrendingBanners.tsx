import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { brands, sliders } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Play } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface TrendingItem {
  _id: string;
  title: string;
  image: string;
  logo?: string;
  tagline?: string;
  link: string;
}

const samplePosterImages = [
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop&q=80",
];

const fallbackTrendingCards: TrendingItem[] = [
  {
    _id: "demo-t1",
    title: "Pop Mart x LensZora",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
    tagline: "SWEET BEAN LIMITED EDITION",
    link: "/shop",
  },
  {
    _id: "demo-t2",
    title: "Moody Eyewear",
    image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80",
    tagline: "CHIC & ELEGANT FRAMES",
    link: "/shop",
  },
  {
    _id: "demo-t3",
    title: "Batman x LensZora",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80",
    tagline: "BOLD & BLACK, BATMAN STYLE!",
    link: "/shop",
  },
  {
    _id: "demo-t4",
    title: "Nuun Premium",
    image: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop&q=80",
    tagline: "MINIMALIST JAPANESE DESIGN",
    link: "/shop",
  },
];

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
      const [brandList, sliderList] = await Promise.all([
        brands.list().catch(() => []),
        sliders.list().catch(() => []),
      ]);

      const trendingCards: TrendingItem[] = [];

      // 1. Add Brands from database
      if (brandList && brandList.length > 0) {
        brandList.forEach((b: any, index: number) => {
          trendingCards.push({
            _id: b._id,
            title: b.name,
            image: b.banner || samplePosterImages[index % samplePosterImages.length],
            logo: b.logo,
            tagline: b.tagline || (index % 2 === 0 ? "BOLD & BLACK STYLE!" : "EXCLUSIVE EYEWEAR COLLECTION"),
            link: `/shop?brand=${b._id}`,
          });
        });
      }

      // 2. Add Trending Banner Sliders if created in Admin
      if (sliderList && sliderList.length > 0) {
        sliderList.forEach((s: any) => {
          if (s.bannerType === "Trending Banner" && s.isActive) {
            trendingCards.push({
              _id: s._id,
              title: s.title || "Trending Collection",
              image: s.image,
              link: s.buttonLink || "/shop",
            });
          }
        });
      }

      // 3. Fallback if no brands in DB yet
      if (trendingCards.length === 0) {
        setItems(fallbackTrendingCards);
      } else {
        setItems(trendingCards);
      }
    } catch (error) {
      console.error("Failed to fetch trending cards:", error);
      setItems(fallbackTrendingCards);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-10 container mx-auto px-4">
        <div className="h-8 bg-slate-800 animate-pulse rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[380px] bg-slate-900 animate-pulse rounded-[2rem]"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="py-10 md:py-14 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header matching Lenskart design */}
        <div className="flex items-center justify-between mb-8 px-1">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span className="text-blue-600 font-black">#Trending</span> at LensZora
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
                className="embla__slide flex-[0_0_82%] sm:flex-[0_0_46%] md:flex-[0_0_32%] lg:flex-[0_0_24%] min-w-0"
              >
                <Link
                  to={item.link}
                  className="group relative block h-[380px] sm:h-[400px] md:h-[420px] rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-slate-950 border border-slate-800"
                >
                  {/* Background Image */}
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                  {/* Content Footer */}
                  <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end text-white space-y-2">
                    {/* Brand Logo or Name */}
                    {item.logo ? (
                      <div className="h-10 flex items-center mb-1">
                        <img
                          src={getImageUrl(item.logo)}
                          alt={item.title}
                          className="max-h-full max-w-[140px] object-contain drop-shadow-md"
                        />
                      </div>
                    ) : (
                      <h3 className="text-2xl font-black tracking-wider uppercase text-white drop-shadow-md">
                        {item.title}
                      </h3>
                    )}

                    {/* Tagline */}
                    {item.tagline && (
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 drop-shadow">
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
