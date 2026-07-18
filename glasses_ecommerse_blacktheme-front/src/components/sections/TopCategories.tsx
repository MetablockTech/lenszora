import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categories, API_URL } from "@/lib/api";
import { ChevronRight } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  level?: string;
  parentId?: any;
}

const TopCategories = () => {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categories.list();
        setAllCategories(data);
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

  const getChildren = (parentId: string) => {
    return allCategories.filter(cat => 
      (cat.parentId?._id === parentId || cat.parentId === parentId)
    );
  };

  if (loading) return null;

  return (
    <section className="py-6 lg:py-12 bg-background relative z-50">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 lg:mb-10 border-l-4 border-gold pl-4">Top Categories</h2>
        <div className="flex overflow-x-auto lg:overflow-visible justify-start pb-4 gap-8 scrollbar-hide relative min-h-[160px] lg:min-h-[300px]">
          {mainCategories.map((category) => {
            const subs = getChildren(category._id).filter(c => c.level === 'sub');
            const isHovered = hoveredCategory === category._id;

            return (
              <div 
                key={category._id}
                className="relative group flex flex-col items-center flex-shrink-0"
                onMouseEnter={() => {
                  setHoveredCategory(category._id);
                }}
                onMouseLeave={() => {
                  setHoveredCategory(null);
                  setHoveredSub(null);
                }}
              >
                <Link 
                  to={`/shop?category=${category.slug}`}
                  className="flex flex-col items-center"
                >
                  <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] bg-[#f5f5f7] p-6 flex items-center justify-center mb-4 transition-all group-hover:bg-white group-hover:shadow-xl border border-white/5 shadow-sm overflow-hidden group-hover:scale-105 duration-300">
                    {category.image ? (
                      <img 
                        src={category.image.startsWith('http') ? category.image : `${API_URL}${category.image}`} 
                        alt={category.name} 
                        className="w-full h-full object-contain" 
                      />
                    ) : (
                      <div className="text-slate-400 text-xs">No Icon</div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-gold transition-colors text-center max-w-[120px]">
                    {category.name}
                  </span>
                </Link>

                {/* Subcategory Mega-Menu Dropdown */}
                {isHovered && subs.length > 0 && (
                  <div className={`absolute top-[85%] left-0 z-[100] mt-4 ${hoveredSub ? 'w-[500px]' : 'w-64'} bg-[#121214] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 flex overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all backdrop-blur-md`}>
                    {/* Left Column: Subcategories */}
                    <div className={`${hoveredSub ? 'w-1/2' : 'w-full'} border-r border-white/5 p-2 bg-black/40`}>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">Sub-categories</div>
                      <div className="space-y-1">
                        {subs.map((sub) => (
                          <div
                            key={sub._id}
                            onMouseEnter={() => setHoveredSub(sub._id)}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group/item ${hoveredSub === sub._id ? 'bg-white/10 shadow-lg ring-1 ring-white/10' : 'hover:bg-white/5'}`}
                          >
                            <Link
                              to={`/shop?category=${sub.slug}`}
                              className="flex-1 flex items-center gap-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {sub.image ? (
                                  <img 
                                    src={sub.image.startsWith('http') ? sub.image : `${API_URL}${sub.image}`} 
                                    alt={sub.name} 
                                    className="w-full h-full object-contain p-1" 
                                  />
                                ) : (
                                  <div className="text-[8px] text-slate-500">ICON</div>
                                )}
                              </div>
                              <span className={`text-sm font-medium transition-colors ${hoveredSub === sub._id ? 'text-gold' : 'text-slate-300'}`}>
                                {sub.name}
                              </span>
                            </Link>
                            <ChevronRight className={`w-4 h-4 transition-all ${hoveredSub === sub._id ? 'text-gold opacity-100 translate-x-0' : 'text-slate-600 opacity-0 -translate-x-2'}`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Sub-subcategories (Show only if hovered sub has children) */}
                    {hoveredSub && (
                      <div className="w-1/2 p-4 bg-transparent animate-in slide-in-from-left-2 duration-300">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Inside {subs.find(s => s._id === hoveredSub)?.name}</div>
                        <div className="grid grid-cols-1 gap-1">
                          {getChildren(hoveredSub).length > 0 ? (
                            getChildren(hoveredSub).map((subsub) => (
                              <Link
                                key={subsub._id}
                                to={`/shop?category=${subsub.slug}`}
                                className="group/subsub flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover/subsub:bg-gold transition-colors" />
                                <span className="text-sm text-slate-400 group-hover/subsub:text-gold">
                                  {subsub.name}
                                </span>
                              </Link>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8 opacity-40">
                              <div className="text-2xl mb-2 grayscale opacity-50">🕶️</div>
                              <p className="text-xs text-slate-500 font-medium italic">Full collection online</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5">
                          <Link 
                            to={`/shop?category=${subs.find(s => s._id === hoveredSub)?.slug}`}
                            className="text-xs font-bold text-gold hover:text-gold/80 flex items-center gap-1 group/btn"
                          >
                            Explore all in {subs.find(s => s._id === hoveredSub)?.name}
                            <ChevronRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TopCategories;
