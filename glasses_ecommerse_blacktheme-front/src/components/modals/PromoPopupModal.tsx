import { useState, useEffect, useRef } from "react";
import { X, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { sliders, API_URL } from "@/lib/api";

const isPageMatch = (targetPage: string, currentPath: string, currentSearch: string) => {
  if (!targetPage) return currentPath === '/' || currentPath === '';
  const trimmed = targetPage.trim().toLowerCase();
  const path = currentPath.toLowerCase();
  const search = currentSearch.toLowerCase();
  const full = path + search;

  // Wildcard match
  if (trimmed === '*' || trimmed === 'all' || trimmed === 'everywhere') {
    return true;
  }
  // Homepage match
  if (trimmed === '/' || trimmed === 'home' || trimmed === 'homepage') {
    return path === '/' || path === '';
  }
  // Shop page match
  if (trimmed === '/shop' || trimmed === 'shop') {
    return path.startsWith('/shop');
  }
  // Checkout page match
  if (trimmed === '/checkout' || trimmed === 'checkout') {
    return path.startsWith('/checkout');
  }
  // Cart page match
  if (trimmed === '/cart' || trimmed === 'cart') {
    return path.startsWith('/cart');
  }
  // Product pages match
  if (trimmed === '/product' || trimmed === 'product') {
    return path.startsWith('/product');
  }
  // Exact path or query match
  if (trimmed === path || trimmed === full) return true;
  if (trimmed.includes('?') && full.includes(trimmed)) return true;
  if (path.startsWith(trimmed) && trimmed !== '/') return true;

  return false;
};

const PromoPopupModal = () => {
  const [popupBanner, setPopupBanner] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Never show popups on admin or vendor pages
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/vendor')) {
      setIsOpen(false);
      return;
    }

    const checkAndShowPopup = async () => {
      try {
        const data = await sliders.list();
        if (!Array.isArray(data)) return;

        // Find active popups
        const activePopups = data.filter((s: any) =>
          (s.bannerType === 'Popup Banner' || s.bannerType === 'Advertisement Popup' || s.bannerType === 'Promo Popup') &&
          s.isActive !== false &&
          s.image
        );

        // Find popup matching current route
        const matchedPopup = activePopups.find((p: any) =>
          isPageMatch(p.targetPage || '/', location.pathname, location.search)
        );

        if (matchedPopup) {
          const dismissedKey = `dismissed_popup_${matchedPopup._id}_${location.pathname}`;
          const isDismissed = sessionStorage.getItem(dismissedKey);

          if (!isDismissed) {
            setPopupBanner(matchedPopup);
            const delay = (Number(matchedPopup.delaySeconds) || 1) * 1000;

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              setIsOpen(true);
            }, delay);
          } else {
            setIsOpen(false);
          }
        } else {
          setIsOpen(false);
        }
      } catch (error) {
        console.error("Failed to load advertisement popup:", error);
      }
    };

    checkAndShowPopup();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname, location.search]);

  if (!isOpen || !popupBanner) return null;

  const imageUrl = popupBanner.image.startsWith('http')
    ? popupBanner.image
    : `${API_URL}${popupBanner.image}`;

  const redirectLink = popupBanner.buttonLink || popupBanner.url || popupBanner.link || "/shop";
  const buttonText = popupBanner.buttonText || "SHOP NOW";

  const handleClose = () => {
    if (popupBanner._id) {
      sessionStorage.setItem(`dismissed_popup_${popupBanner._id}_${location.pathname}`, 'true');
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      {/* Backdrop overlay click to close */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Popup Container - High Contrast Luxury Gold & Dark Zinc */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-amber-400/60 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(218,171,52,0.35)] z-10 animate-in zoom-in-95 duration-300">
        
        {/* Top Gold Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 z-30 shadow-[0_0_15px_rgba(218,171,52,0.8)]" />

        {/* Top-right close button */}
        <button
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-40 p-2.5 rounded-full bg-black/90 text-white hover:text-white hover:bg-red-600 border border-white/30 transition-all cursor-pointer shadow-2xl hover:scale-110 active:scale-95"
          aria-label="Close advertisement"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Clickable Banner Image */}
        <div 
          onClick={handleRedirect} 
          className="relative w-full cursor-pointer overflow-hidden group bg-gradient-to-b from-zinc-900 to-zinc-950 pt-2"
        >
          <img
            src={imageUrl}
            alt={popupBanner.title || "Advertisement Offer"}
            className="w-full h-auto max-h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/20 pointer-events-none" />
          
          {/* Subtle Hover Overlay Hint */}
          <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
            <span className="bg-black/90 text-amber-400 border border-amber-500/50 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xl">
              <span>Visit Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Content & Action Button */}
        <div className="p-6 text-center space-y-4 bg-zinc-950 border-t border-white/10">
          {(popupBanner.title || popupBanner.subtitle) && (
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Special Promotion</span>
              </div>
              {popupBanner.title && (
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-playfair">
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

          {/* Action CTA Button */}
          <button
            onClick={handleRedirect}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_6px_25px_rgba(218,171,52,0.45)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoPopupModal;
