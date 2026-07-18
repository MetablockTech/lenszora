import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { brands } from "@/lib/api";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

const BrandsPage = () => {
  const [brandList, setBrandList] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const data = await brands.list();
      setBrandList(data);
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-700 rounded"></div>
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
            className="mb-12"
          >
            <h1 className="text-4xl font-playfair font-bold text-foreground mb-2">
              Our Brands
            </h1>
            <p className="text-muted-foreground">
              Discover premium eyewear from world-renowned brands
            </p>
          </motion.div>

          {/* Brands Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
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
                  className="group premium-card p-8 text-center hover:border-primary/50 transition-all duration-300 cursor-pointer"
                >
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {brand.name}
                  </h3>
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
