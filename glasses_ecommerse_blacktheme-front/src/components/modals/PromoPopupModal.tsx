import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sliders, API_URL } from "@/lib/api";

const PromoPopupModal = () => {
  const [popupBanner, setPopupBanner] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopupBanner = async () => {
      try {
        const data = await sliders.list();
        // Find active banner with bannerType = 'Popup Banner' or 'Advertisement Popup' or 'Promo Popup'
        const popup = data.find((s: any) =>
          (s.bannerType === 'Popup Banner' || s.bannerType === 'Advertisement Popup' || s.bannerType === 'Promo Popup') &&
          s.isActive !== false
        );

        if (popup && popup.image) {
          const dismissedKey = `dismissed_popup_${popup._id}`;
          const isDismissed = sessionStorage.getItem(dismissedKey);
          if (!isDismissed) {
            setPopupBanner(popup);
            // Open modal after smooth delay
            const timer = setTimeout(() => {
              setIsOpen(true);
            }, 800);
            return () => clearTimeout(timer);
          }
        }
      } catch (error) {
        console.error("Failed to fetch promo popup banner:", error);
      }
    };

    fetchPopupBanner();
  }, []);

  if (!isOpen || !popupBanner) return null;

  const imageUrl = popupBanner.image.startsWith('http')
    ? popupBanner.image
    : `${API_URL}${popupBanner.image}`;

  const redirectLink = popupBanner.buttonLink || popupBanner.url || popupBanner.link || "/shop";
  const buttonText = popupBanner.buttonText || "SHOP NOW";

  const handleClose = () => {
    if (popupBanner._id) {
      sessionStorage.setItem(`dismissed_popup_${popupBanner._id}`, 'true');
    }
    setIsOpen(false);
  };

  const handleRedirect = () => {
    handleClose();
    if (redirectLink) {
      if (redirectLink.startsWith('http://') || redirectLink.startsWith('https://')) {
        window.open(redirectLink, '_blank');
      } else {
        navigate(redirectLink);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Backdrop overlay click */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Popup Container */}
      <div className="relative w-full max-w-lg bg-zinc-950 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/20 z-10 animate-in zoom-in-95 duration-300">
        
        {/* Top-right close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/70 text-white/90 hover:text-white hover:bg-black border border-white/20 transition-all cursor-pointer shadow-lg"
          aria-label="Close advertisement"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Clickable Banner Image */}
        <div 
          onClick={handleRedirect} 
          className="relative w-full cursor-pointer overflow-hidden group bg-gradient-to-b from-zinc-900 to-black"
        >
          <img
            src={imageUrl}
            alt={popupBanner.title || "Advertisement"}
            className="w-full h-auto max-h-[380px] object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30 pointer-events-none" />
        </div>

        {/* Content & Action Button */}
        <div className="p-6 text-center space-y-4 bg-zinc-950">
          {(popupBanner.title || popupBanner.subtitle) && (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Exclusive Offer</span>
              </div>
              {popupBanner.title && (
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {popupBanner.title}
                </h3>
              )}
              {popupBanner.subtitle && (
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-sm mx-auto">
                  {popupBanner.subtitle}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleRedirect}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoPopupModal;
