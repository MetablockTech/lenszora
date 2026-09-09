import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { sliders } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

interface SliderData {
  _id: string;
  title?: string;
  subtitle?: string;
  image: string;
  buttonText?: string;
  buttonLink?: string;
  resourceType?: string;
  resourceId?: string;
  url?: string;
  link?: string;
}

const getSlideTargetUrl = (slide: SliderData) => {
  if (slide.resourceType === 'Product' && slide.resourceId) {
    return `/product/${slide.resourceId}`;
  }
  if (slide.resourceType === 'Category' && slide.resourceId) {
    return `/shop?category=${slide.resourceId}`;
  }
  if (slide.buttonLink && slide.buttonLink.trim()) {
    return slide.buttonLink.trim();
  }
  if (slide.url && slide.url.trim()) {
    return slide.url.trim();
  }
  if (slide.link && slide.link.trim()) {
    return slide.link.trim();
  }
  return null;
};

const HeroSection = () => {
  const [slides, setSlides] = useState<SliderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const data = await sliders.list();
        const mainBanners = data.filter((s: any) =>
          (s.bannerType === 'Main Banner' || !s.bannerType) && (s.isActive !== false)
        );
        setSlides(mainBanners);
      } catch (error) {
        console.error("Failed to fetch sliders:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSliders();
  }, []);

  if (isLoading) {
    return <div className="w-full aspect-[16/7] sm:aspect-[21/8] md:h-[420px] lg:h-[520px] xl:h-[650px] bg-background animate-pulse" />;
  }

  // Fallback if no sliders are active
  const displaySlides: SliderData[] = slides.length > 0 ? slides : [
    {
      _id: "default",
      title: "Default",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80",
      buttonLink: "/shop"
    }
  ];

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <Carousel
        opts={{
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
        className="w-full group"
      >
        <CarouselContent className="-ml-0">
          {displaySlides.map((slide) => {
            const targetUrl = getSlideTargetUrl(slide);
            const imageUrl = getImageUrl(slide.image);
            const isExternal = targetUrl ? (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) : false;
            const hasOverlayText = Boolean(slide.title || slide.subtitle || slide.buttonText);

            const SlideWrapper = ({ children }: { children: React.ReactNode }) => {
              if (!targetUrl) return <div className="relative w-full h-full">{children}</div>;
              if (isExternal) {
                return (
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full h-full block cursor-pointer group"
                  >
                    {children}
                  </a>
                );
              }
              return (
                <Link
                  to={targetUrl}
                  className="relative w-full h-full block cursor-pointer group"
                >
                  {children}
                </Link>
              );
            };

            return (
              <CarouselItem key={slide._id} className="pl-0 relative w-full aspect-[16/7] sm:aspect-[21/8] md:h-[420px] lg:h-[520px] xl:h-[650px]">
                <SlideWrapper>
                  <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-950/40 sm:bg-transparent">
                    <img
                      src={imageUrl}
                      alt={slide.title || "Hero Banner"}
                      className={`w-full h-full object-center transition-transform duration-500 group-hover:scale-[1.01] ${
                        hasOverlayText ? "object-contain sm:object-cover" : "object-contain"
                      }`}
                    />
                  </div>

                  {(slide.title || slide.subtitle || slide.buttonText) && (
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-10 md:p-14 text-white pointer-events-none">
                      {slide.title && (
                        <h2 className="text-xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-2 drop-shadow-lg text-white">
                          {slide.title}
                        </h2>
                      )}
                      {slide.subtitle && (
                        <p className="text-xs sm:text-sm md:text-base text-slate-200 mb-4 max-w-xl drop-shadow line-clamp-2">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.buttonText && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DAAB34] hover:bg-[#c99a2b] text-black font-bold text-xs sm:text-sm shadow-xl transition-all transform group-hover:scale-105 pointer-events-auto">
                            {slide.buttonText} →
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </SlideWrapper>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {displaySlides.length > 1 && (
          <>
            <CarouselPrevious className="left-2 sm:left-4 bg-black/40 hover:bg-black/70 border-none text-white h-8 w-8 sm:h-12 sm:w-12 transition-all opacity-0 group-hover:opacity-100 z-20" />
            <CarouselNext className="right-2 sm:right-4 bg-black/40 hover:bg-black/70 border-none text-white h-8 w-8 sm:h-12 sm:w-12 transition-all opacity-0 group-hover:opacity-100 z-20" />
          </>
        )}
      </Carousel>
    </section>
  );
};

export default HeroSection;
