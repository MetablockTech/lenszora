import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { categories } from "@/lib/api";

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  level: 'sub' | 'subsub';
}

interface MainCategory {
  _id: string;
  name: string;
  slug: string;
  level: 'main';
  subcategories?: SubCategory[];
}

const MegaMenu = ({ onItemClick }: { onItemClick?: () => void }) => {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const data = await categories.list();
      if (data && data.length > 0) {
        setAllCategories(data);
        // Get only main categories
        const mains = data.filter((c: any) => c.level === 'main');

        // Map each main category with its subcategories
        const enriched = mains.map((mainCat: any) => ({
          ...mainCat,
          subcategories: data.filter((c: any) => c.parentId?._id === mainCat._id || c.parentId === mainCat._id)
        }));

        setMainCategories(enriched);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 w-full bg-popover border-t border-b border-primary/20 shadow-2xl z-50"
    >
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mainCategories.map((mainCat) => (
            <div key={mainCat._id} className="space-y-4">
              {/* Main Category Title */}
              <Link to={`/category/${mainCat.slug}`} onClick={onItemClick}>
                <h3 className="font-playfair text-lg font-semibold text-primary border-b border-primary/30 pb-2 hover:text-primary/80 transition-colors cursor-pointer">
                  {mainCat.name}
                </h3>
              </Link>

              {/* Subcategories */}
              {mainCat.subcategories && mainCat.subcategories.length > 0 ? (
                <ul className="space-y-2">
                  {mainCat.subcategories.map((sub: any) => {
                    // Get sub-subcategories for this subcategory
                    const subSubs = allCategories.filter(c => c.parentId?._id === sub._id || c.parentId === sub._id);

                    return (
                      <li key={sub._id}>
                        <details className="group">
                          <summary className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 cursor-pointer">
                            <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                            {sub.name}
                          </summary>
                          {subSubs.length > 0 && (
                            <ul className="ml-4 mt-2 space-y-1 border-l border-primary/20 pl-3">
                              {subSubs.map((subsub: any) => (
                                <li key={subsub._id}>
                                  <Link
                                    to={`/category/${subsub.slug}`}
                                    onClick={onItemClick}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                  >
                                    <ChevronRight className="h-2 w-2" />
                                    {subsub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </details>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No subcategories</p>
              )}

              {/* Browse All Link */}
              <Link
                to={`/category/${mainCat.slug}`}
                onClick={onItemClick}
                className="inline-block mt-4 text-xs font-medium text-primary hover:text-primary/80 border border-primary/30 px-3 py-2 hover:bg-primary/10 transition-all duration-300"
              >
                Explore All →
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom Gold Divider */}
        <div className="mt-8 pt-4 border-t border-primary/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Explore our <span className="text-primary">premium collection</span> of eyewear
            </p>
            <Link to="/shop" onClick={onItemClick} className="text-sm text-primary hover:underline">
              View All Products →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MegaMenu;
