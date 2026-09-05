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
  const navigate = useNavigate();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 4500, stopOnInteraction: false })]
  );

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
    return <div className="w-full h-[400px] bg-slate-900 animate-pulse my-6"></div>;
  }

  return (
    <section className="w-full bg-black border-y border-white/10 relative overflow-hidden py-0 my-6">
      <div className="w-full relative group">
        {/* Full-width Embla Carousel Viewport */}
        <div className="embla overflow-hidden w-full" ref={emblaRef}>
          <div className="embla__container flex">
            {slides.map((slide) => (
              <div
                key={slide._id}
                className="embla__slide flex-[0_0_100%] min-w-0 relative aspect-[16/8] sm:h-[380px] md:h-[480px] lg:h-[520px] group/slide"
              >
                {/* Full Width Edge-to-Edge Background Banner Image */}
                <img
                  src={getImageUrl(slide.image)}
                  alt={slide.brandName}
                  className="absolute inset-0 w-full h-full object-contain sm:object-cover object-center bg-black/80 sm:bg-transparent transition-transform duration-700 group-hover/slide:scale-105"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent flex items-center px-6 sm:px-14 md:px-20">
                  <div className="max-w-xl space-y-3 sm:space-y-4">
                    
                    {/* Brand Header */}
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-[3px] block mb-1">
                        Official Brand Showcase
                      </span>
                      <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase text-white tracking-wider font-playfair drop-shadow-lg leading-tight">
                        {slide.brandName}
                      </h2>
                    </div>

                    {/* Tagline */}
                    {slide.tagline && (
                      <p className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-widest text-slate-300 drop-shadow">
                        {slide.tagline}
                      </p>
                    )}

                    {/* Shop Now CTA Button */}
                    <div className="pt-2 sm:pt-4">
                      <button
                        onClick={() => navigate(slide.shopLink)}
                        className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm md:text-base uppercase tracking-wider px-7 sm:px-9 py-3.5 rounded-full shadow-2xl hover:shadow-amber-500/30 transition-all transform hover:scale-105 flex items-center gap-2.5"
                      >
                        <span>Shop {slide.brandName} Now</span>
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows on Screen Edges */}
        {slides.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-black/60 hover:bg-amber-500 text-white hover:text-black border border-white/20 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-2xl z-10"
              aria-label="Previous horizontal slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-black/60 hover:bg-amber-500 text-white hover:text-black border border-white/20 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-2xl z-10"
              aria-label="Next horizontal slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default BrandHorizontalSlider;
