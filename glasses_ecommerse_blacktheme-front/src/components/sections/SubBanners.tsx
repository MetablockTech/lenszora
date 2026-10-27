import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { sliders } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

// Row of smaller promo banners managed in Admin → Banners & Popups
// ("Hero Sub Banner" sits under the hero, "Footer Sub Banner" sits above the footer).

interface Banner {
  _id: string;
  title?: string;
  subtitle?: string;
  image: string;
  bannerType?: string;
  buttonText?: string;
  buttonLink?: string;
  order?: number;
  isActive?: boolean;
}

interface SubBannersProps {
  bannerType: "Hero Sub Banner" | "Footer Sub Banner";
}

const SubBanners = ({ bannerType }: SubBannersProps) => {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    let cancelled = false;
    sliders.list()
      .then((data: Banner[]) => {
        if (cancelled || !Array.isArray(data)) return;
        setBanners(
          data
            .filter((b) => b.bannerType === bannerType && b.isActive !== false && b.image)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        );
      })
      .catch(() => { if (!cancelled) setBanners([]); });
    return () => { cancelled = true; };
  }, [bannerType]);

  if (banners.length === 0) return null;

  // 1 → full width, 2 → halves, 3+ → thirds on desktop; phones scroll sideways when there are 2+
  const desktopCols = banners.length === 1 ? "md:grid-cols-1" : banners.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <section className="bg-background py-4 md:py-8">
      <div className="container mx-auto px-4 md:px-8">
        <div
          className={`flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide md:grid md:gap-5 md:overflow-visible ${desktopCols}`}
        >
          {banners.map((banner) => {
            const link = banner.buttonLink || "/shop";
            const isExternal = /^https?:\/\//.test(link);
            // Short strip: 6:1 on desktop, 4:1 on phones; the image fills it edge to edge.
            // Upload 6:1 images (e.g. 1800 × 300 px) and keep text in the centre; phones trim some of the sides.
            const card = (
              <div className="group relative aspect-[4/1] md:aspect-[6/1] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition-colors hover:border-amber-400/50">
                <img
                  src={getImageUrl(banner.image)}
                  alt={banner.title || "Offer"}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            );
            const itemClass = `snap-start shrink-0 ${banners.length === 1 ? "w-full" : "w-[85%] sm:w-[60%]"} md:w-auto`;
            return isExternal ? (
              <a key={banner._id} href={link} target="_blank" rel="noopener noreferrer" className={itemClass} aria-label={banner.title || "Offer"}>
                {card}
              </a>
            ) : (
              <Link key={banner._id} to={link} className={itemClass} aria-label={banner.title || "Offer"}>
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SubBanners;
