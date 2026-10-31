import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, MapPin, Eye, ShoppingBag, Sparkles, Scan, Store, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import HomeEyeTestModal from "@/components/modals/HomeEyeTestModal";

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Eye Test asks where: at a store or at home
  const [eyeTestChoiceOpen, setEyeTestChoiceOpen] = useState(false);
  const [homeTestOpen, setHomeTestOpen] = useState(false);

  // Hide on admin routes or vendor routes
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/vendor')) {
    return null;
  }

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      path: "/",
      isActive: location.pathname === "/",
    },
    {
      id: "stores",
      label: "Stores",
      icon: MapPin,
      path: "/store-locator",
      isActive: location.pathname === "/store-locator",
    },
    {
      id: "tryon",
      label: "AR Try on",
      icon: Scan,
      path: "/contact",
      isActive: location.pathname === "/contact",
    },
    {
      id: "eyetest",
      label: "Eye Test",
      icon: Eye,
      path: "/store-locator",
      isActive: false,
    },
    {
      id: "orders",
      label: "Orders",
      icon: ShoppingBag,
      path: "/orders",
      isActive: location.pathname.startsWith("/orders"),
    },
    {
      id: "assistant",
      label: "Assistant",
      icon: Sparkles,
      path: "/support",
      isActive: location.pathname === "/support" || location.pathname === "/faq",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-lg border-t border-white/10 md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.9)]">
      <nav className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          if (item.id === "eyetest") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setEyeTestChoiceOpen(true)}
                className="relative flex-1 flex flex-col items-center justify-center h-full py-1 transition-all duration-200 group text-center select-none text-slate-400 hover:text-slate-200"
              >
                <Icon className="h-5 w-5 mb-1 transition-transform group-active:scale-90 text-slate-400" />
                <span className="text-[10px] leading-tight tracking-tight uppercase font-medium truncate max-w-[56px]">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center h-full py-1 transition-all duration-200 group text-center select-none",
                active ? "text-gold font-bold" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {/* Active Top Line Indicator (Matching the design spec) */}
              {active && (
                <span className="absolute top-0 inset-x-2 h-1 bg-gold rounded-b-md shadow-[0_2px_8px_rgba(218,171,52,0.8)]" />
              )}

              <Icon className={cn("h-5 w-5 mb-1 transition-transform group-active:scale-90", active ? "text-gold stroke-[2.2]" : "text-slate-400")} />
              <span className={cn("text-[10px] leading-tight tracking-tight uppercase font-medium truncate max-w-[56px]", active && "text-gold font-bold")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <Drawer open={eyeTestChoiceOpen} onOpenChange={setEyeTestChoiceOpen}>
        <DrawerContent className="border-white/10 bg-[#111112] text-white">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-playfair text-xl text-white">Book an Eye Test</DrawerTitle>
            <DrawerDescription className="text-slate-400">Where would you like your eye test?</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 px-4 pb-8">
            {[
              { key: "store", icon: Store, title: "At a Store", desc: "Free eye test at your nearest LensZora store", onClick: () => { setEyeTestChoiceOpen(false); navigate("/store-locator"); } },
              { key: "home", icon: Home, title: "At Home", desc: "A certified optometrist visits your home", onClick: () => { setEyeTestChoiceOpen(false); setHomeTestOpen(true); } },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={opt.onClick}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-amber-400/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                  <opt.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-white">{opt.title}</span>
                  <span className="block text-xs text-slate-400">{opt.desc}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-amber-400" />
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <HomeEyeTestModal isOpen={homeTestOpen} onClose={() => setHomeTestOpen(false)} />
    </div>
  );
};

export default MobileBottomNav;
