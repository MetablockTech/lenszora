import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { brands, sliders } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface HorizontalSlide {
  _id: string;
  brandName: string;
  image: string;
  logo?: string;
  tagline?: string;
  shopLink: string;
}

const defaultHorizontalSlides: HorizontalSlide[] = [
  {
    _id: "demo-h1",
    brandName: "Ray-Ban",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1600&auto=format&fit=crop&q=80",
    tagline: "LEGENDARY STYLE & TIMENESS DESIGN",
    shopLink: "/shop",
  },
  {
    _id: "demo-h2",
    brandName: "Oakley Performance",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1600&auto=format&fit=crop&q=80",
    tagline: "HIGH DEFINITION OPTICS FOR ACTIVE LIFESTYLES",
    shopLink: "/shop",
  },
  {
    _id: "demo-h3",
    brandName: "Vincent Chase",
    image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1600&auto=format&fit=crop&q=80",
    tagline: "MODERN EYEWEAR CRAFTED FOR PERFECTION",
    shopLink: "/shop",
  },
];

const sampleHorizontalImages = [
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1600&auto=format&fit=crop&q=80",
];

const BrandHorizontalSlider = () => {
  const [slides, setSlides] = useState<HorizontalSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 4500, stopOnInteraction: false })]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    loadBrandBanners();
  }, []);

  async function loadBrandBanners() {
    try {
      setLoading(true);
      const [brandList, sliderList] = await Promise.all([
        brands.list().catch(() => []),
        sliders.list().catch(() => []),
      ]);

      const brandBannersOnly: HorizontalSlide[] = [];

      // 1. Add Brands from database
      if (brandList && brandList.length > 0) {
        brandList.forEach((b: any, index: number) => {
          const bannerImage = b.horizontalBanner || b.banner || sampleHorizontalImages[index % sampleHorizontalImages.length];
          brandBannersOnly.push({
            _id: b._id,
            brandName: b.name,
            image: bannerImage,
            logo: b.logo,
            tagline: (b.tagline && b.tagline.trim().toLowerCase() !== b.name.trim().toLowerCase()) ? b.tagline : `${b.name.toUpperCase()} EXCLUSIVE COLLECTION`,
            shopLink: `/shop?brand=${b._id}`,
          });
        });
      }

      // 2. Add sliders explicitly set to "Brand Banner" in Admin Sliders
      if (sliderList && sliderList.length > 0) {
        sliderList.forEach((s: any) => {
          if (s.bannerType === "Brand Banner" && s.isActive) {
            brandBannersOnly.push({
              _id: s._id,
              brandName: s.title || "Brand Collection",
              image: s.image,
              tagline: s.subtitle,
              shopLink: s.buttonLink || "/shop",
            });
          }
        });
      }

      if (brandBannersOnly.length === 0) {
        setSlides(defaultHorizontalSlides);
      } else {
        setSlides(brandBannersOnly);
      }
    } catch (error) {
      console.error("Failed to load brand horizontal banners:", error);
      setSlides(defaultHorizontalSlides);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="w-full h-[320px] sm:h-[400px] bg-slate-900 animate-pulse my-4 sm:my-6"></div>;
  }

  return (
    <section className="w-full bg-black border-y border-white/10 relative overflow-hidden py-0 my-4 sm:my-8">
      <div className="w-full relative group">
        {/* Full-width Embla Carousel Viewport */}
        <div className="embla overflow-hidden w-full" ref={emblaRef}>
          <div className="embla__container flex">
            {slides.map((slide) => (
              <div
                key={slide._id}
                className="embla__slide flex-[0_0_100%] min-w-0 relative h-[340px] sm:h-[400px] md:h-[480px] lg:h-[540px] group/slide"
              >
                {/* Full Width Edge-to-Edge Background Banner Image */}
                <img
                  src={getImageUrl(slide.image)}
                  alt={slide.brandName}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover/slide:scale-105"
                  loading="lazy"
                />

                {/* Gradient Overlay: mobile bottom-gradient for clear text + desktop left-to-right gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20 sm:bg-gradient-to-r sm:from-black/95 sm:via-black/60 sm:to-transparent flex items-end sm:items-center px-5 sm:px-14 md:px-20 pb-10 sm:pb-0">
                  <div className="max-w-xl space-y-2.5 sm:space-y-4">
                    
                    {/* Brand Header */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">
                        ★ Official Brand Showcase
                      </span>
                      <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-white tracking-wide font-playfair drop-shadow-lg leading-tight">
                        {slide.brandName}
                      </h2>
                    </div>

                    {/* Tagline */}
                    {slide.tagline && (
                      <p className="text-[11px] sm:text-sm md:text-base font-semibold uppercase tracking-wider text-slate-300 drop-shadow line-clamp-2 max-w-sm sm:max-w-lg">
                        {slide.tagline}
                      </p>
                    )}

                    {/* Shop Now CTA Button */}
                    <div className="pt-1.5 sm:pt-4">
                      <button
                        onClick={() => navigate(slide.shopLink)}
                        className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm md:text-base uppercase tracking-wider px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-amber-500/30 transition-all transform active:scale-95 flex items-center gap-2"
                      >
                        <span>Shop {slide.brandName}</span>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows on Screen Edges (Hidden on mobile to avoid blocking content, visible on tablet/desktop) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="hidden sm:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-amber-500 text-white hover:text-black border border-white/20 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-2xl z-10 items-center justify-center"
              aria-label="Previous horizontal slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={scrollNext}
              className="hidden sm:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-amber-500 text-white hover:text-black border border-white/20 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-2xl z-10 items-center justify-center"
              aria-label="Next horizontal slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Mobile Pagination Indicator Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => emblaApi?.scrollTo(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    selectedIndex === idx
                      ? "w-6 h-1.5 bg-amber-400"
                      : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default BrandHorizontalSlider;
