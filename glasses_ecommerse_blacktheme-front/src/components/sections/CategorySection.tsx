import { motion } from "framer-motion";
import { Glasses, Sun, Eye, CircleDot, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { categories } from "@/lib/api";
import useEmblaCarousel from "embla-carousel-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  level?: string;
  description?: string;
  image?: string;
  icon?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  electronics: <Sparkles className="h-8 w-8 text-primary" />,
  fashion: <Glasses className="h-8 w-8 text-primary" />,
  "home-furniture": <CircleDot className="h-8 w-8 text-primary" />,
  appliances: <Sun className="h-8 w-8 text-primary" />,
  beauty: <Eye className="h-8 w-8 text-primary" />,
};

const descriptions: Record<string, string> = {
  electronics: "Explore cutting-edge electronics",
  fashion: "Trendy styles for everyone",
  "home-furniture": "Comfort meets design",
  appliances: "Modern solutions for your home",
  beauty: "Premium beauty essentials",
};

const gradients: Record<string, string> = {
  electronics: "linear-gradient(135deg, hsl(220, 40%, 15%), hsl(0, 0%, 8%))",
  fashion: "linear-gradient(135deg, hsl(330, 40%, 15%), hsl(0, 0%, 8%))",
  "home-furniture": "linear-gradient(135deg, hsl(30, 40%, 15%), hsl(0, 0%, 8%))",
  appliances: "linear-gradient(135deg, hsl(200, 40%, 15%), hsl(0, 0%, 8%))",
  beauty: "linear-gradient(135deg, hsl(280, 40%, 15%), hsl(0, 0%, 8%))",
};

const CategorySection = () => {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const data = await categories.list();
      // Filter for main categories only
      const mainCategories = data.filter((cat: Category) =>
        !cat.parentId || cat.level === 'main'
      );
      setCategoryList(mainCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }

  const renderIcon = (iconName: string | undefined, slug: string) => {
    if (!iconName) return iconMap[slug] || <Sparkles className="h-8 w-8 text-primary" />;

    // If it's a Lucide name, we could ideally use a dynamic component, 
    // but for now we'll check if it's in our map or just use it as a string/SVG if it were one.
    // Given the lucide-react imports, we can use a helper if we had one.
    return iconMap[iconName] || iconMap[slug] || <Sparkles className="h-8 w-8 text-primary" />;
  };

  const displayCategories = categoryList.map((cat) => ({
    ...cat,
    title: cat.name,
    description: cat.description || descriptions[cat.slug] || "Explore our collection",
    icon: renderIcon(cat.icon, cat.slug),
    image: cat.image || gradients[cat.slug] || "linear-gradient(135deg, hsl(160, 30%, 15%), hsl(0, 0%, 8%))",
  }));

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="section-heading mb-4">
            Shop by <span className="gold-gradient-text">Category</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our curated collection across diverse categories
          </p>
        </motion.div>

        {loading ? (
          <div className="flex gap-6 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="min-w-[280px] h-64 bg-slate-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="relative">
            {/* Navigation Buttons */}
            {displayCategories.length > 4 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-black/80 border border-primary/30 hover:border-primary hover:bg-primary/10 rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-6 w-6 text-primary" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-black/80 border border-primary/30 hover:border-primary hover:bg-primary/10 rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label="Next"
                >
                  <ChevronRight className="h-6 w-6 text-primary" />
                </button>
              </>
            )}

            {/* Carousel */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-6">
                {displayCategories.map((category: any, index: number) => (
                  <motion.a
                    key={category._id}
                    href={`/category/${category.slug}`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden flex-none w-[280px] aspect-[3/4] premium-card cursor-pointer"
                  >
                    {/* Background */}
                    <div
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                      style={{ background: category.image }}
                    />

                    {/* Gold border on hover */}
                    <div className="absolute inset-0 border border-transparent group-hover:border-primary/50 transition-all duration-500" />

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 border border-primary/30 rounded-full flex items-center justify-center mb-4 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-500">
                        {category.icon}
                      </div>
                      <h3 className="font-playfair text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>

                      {/* Arrow indicator */}
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-primary text-sm">Explore →</span>
                      </div>
                    </div>

                    {/* Bottom gold line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySection;
