import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { brands } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface Brand {
  _id: string;
  name: string;
  slug?: string;
  logo?: string;
  banner?: string;
  tagline?: string;
}

const sampleBanners = [
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop&q=80",
];

const BrandsPage = () => {
  const [brandList, setBrandList] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const data = await brands.list();
      setBrandList(data || []);
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-12">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-slate-700 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-80 bg-slate-800 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center max-w-2xl mx-auto"
          >
            <h1 className="text-4xl font-playfair font-bold text-foreground mb-2">
              Our Premium Brands
            </h1>
            <p className="text-muted-foreground">
              Discover world-renowned eyewear collections, designer sunglasses, and optical frames
            </p>
          </motion.div>

          {/* Brands Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {brandList.map((brand, index) => (
              <Link
                key={brand._id}
                to={`/shop?brand=${brand._id}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative block h-[360px] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-slate-900 border border-white/10"
                >
                  <img
                    src={getImageUrl(brand.banner || sampleBanners[index % sampleBanners.length])}
                    alt={brand.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6" />
                  <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end text-white space-y-1.5">
                    {brand.logo ? (
                      <img src={getImageUrl(brand.logo)} alt={brand.name} className="h-8 object-contain mb-1" />
                    ) : (
                      <h3 className="text-2xl font-bold uppercase">{brand.name}</h3>
                    )}
                    {brand.tagline && <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{brand.tagline}</p>}
                    <div className="pt-2 text-xs font-bold uppercase tracking-wider text-white group-hover:text-amber-400 flex items-center gap-1">
                      <span>Shop Collection →</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {brandList.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No brands available
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BrandsPage;
