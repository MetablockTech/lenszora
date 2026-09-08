import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, ChevronDown, Menu, X, LogOut, MapPin, Gift, Settings, Bookmark, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MegaMenu from "./MegaMenu";
import EyewearMegaMenu from "./EyewearMegaMenu";
import ReferralModal from "./ReferralModal";
import TopBar from "./TopBar";
import { useCart } from "@/hooks/use-cart";
import { useSettings } from "@/context/SettingsContext";
import { useWishlist } from "@/context/WishlistContext";
import { cn, getImageUrl } from "@/lib/utils";
import { getToken, clearToken, API_URL, getUser } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubSubCategory {
  _id: string;
  name: string;
  slug: string;
}

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  subcategories: SubSubCategory[];
}

interface MainCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  subcategories: SubCategory[];
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

const Header = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { itemCount } = useCart();
  const { wishlistItems } = useWishlist();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [navConfig, setNavConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Fetch navigation data
  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const response = await fetch(`${API_URL}/api/navigation/navigation`);
        if (response.ok) {
          const data = await response.json();

          setCategories(data.categories || []);
          setBrands(data.brands || []);
          setNavConfig(data.navConfig || {});
          if (data.categories && data.categories.length > 0) {
            setActiveCategorySlug(data.categories[0].slug);
          }
        }
      } catch (error) {
        console.error('Failed to fetch navigation:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNavigation();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderLogoText = () => {
    let name = settings.websiteName || 'LensZora';
    // Clean up domain/taglines like "WWW.LENSZORA.COM - BUY EYEGLASSES , SUNGLASSES"
    if (name.toUpperCase().includes('LENSZORA') || name.includes('.COM') || name.includes('WWW.') || name.length > 20) {
      name = 'LensZora';
    }
    const upperName = name.toUpperCase();
    const parts = upperName.split(' ');

    // Always use white for black background
    const firstPartColor = "text-white";
    const goldColor = "text-gold";

    if (parts.length > 1) {
      return (
        <>
          <span className={firstPartColor}>{parts[0]}</span>
          <span className={`${goldColor} ml-2`}>{parts.slice(1).join(' ')}</span>
        </>
      );
    } else {
      const mid = Math.ceil(upperName.length / 2);
      return (
        <>
          <span className={firstPartColor}>{upperName.substring(0, mid)}</span>
          <span className={goldColor}>{upperName.substring(mid)}</span>
        </>
      );
    }
  };

  const handleLogout = () => {
    clearToken();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
    window.location.reload(); // Force reload to update all components
  };

  const isLoggedIn = !!getToken();
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  const user = isLoggedIn ? getUser() : null;
  const userIdentifier = user ? (user.name || user.email || user.phone || "Account") : "Sign In";

  const handleReferFriends = () => {
    if (!isLoggedIn) {
      navigate('/auth');
      toast({
        title: "Please Sign In",
        description: "Sign in to access your referral link & rewards!",
      });
      return;
    }
    setIsReferralModalOpen(true);
  };

  const handlePrescriptionNearStore = () => {
    navigate("/store-locator");
    toast({
      title: "Prescription & Eye Checkup",
      description: "Please select a store near you to schedule your eye checkup & prescription test.",
    });
  };

  const renderProfileDropdown = (align: "start" | "end" = "end") => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 md:p-2 hover:text-gold transition-colors outline-none group" aria-label="Account Menu">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
            <User className="h-5 w-5 text-white" />
          </div>
          {!isLoggedIn && (
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-tight hidden sm:block text-white">
              Sign In
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64 bg-[#111111] border-white/10 p-2 shadow-2xl rounded-none z-50">
        {!isLoggedIn ? (
          <>
            <DropdownMenuItem className="py-3 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={() => navigate("/auth")}>
              <span className="text-white font-bold text-sm uppercase tracking-wider">Sign in/Sign up</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="py-3 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={() => navigate("/store-locator")}>
              <span className="text-white text-sm uppercase tracking-wider">Locate a store</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-3 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={() => navigate("/contact")}>
              <span className="text-white text-sm uppercase tracking-wider">Try @ Home</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {/* User Info Header */}
            <div className="px-4 py-2.5 border-b border-white/5 mb-1.5 bg-white/5">
              <p className="text-[10px] text-gold uppercase tracking-widest font-black">Logged In As</p>
              <p className="text-xs font-bold text-white truncate mt-0.5">{userIdentifier}</p>
            </div>

            <DropdownMenuItem className="py-2 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={() => navigate("/wishlist")}>
              <Bookmark className="h-4 w-4 mr-2.5 text-gold shrink-0" />
              <span className="text-white text-xs uppercase tracking-wider">My Saved</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="py-2 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={() => navigate("/wishlist")}>
              <Heart className="h-4 w-4 mr-2.5 text-gold shrink-0" />
              <span className="text-white text-xs uppercase tracking-wider">Wishlisted Items</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="py-2 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={handleReferFriends}>
              <Gift className="h-4 w-4 mr-2.5 text-gold shrink-0" />
              <span className="text-white text-xs uppercase tracking-wider">Refer Friends</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="py-2 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={() => navigate("/addresses")}>
              <Settings className="h-4 w-4 mr-2.5 text-gold shrink-0" />
              <span className="text-white text-xs uppercase tracking-wider">Setting - Addresses</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="py-2 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={() => navigate("/store-locator")}>
              <MapPin className="h-4 w-4 mr-2.5 text-gold shrink-0" />
              <span className="text-white text-xs uppercase tracking-wider">Find Store</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="py-2 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={handlePrescriptionNearStore}>
              <Eye className="h-4 w-4 mr-2.5 text-gold shrink-0" />
              <span className="text-white text-xs uppercase tracking-wider">Prescription - Near Store</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/5 my-1" />

            <DropdownMenuItem className="py-2 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={() => navigate("/orders")}>
              <ShoppingBag className="h-4 w-4 mr-2.5 text-white/60 shrink-0" />
              <span className="text-white text-xs uppercase tracking-wider">Track Order</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="py-2 px-4 focus:bg-white/5 cursor-pointer rounded-none" onClick={() => navigate("/contact")}>
              <span className="text-white text-xs uppercase tracking-wider ml-6">Try @ Home</span>
            </DropdownMenuItem>
          </>
        )}
        {isLoggedIn && (
          <>
            <DropdownMenuSeparator className="bg-white/5 my-1" />
            <DropdownMenuItem className="py-2.5 px-4 focus:bg-red-950/20 cursor-pointer text-red-500 rounded-none" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2.5 shrink-0" />
              <span className="text-xs uppercase tracking-wider font-bold">Logout</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header
      className="sticky top-0 z-50 bg-black py-3 md:py-4 shadow-lg"
    >
      <TopBar />

      <div className="border-b border-white/10 pb-3">
        <div className="container mx-auto px-0">
          <div className="flex items-center justify-between gap-2 md:gap-6 px-3 sm:px-4">
            {/* Left Side: Profile Icon (Mobile) + Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Mobile Profile Icon - Top Left on Mobile */}
              <div className="md:hidden">
                {renderProfileDropdown("start")}
              </div>

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
                <h1 className="font-playfair text-lg sm:text-xl md:text-2xl font-bold tracking-wider">
                  {renderLogoText()}
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center">
              {!loading && categories.map((category) => (
                <div
                  key={category._id}
                  className="relative"
                  onMouseEnter={() => {
                    setIsMegaMenuOpen(true);
                    setActiveCategorySlug(category.slug);
                  }}
                  onMouseLeave={() => setIsMegaMenuOpen(false)}
                >
                  <Link
                    to={`/shop?category=${category.slug}`}
                    onClick={() => setIsMegaMenuOpen(false)}
                    className="nav-link flex items-center gap-0.5 text-[11px] font-bold py-2 px-2 transition-colors uppercase tracking-wider whitespace-nowrap text-white hover:text-gold"
                  >
                    {category.name}
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isMegaMenuOpen && activeCategorySlug === category.slug ? "rotate-180" : ""}`} />
                  </Link>
                </div>
              ))}
              <div
                className="relative"
                onMouseEnter={() => {
                  setIsMegaMenuOpen(true);
                  setActiveCategorySlug("brands");
                }}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                <Link
                  to="/brands"
                  onClick={() => setIsMegaMenuOpen(false)}
                  className="nav-link flex items-center gap-0.5 text-[11px] font-bold py-2 px-2 transition-colors uppercase tracking-wider whitespace-nowrap text-white hover:text-gold"
                >
                  BRANDS
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isMegaMenuOpen && activeCategorySlug === "brands" ? "rotate-180" : ""}`} />
                </Link>
              </div>
              <Link
                to="/store-locator"
                className="nav-link flex items-center gap-0.5 text-[11px] font-bold py-2 px-2 transition-colors uppercase tracking-wider whitespace-nowrap text-white hover:text-gold"
              >
                STORES
              </Link>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-1.5 sm:gap-3 text-white flex-shrink-0">
              {/* Search Toggle Button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:text-gold transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist Link - restored on mobile */}
              <Link to="/wishlist" className="p-2 hover:text-gold transition-colors relative" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart Link */}
              <Link to="/checkout" className="p-2 hover:text-gold transition-colors relative" aria-label="Cart">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Desktop Profile Icon - Top Right on Desktop */}
              <div className="hidden md:block">
                {renderProfileDropdown("end")}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Full-width Search Bar Overlay */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 pt-3 pb-1 w-full"
              >
                <div className="relative flex items-center w-full bg-[#111111] border border-white/20 rounded-xl px-3 py-1.5 shadow-2xl">
                  <Search className="h-5 w-5 text-gold shrink-0 mr-2" />
                  <input
                    type="text"
                    placeholder="Search eyeglasses, sunglasses, brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }
                    }}
                    autoFocus
                    className="w-full bg-transparent text-white placeholder-slate-400 text-sm py-1.5 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-white p-1 mr-1"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (searchQuery.trim()) {
                        navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      } else {
                        setIsSearchOpen(false);
                      }
                    }}
                    className="bg-gold text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gold/90 transition-colors uppercase tracking-wider shrink-0"
                  >
                    Search
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Eyewear Mega Menu */}
        <AnimatePresence>
          {isMegaMenuOpen && (
            <div
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <EyewearMegaMenu
                categorySlug={activeCategorySlug}
                categories={categories}
                brands={brands}
                navConfig={navConfig}
                onItemClick={() => setIsMegaMenuOpen(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-black border-white/10 border-b"
          >
            <nav className="container mx-auto py-4 flex flex-col gap-4 px-4">
              {!loading && categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/shop?category=${category.slug}`}
                  className="transition-colors py-2 border-b text-white hover:text-gold border-white/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <Link
                to="/wishlist"
                className="flex items-center gap-2 transition-colors py-2 border-b text-white hover:text-gold border-white/5 uppercase text-sm font-bold tracking-wider"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Heart className="h-5 w-5 text-gold" />
                Wishlist {wishlistItems.length > 0 && `(${wishlistItems.length})`}
              </Link>
              <Link
                to="/store-locator"
                className="flex items-center gap-2 transition-colors py-2 border-b text-white hover:text-gold border-white/5 uppercase text-sm font-bold tracking-wider"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MapPin className="h-5 w-5 text-gold" />
                STORES
              </Link>
              <Link
                to="/addresses"
                className="flex items-center gap-2 transition-colors py-2 border-b text-white hover:text-gold border-white/5 uppercase text-sm font-bold tracking-wider"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5 text-gold" />
                My Addresses
              </Link>
              <a
                href={settings?.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.lenszora.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-all py-2.5 px-3 bg-zinc-900 border border-gold/30 rounded-xl text-gold hover:bg-gold/10 my-1 cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a2.372 2.372 0 0 1-.61-1.614V3.428c0-.623.224-1.196.609-1.614z" fill="#00E676"/>
                  <path d="M17.438 8.354l-3.646 3.646 3.646 3.646 4.14-2.366c.866-.495.866-1.966 0-2.461l-4.14-2.465z" fill="#FFD54F"/>
                  <path d="M3.61 1.814l10.182 10.186L17.438 8.354 5.922 1.785A2.35 2.35 0 0 0 3.61 1.814z" fill="#FF1744"/>
                  <path d="M3.61 22.186a2.35 2.35 0 0 0 2.312-.029l11.516-6.569-3.646-3.646L3.61 22.186z" fill="#2979FF"/>
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider leading-none">Download Mobile App</span>
                  <span className="text-white text-xs font-bold mt-0.5">Get on Google Play Store →</span>
                </div>
              </a>
              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 transition-colors py-2 border-b text-left text-red-400 hover:text-red-300 border-white/5 uppercase text-sm font-bold tracking-wider"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <ReferralModal open={isReferralModalOpen} onOpenChange={setIsReferralModalOpen} />
    </header>
  );
};

export default Header;
