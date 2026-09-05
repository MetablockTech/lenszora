import { useEffect, useState } from "react";
import { sliders, API_URL } from "@/lib/api";

const OfferBanner = () => {
  const [footerBanner, setFooterBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFooterBanner = async () => {
      try {
        const data = await sliders.list();
        // Find the active Footer Banner
        const active = data.find((s: any) => s.bannerType === 'Footer Banner' && s.isActive);
        if (active) setFooterBanner(active);
      } catch (error) {
        console.error("Failed to fetch footer banner:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFooterBanner();
  }, []);

  if (loading || !footerBanner) return null;

  const imageUrl = footerBanner.image?.startsWith('http') ? footerBanner.image : `${API_URL}${footerBanner.image}`;

  return (
    <section className="relative w-full overflow-hidden bg-background py-3 md:py-6">
      <div className="container mx-auto px-4 md:px-8">
        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
          {footerBanner.buttonLink ? (
            <a href={footerBanner.buttonLink} className="block w-full">
              <img 
                src={imageUrl} 
                alt={footerBanner.title || "Offer Banner"}
                className="w-full h-auto max-h-[460px] object-contain sm:object-cover object-center rounded-2xl transition-transform duration-500 group-hover:scale-[1.01]"
              />
            </a>
          ) : (
            <img 
              src={imageUrl} 
              alt={footerBanner.title || "Offer Banner"}
              className="w-full h-auto max-h-[460px] object-contain sm:object-cover object-center rounded-2xl"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default OfferBanner;
