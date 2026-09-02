import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categories, API_URL } from "@/lib/api";
import { ChevronRight, Grid } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  level?: string;
  parentId?: any;
}

const TopCategories = () => {
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categories.list();
        const main = data.filter((cat: Category) => cat.level === 'main' || !cat.level).slice(0, 8);
        setMainCategories(main);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) return null;

  return (
    <section className="py-10 lg:py-14 bg-background relative z-40 border-b border-white/5">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 font-playfair">
                Top Categories
              </h2>
              <p className="text-xs text-slate-400 font-medium">Browse by specialized eyewear category</p>
            </div>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Categories Row */}
        <div className="flex overflow-x-auto lg:overflow-visible justify-start pb-4 gap-6 scrollbar-hide relative">
          {mainCategories.map((category) => (
            <div 
              key={category._id}
              className="relative group flex flex-col items-center flex-shrink-0"
            >
              <Link 
                to={`/shop?category=${category.slug}`}
                className="flex flex-col items-center"
              >
                {/* Category Container - Cover Image */}
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-3xl bg-slate-900 border border-slate-800/80 group-hover:border-amber-500/50 flex items-center justify-center mb-3 transition-all duration-300 group-hover:bg-slate-800/90 shadow-lg group-hover:shadow-amber-500/10 overflow-hidden group-hover:scale-105 relative">
                  {category.image ? (
                    <img 
                      src={category.image.startsWith('http') ? category.image : `${API_URL}${category.image}`} 
                      alt={category.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider p-4 text-center">No Icon</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-300 group-hover:text-amber-400 transition-colors text-center max-w-[130px]">
                  {category.name}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopCategories;
