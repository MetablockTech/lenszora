import { Link, useLocation } from "react-router-dom";
import { Home, MapPin, Eye, ShoppingBag, Sparkles, Scan } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const location = useLocation();

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
    </div>
  );
};

export default MobileBottomNav;
