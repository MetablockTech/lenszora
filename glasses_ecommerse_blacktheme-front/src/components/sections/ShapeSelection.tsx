import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { eyewearAttributes, API_URL } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import { Link } from "react-router-dom";

const FALLBACK_ICONS: Record<string, string> = {
  "rectangle": "👓",
  "cateye": "📐",
  "cat-eye": "📐",
  "aviator": "✈️",
  "geometric": "⬡",
  "round": "⭕",
  "clubmaster": "🕶️",
  "square": "⏹️",
  "hexagonal": "⬢",
  "oval": "🥚",
};

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
        setShapes(data);
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
    <section className="py-8 lg:py-20 bg-background overflow-hidden relative border-t border-white/5">
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between mb-6 lg:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white border-l-4 border-gold pl-5 font-playfair uppercase tracking-tight">
            {title}
          </h2>
          
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="p-2 rounded-full bg-white/5 hover:bg-gold/20 text-white/50 hover:text-gold transition-all border border-white/5"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              className="p-2 rounded-full bg-white/5 hover:bg-gold/20 text-white/50 hover:text-gold transition-all border border-white/5"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="embla overflow-visible" ref={emblaRef}>
          <div className="embla__container flex gap-6 md:gap-10">
            {shapes.map((shape, index) => (
              <motion.div
                key={shape._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="embla__slide flex-[0_0_45%] sm:flex-[0_0_25%] lg:flex-[0_0_15%] flex flex-col items-center cursor-pointer group"
              >
                <Link 
                  to={`/shop?category=${type}&frameShape=${shape.name.toLowerCase()}`}
                  className="w-full flex flex-col items-center"
                >
                  <div className="w-full aspect-square rounded-[2rem] bg-white/5 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-all relative overflow-hidden ring-1 ring-white/10 group-hover:ring-gold/40 shadow-2xl backdrop-blur-sm group-hover:scale-105 duration-500">
                    {shape.image ? (
                      <img 
                        src={shape.image.startsWith('http') ? shape.image : `${API_URL}${shape.image}`} 
                        alt={shape.name}
                        className="w-[85%] h-[85%] object-contain group-hover:scale-110 transition-transform duration-700 brightness-110"
                      />
                    ) : (
                      <span className="text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-500 filter drop-shadow-lg">
                        {FALLBACK_ICONS[shape.name.toLowerCase()] || "🕶️"}
                      </span>
                    )}
                    
                    {/* Premium Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 group-hover:text-gold transition-all duration-300 tracking-[0.2em] text-center uppercase">
                    {shape.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShapeSelection;
