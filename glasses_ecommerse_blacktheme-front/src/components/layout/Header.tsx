import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, ChevronDown, Menu, X, LogOut, MapPin, Gift, Settings, Bookmark, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MegaMenu from "./MegaMenu";
import EyewearMegaMenu from "./EyewearMegaMenu";
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
    const name = settings.websiteName.toUpperCase();
    const parts = name.split(' ');

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
      const mid = Math.ceil(name.length / 2);
      return (
        <>
          <span className={firstPartColor}>{name.substring(0, mid)}</span>
          <span className={goldColor}>{name.substring(mid)}</span>
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
  const user = isLoggedIn ? getUser() : null;
  const userIdentifier = user ? (user.name || user.email || user.phone || "Account") : "Sign In";

  const handleReferFriends = () => {
    const referCode = `LENSEZORA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const referLink = `${window.location.origin}/auth?ref=${referCode}`;
    navigator.clipboard.writeText(referLink);
    toast({
      title: "Referral Link Copied!",
      description: `Share this link with your friends to get 50% off! Code: ${referCode}`,
    });
  };

  const handlePrescriptionNearStore = () => {
    navigate("/store-locator");
    toast({
      title: "Prescription & Eye Checkup",
      description: "Please select a store near you to schedule your eye checkup & prescription test.",
    });
  };

  return (
    <header
      className="sticky top-0 z-50 bg-black py-4 shadow-lg"
    >
      <TopBar />

      <div className="border-b border-white/10 pb-3">
        <div className="container mx-auto px-0">
          <div className="flex items-center justify-between gap-6 px-4">
            {/* Logo - Left Side */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              {settings.logoUrl ? (
                <div className="h-8 w-8 rounded-lg bg-white/10 p-1 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={getImageUrl(settings.logoUrl)}
                    alt={settings.websiteName}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : null}
              <h1 className="font-playfair text-xl md:text-2xl font-bold tracking-wider">
                {renderLogoText()}
              </h1>
            </Link>

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
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isMegaMenuOpen ? "rotate-180" : ""}`} />
                  </Link>
                </div>
              ))}
              <Link
                to="/store-locator"
                className="nav-link flex items-center gap-0.5 text-[11px] font-bold py-2 px-2 transition-colors uppercase tracking-wider whitespace-nowrap text-white hover:text-gold"
              >
                STORES
              </Link>
            </nav>

            {/* Right Icons - Compact */}
            <div className="flex items-center gap-3 text-white flex-shrink-0">
              <div className="relative flex items-center">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-[300px] bg-white rounded-lg shadow-lg border border-border/30 overflow-hidden z-50 p-2"
                    >
                      <input
                        type="text"
                        placeholder="Search products..."
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
                        className="w-full bg-slate-50 border border-border/30 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 hover:text-gold transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
              <Link to="/wishlist" className="p-2 hover:text-gold transition-colors relative hidden md:block">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
              <Link to="/checkout" className="p-2 hover:text-gold transition-colors relative">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 md:p-2 hover:text-gold transition-colors outline-none group">
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <User className="h-5 w-5" />
                    </div>
                    {!isLoggedIn && (
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-tight hidden sm:block">
                        Sign In
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-[#111111] border-white/10 p-2 shadow-2xl rounded-none">
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

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
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
            <nav className="container mx-auto py-4 flex flex-col gap-4">
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
                to="/store-locator"
                className="flex items-center gap-2 transition-colors py-2 border-b text-white hover:text-gold border-white/5 uppercase text-sm font-bold tracking-wider"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MapPin className="h-5 w-5" />
                STORES
              </Link>
              <Link
                to="/addresses"
                className="flex items-center gap-2 transition-colors py-2 border-b text-white hover:text-gold border-white/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MapPin className="h-5 w-5" />
                My Addresses
              </Link>
              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 transition-colors py-2 border-b text-left text-white hover:text-gold border-white/5"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
