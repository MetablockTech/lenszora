import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { products, categories } from "@/lib/api";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { getImageUrl, getProductImage } from "@/lib/utils";

interface Product {
  _id: string;
  title: string;
  price: number;
  salePrice?: number;
  description: string;
  images: string[];
  category: any;
  brand: any;
  stock: number;
  eyewearDetails?: {
    frameMaterial?: string;
    frameType?: string;
    frameShape?: string;
    frameColor?: string;
    glassColor?: string;
    polarized?: boolean;
    gender?: string;
    frameSize?: string;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryAndProducts();
  }, [slug]);

  async function fetchCategoryAndProducts() {
    try {
      // Get all categories and find matching one
      const allCategories = await categories.list();
      const category = allCategories.find((c: any) => c.slug === slug);
      setCategoryData(category);

      // Get all products and filter by category
      const allProducts = await products.list();
      const filtered = allProducts.filter(
        (p: any) => p.category?._id === category?._id || p.category === category?._id
      );
      setProductList(filtered);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-96 bg-slate-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-12">
        <div className="container mx-auto px-4">
          {/* Category Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-playfair font-bold text-foreground mb-2">
              {categoryData?.name || "Category"}
            </h1>
            <p className="text-muted-foreground">
              Browse our collection of {categoryData?.name.toLowerCase()}
            </p>
          </motion.div>

          {/* Products Grid */}
          {productList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No products in this category</p>
              <Link to="/shop" className="text-primary hover:underline mt-4 inline-block">
                Browse all products →
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {productList.length} products
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {productList.map((product, index) => (
                  <Link key={product._id} to={`/product/${product._id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="group/card bg-slate-900/40 rounded-xl overflow-hidden border border-slate-800 hover:border-primary/50 transition-all duration-300 h-full flex flex-col cursor-pointer"
                    >
                      {/* Product Image Area */}
                      <div className="relative aspect-[4/5] overflow-hidden bg-slate-800">
                        {/* Wishlist Button Placeholder */}
                        <button className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:border-primary hover:text-primary transition-all duration-300 rounded-full">
                          <Heart className="h-4 w-4" />
                        </button>

                        <img
                          src={getProductImage(product)}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                        />

                        {(() => {
                          const rawPrice = Number(product.price || 0);
                          const sale = Number(product.salePrice || product.discountPrice || rawPrice);
                          let mrp = Number(product.originalPrice || 0);
                          if (!mrp || mrp <= sale) {
                            mrp = sale < rawPrice ? rawPrice : Math.round(sale * 1.25);
                          }
                          const discPct = mrp > sale ? Math.round(((mrp - sale) / mrp) * 100) : 0;
                          return discPct > 0 ? (
                            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                              Save {discPct}%
                            </div>
                          ) : null;
                        })()}
                        {product.eyewearDetails?.polarized && (
                          <div className="absolute top-2 left-10 ml-2 bg-primary/90 text-black px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                            Polarized
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3 flex-grow flex flex-col">
                        <h3 className="text-sm font-medium text-white mb-1 line-clamp-1 group-hover/card:text-primary transition-colors">
                          {product.title}
                        </h3>

                        {/* Specs Pills */}
                        <div className="flex flex-wrap gap-x-1.5 gap-y-1 mb-3">
                          {/* Brand */}
                          {product.brand && (
                            <span className="text-[9px] font-bold text-primary border border-primary/30 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              {typeof product.brand === 'string' ? product.brand : product.brand.name}
                            </span>
                          )}

                          {/* Category */}
                          {product.category && (
                            <span className="text-[9px] text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded uppercase font-medium">
                              {typeof product.category === 'string' ? product.category : product.category.name}
                            </span>
                          )}

                          {/* Gender */}
                          {product.eyewearDetails?.gender && (
                            <span className="text-[9px] text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded">
                              {product.eyewearDetails.gender}
                            </span>
                          )}

                          {/* Frame Material */}
                          {product.eyewearDetails?.frameMaterial && (
                            <span className="text-[9px] text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded">
                              {product.eyewearDetails.frameMaterial}
                            </span>
                          )}

                          {/* Frame Shape */}
                          {product.eyewearDetails?.frameShape && (
                            <span className="text-[9px] text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded">
                              {product.eyewearDetails.frameShape}
                            </span>
                          )}

                          {/* Color */}
                          {(product.eyewearDetails?.frameColor || product.eyewearDetails?.glassColor) && (
                            <span className="text-[9px] text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded">
                              {product.eyewearDetails.glassColor || product.eyewearDetails.frameColor}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex flex-col">
                            {(() => {
                              const rawPrice = Number(product.price || 0);
                              const sale = Number(product.salePrice || product.discountPrice || rawPrice);
                              let mrp = Number(product.originalPrice || 0);
                              if (!mrp || mrp <= sale) {
                                mrp = sale < rawPrice ? rawPrice : Math.round(sale * 1.25);
                              }
                              const hasDisc = mrp > sale;
                              return hasDisc ? (
                                <>
                                  <span className="text-base font-bold text-primary">
                                    ₹{sale.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-slate-500 line-through">
                                    ₹{mrp.toLocaleString()}
                                  </span>
                                </>
                              ) : (
                                <span className="text-base font-bold text-white">
                                  ₹{sale.toLocaleString()}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover/card:bg-primary transition-colors">
                            <ArrowRight className="w-4 h-4 text-white group-hover/card:text-black" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
