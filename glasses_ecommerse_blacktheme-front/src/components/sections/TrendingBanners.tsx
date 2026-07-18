import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { sliders, API_URL } from "@/lib/api";
import { ChevronRight, ChevronLeft } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface TrendingBanner {
  _id: string;
  image: string;
  buttonLink: string;
  bannerType: string;
  isActive: boolean;
}

const TrendingBanners = () => {
  const [banners, setBanners] = useState<TrendingBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  }, [Autoplay({ delay: 4000, stopOnInteraction: false })]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await sliders.list();
        const trending = data.filter((s: TrendingBanner) =>
          s.bannerType === 'Trending Banner' && s.isActive
        );
        setBanners(trending);
      } catch (error) {
        console.error("Failed to fetch trending banners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  if (loading || banners.length === 0) return null;

  return (
    <section className="py-6 lg:py-12 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 lg:mb-8 px-2">
          <h2 className="text-xl md:text-2xl font-bold text-white border-l-4 border-[#DAAB34] pl-4">
            #Trending at LENSZORA
          </h2>

          <div className="flex gap-3">
            <button
              onClick={scrollPrev}
              className="group p-3 rounded-full bg-white/5 hover:bg-gold/20 text-white/70 hover:text-gold transition-all border border-white/10 hover:border-gold/30 shadow-2xl backdrop-blur-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 group-active:scale-90 transition-transform" />
            </button>
            <button
              onClick={scrollNext}
              className="group p-3 rounded-full bg-white/5 hover:bg-gold/20 text-white/70 hover:text-gold transition-all border border-white/10 hover:border-gold/30 shadow-2xl backdrop-blur-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 group-active:scale-90 transition-transform" />
            </button>
          </div>
        </div>

        <div className="embla overflow-visible" ref={emblaRef}>
          <div className="embla__container flex gap-6 px-2">
            {banners.map((banner) => (
              <div key={banner._id} className="embla__slide flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_23%]">
                <Link
                  to={banner.buttonLink}
                  className="group relative block h-[260px] sm:h-[340px] md:h-[400px] lg:h-[420px] rounded-[2.5rem] overflow-hidden shadow-lg transition-transform hover:scale-[1.02] duration-300"
                >
                  {/* Background Image */}
                  <img
                    src={banner.image.startsWith('http') ? banner.image : `${API_URL}${banner.image}`}
                    alt="Trending"
                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Content */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <span>Shop Now</span>
                      <div className="p-1 rounded-full bg-white/20 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
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
