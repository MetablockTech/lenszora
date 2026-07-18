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

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="relative w-full h-[120px] sm:h-[220px] md:h-[300px] lg:h-[380px] flex items-center group overflow-hidden">
        {/* SVG Mask Definition */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <clipPath id="premiumCurve" clipPathUnits="objectBoundingBox">
              <path d="M0,0 Q0.5,0.1 1,0 V1 Q0.5,0.9 0,1 Z" />
            </clipPath>
          </defs>
        </svg>

        <div className="absolute inset-x-0 inset-y-0 z-0 overflow-hidden shadow-2xl transition-all duration-700" 
             style={{ clipPath: 'url(#premiumCurve)' }}>
          <img 
            src={footerBanner.image.startsWith('http') ? footerBanner.image : `${API_URL}${footerBanner.image}`} 
            alt="Promotion"
            className="w-full h-full object-cover"
          />
          {/* Multi-layered gradient for premium depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        </div>
      </div>
    </section>
  );
};

export default OfferBanner;
