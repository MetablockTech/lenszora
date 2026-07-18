import { useState, useEffect } from "react";
import { products } from "@/lib/api";
import ProductSlider from "./ProductSlider";

const NewArrivals = () => {
  const [productList, setProductList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const data = await products.list({ sort: 'createdAt:desc', limit: 15 });
      setProductList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="h-96 bg-slate-800/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (productList.length === 0) return null;

  return (
    <section id="new-arrivals" className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <ProductSlider
          title="New Arrivals"
          subtitle="Just dropped fresh additions to our premium collection"
          products={productList}
          viewAllLink="/shop?sortBy=newest"
          viewAllText="Explore All Arrivals"
        />
      </div>
    </section>
  );
};

export default NewArrivals;

