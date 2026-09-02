import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { sliders, API_URL } from "@/lib/api";

interface SliderData {
  _id: string;
  title: string;
  image: string;
}

const HeroSection = () => {
  const [slides, setSlides] = useState<SliderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const data = await sliders.list();
        const mainBanners = data.filter((s: any) =>
          s.bannerType === 'Main Banner' || !s.bannerType
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
    return <div className="h-[180px] sm:h-[320px] md:h-[420px] lg:h-[520px] xl:h-[650px] bg-background animate-pulse" />;
  }

  // Fallback if no sliders are active
  const displaySlides = slides.length > 0 ? slides : [
    {
      _id: "default",
      title: "Default",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80"
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
          {displaySlides.map((slide) => (
            <CarouselItem key={slide._id} className="pl-0 relative h-[180px] sm:h-[320px] md:h-[420px] lg:h-[520px] xl:h-[650px]">
              <div className="absolute inset-0 z-0">
                <img
                  src={slide.image.startsWith('http') ? slide.image : `${API_URL}${slide.image}`}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {displaySlides.length > 1 && (
          <>
            <CarouselPrevious className="left-4 bg-black/20 hover:bg-black/40 border-none text-white h-10 w-10 sm:h-12 sm:w-12 transition-all opacity-0 group-hover:opacity-100" />
            <CarouselNext className="right-4 bg-black/20 hover:bg-background/40 border-none text-white h-10 w-10 sm:h-12 sm:w-12 transition-all opacity-0 group-hover:opacity-100" />
          </>
        )}
      </Carousel>
    </section>
  );
};

export default HeroSection;
