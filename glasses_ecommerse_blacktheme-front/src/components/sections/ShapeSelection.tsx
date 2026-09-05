import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { eyewearAttributes } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import { Link } from "react-router-dom";

// Optical Eyeglasses Shape Images (Clear / Transparent Lenses)
const REAL_EYEGLASSES_SHAPE_IMAGES: Record<string, string> = {
  "aviator": "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop&q=80",
  "wayfarer": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
  "rectangle": "https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=600&auto=format&fit=crop&q=80",
  "oval": "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&auto=format&fit=crop&q=80",
  "round": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",
  "cat-eye": "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  "cateye": "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  "square": "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop&q=80",
  "geometric": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
  "clubmaster": "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  "browline": "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  "hexagonal": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
};

// Sunglasses Shape Images (Dark / Tinted / UV Lenses)
const REAL_SUNGLASSES_SHAPE_IMAGES: Record<string, string> = {
  "aviator": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  "wayfarer": "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  "rectangle": "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&auto=format&fit=crop&q=80",
  "oval": "https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=600&auto=format&fit=crop&q=80",
  "round": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",
  "cat-eye": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  "cateye": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  "square": "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  "geometric": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
  "clubmaster": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  "browline": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  "hexagonal": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
};

const DEFAULT_EYEGLASSES_IMAGE = "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80";
const DEFAULT_SUNGLASSES_IMAGE = "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80";

interface ShapeSelectionProps {
  type: string; // eyeglasses or sunglasses
  title: string;
}

const ShapeSelection = ({ type, title }: ShapeSelectionProps) => {
  const [shapes, setShapes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    async function loadShapes() {
      try {
        const data = await eyewearAttributes.getByType("frameShape");
        setShapes(data || []);
      } catch (err) {
        console.error("Failed to load shapes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShapes();
  }, []);

  if (loading || shapes.length === 0) return null;

  return (
    <section className="py-8 lg:py-16 bg-background overflow-hidden relative border-t border-white/5">
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between mb-6 lg:mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-white border-l-4 border-amber-400 pl-4 font-playfair uppercase tracking-tight">
            {title}
          </h2>
          
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="p-2.5 rounded-full bg-slate-900 hover:bg-amber-400 text-slate-300 hover:text-black transition-all border border-slate-800 shadow-md"
              aria-label="Previous shape"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              className="p-2.5 rounded-full bg-slate-900 hover:bg-amber-400 text-slate-300 hover:text-black transition-all border border-slate-800 shadow-md"
              aria-label="Next shape"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="embla overflow-visible" ref={emblaRef}>
          <div className="embla__container flex gap-5 md:gap-7">
            {shapes.map((shape, index) => {
              const shapeKey = shape.name.toLowerCase().trim().replace(/\s+/g, '-');
              const rawShapeKey = shape.name.toLowerCase().trim();
              const isSunglasses = type === 'sunglasses';
              const imageMap = isSunglasses ? REAL_SUNGLASSES_SHAPE_IMAGES : REAL_EYEGLASSES_SHAPE_IMAGES;
              const defaultFallback = isSunglasses ? DEFAULT_SUNGLASSES_IMAGE : DEFAULT_EYEGLASSES_IMAGE;

              // For sunglasses, prioritize dark sunglasses images; for eyeglasses, use shape.image or fallback
              const mappedImg = imageMap[shapeKey] || imageMap[rawShapeKey];
              const displayImage = isSunglasses
                ? (mappedImg || (shape.image ? getImageUrl(shape.image) : defaultFallback))
                : (shape.image ? getImageUrl(shape.image) : (mappedImg || defaultFallback));

              return (
                <motion.div
                  key={shape._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="embla__slide flex-[0_0_42%] sm:flex-[0_0_22%] lg:flex-[0_0_15%] flex flex-col items-center cursor-pointer group"
                >
                  <Link 
                    to={`/shop?category=${type}&frameShape=${shapeKey}`}
                    className="w-full flex flex-col items-center"
                  >
                    <div className="w-full aspect-square rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-amber-400/50 flex items-center justify-center mb-3 relative overflow-hidden shadow-xl">
                      <img 
                        src={displayImage} 
                        alt={shape.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-amber-400 transition-colors tracking-widest text-center uppercase">
                      {shape.name}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShapeSelection;
