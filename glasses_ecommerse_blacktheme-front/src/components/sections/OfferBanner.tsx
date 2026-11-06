import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { sliders } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

const OfferBanner = () => {
  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfferBanner = async () => {
      try {
        const data = await sliders.list();
        // Only a Footer Banner (or the older Offer / Promo types). No fallback to other banners:
        // with no Footer Banner set, this section stays hidden instead of repeating e.g. the hero banner.
        const active = data.find((s: any) =>
          ['Footer Banner', 'Offer Banner', 'Promo Banner'].includes(s.bannerType) && s.isActive !== false
        );

        if (active) setBanner(active);
      } catch (error) {
        console.error("Failed to fetch offer banner:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOfferBanner();
  }, []);

  // Hidden until a Footer Banner is set and active in Admin → Banners
  if (loading || !banner) return null;

  const activeBanner = banner;
  const imageUrl = activeBanner.image ? getImageUrl(activeBanner.image) : "";

  const redirectLink = activeBanner.buttonLink || activeBanner.url || "/shop";
  const isExternal = redirectLink.startsWith('http://') || redirectLink.startsWith('https://');

  const bannerContent = (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group cursor-pointer bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-950 transition-all duration-300 hover:border-amber-400/40">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={activeBanner.title || "Offer Banner"}
          className="w-full aspect-[2/1] md:aspect-[4/1] object-cover object-center block rounded-2xl transition-transform duration-500 group-hover:scale-[1.005]"
        />
      ) : (
        /* Fallback Offer Banner Card */
        <div className="p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-black text-left">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              ✨ Store Locator & Offer
            </div>
            <h3 className="text-2xl md:text-4xl font-playfair font-bold text-white tracking-tight">
              {activeBanner.title || "FIND A STORE NEARBY"}
            </h3>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              {activeBanner.subtitle || "Locate a store near you to get a free eye test & explore active brand offers."}
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-gold/10">
              {activeBanner.buttonText || "GET DIRECTIONS →"}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section className="relative w-full overflow-hidden bg-background py-4 md:py-8">
      <div className="container mx-auto px-4 md:px-8">
        {isExternal ? (
          <a href={redirectLink} target="_blank" rel="noopener noreferrer" className="block w-full">
            {bannerContent}
          </a>
        ) : (
          <Link to={redirectLink} className="block w-full">
            {bannerContent}
          </Link>
        )}
      </div>
    </section>
  );
};

export default OfferBanner;
