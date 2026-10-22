import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronDown, Zap, LocateFixed, Loader2, Navigation, Phone, Store as StoreIcon, ChevronRight } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { pincodes, stores as storesAPI } from "@/lib/api";

// Phone-only bar under the header: delivery location (pincode) + nearest stores, like big eyewear apps.

interface SavedLocation {
  pincode?: string;
  city?: string;
  state?: string;
  days?: number;
  serviceable?: boolean;
  lat?: number;
  lng?: number;
}

interface StoreItem {
  _id: string;
  name: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  isActive?: boolean;
  location?: { coordinates?: number[] };
}

const STORAGE_KEY = "deliveryLocation";

function loadLocation(): SavedLocation {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocation(loc: SavedLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    // storage unavailable
  }
}

// Great-circle distance in km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LocationBar = () => {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<SavedLocation>(loadLocation);
  const [pinInput, setPinInput] = useState(location.pincode || "");
  const [checking, setChecking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [allStores, setAllStores] = useState<StoreItem[]>([]);

  useEffect(() => {
    storesAPI.list({ isActive: true })
      .then((list: StoreItem[]) => setAllStores(Array.isArray(list) ? list.filter((s) => s.isActive !== false) : []))
      .catch(() => setAllStores([]));
  }, []);

  // Nearest stores: by GPS distance when known, else same pincode, then same city
  const nearbyStores = useMemo(() => {
    const withScore = allStores.map((s) => {
      const coords = s.location?.coordinates;
      const hasCoords = coords && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0);
      const km = location.lat !== undefined && location.lng !== undefined && hasCoords
        ? distanceKm(location.lat, location.lng, coords![1], coords![0])
        : undefined;
      const samePin = !!location.pincode && s.pincode === location.pincode;
      const sameCity = !!location.city && s.city?.toLowerCase() === location.city.toLowerCase();
      return { store: s, km, rank: km !== undefined ? km : samePin ? -2 : sameCity ? -1 : Infinity };
    });
    const known = location.pincode || location.lat !== undefined;
    return withScore
      .filter((x) => !known || x.rank !== Infinity)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3);
  }, [allStores, location]);

  const checkPincode = async (pin: string) => {
    setError("");
    if (!/^\d{6}$/.test(pin)) {
      setError("Enter a valid 6-digit pincode");
      return;
    }
    setChecking(true);
    try {
      const res = await pincodes.check(pin);
      const next: SavedLocation = res.serviceable
        ? { pincode: pin, city: res.city, state: res.state, days: res.estimatedDeliveryDays, serviceable: true }
        : { pincode: pin, serviceable: false };
      setLocation(next);
      saveLocation(next);
      if (!res.serviceable) setError("Sorry, we don't deliver to this pincode yet");
    } catch {
      setError("Could not check this pincode. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const useCurrentLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Location is not supported on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { ...location, lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(next);
        saveLocation(next);
        setLocating(false);
      },
      () => {
        setError("Location permission denied. Enter your pincode instead.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const line1 = location.serviceable && location.days
    ? `Delivery in ${location.days} day${location.days > 1 ? "s" : ""}`
    : location.pincode && location.serviceable === false
      ? "Delivery not available"
      : "Deliver to";
  const line2 = location.pincode
    ? [location.pincode, location.city, location.state].filter(Boolean).join(" · ")
    : location.lat !== undefined ? "Current location" : "Enter pincode";

  return (
    <>
      <div className="md:hidden flex items-center gap-2 px-3 pb-2.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-label="Change delivery location"
        >
          <MapPin className="h-4 w-4 shrink-0 text-[#DAAB34]" />
          <span className="min-w-0">
            <span className={`flex items-center gap-1 text-[11px] font-bold leading-tight ${location.serviceable === false ? "text-red-400" : "text-white"}`}>
              {line1}
              {location.serviceable && location.days ? <Zap className="h-3 w-3 fill-[#DAAB34] text-[#DAAB34]" /> : null}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] text-white/60 leading-tight">
              <span className="truncate">{line2}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-[#DAAB34]/40 bg-[#DAAB34]/10 px-2.5 py-1 text-[11px] font-bold text-[#DAAB34]"
        >
          <StoreIcon className="h-3.5 w-3.5" />
          {location.pincode || location.lat !== undefined
            ? nearbyStores.length > 0 ? `${nearbyStores.length} store${nearbyStores.length > 1 ? "s" : ""} near you` : "Find stores"
            : "Find stores"}
        </button>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-[#111112] border-white/10 text-white max-h-[88vh]">
          <div className="overflow-y-auto px-4 pb-6">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle className="font-playfair text-xl">Delivery & Stores</DrawerTitle>
              <DrawerDescription className="text-white/50">Check delivery time and find a store near you.</DrawerDescription>
            </DrawerHeader>

            <form
              onSubmit={(e) => { e.preventDefault(); checkPincode(pinInput.trim()); }}
              className="flex gap-2"
            >
              <input
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="Enter pincode"
                className="h-11 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus:border-[#DAAB34] focus:outline-none"
              />
              <button type="submit" disabled={checking} className="h-11 rounded-xl bg-[#DAAB34] px-5 text-sm font-bold text-black disabled:opacity-60">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
              </button>
            </form>

            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#DAAB34]"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              Use my current location
            </button>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            {location.serviceable && location.days && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
                <Zap className="h-4 w-4 shrink-0" />
                Delivery in {location.days} day{location.days > 1 ? "s" : ""} to {[location.city, location.pincode].filter(Boolean).join(", ")}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                {location.pincode || location.lat !== undefined ? "Stores near you" : "Our stores"}
              </p>
              <Link to="/store-locator" onClick={() => setOpen(false)} className="flex items-center gap-0.5 text-xs font-bold text-[#DAAB34]">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-3 space-y-2.5">
              {nearbyStores.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/50">
                  No store in this area yet. <Link to="/store-locator" onClick={() => setOpen(false)} className="font-bold text-[#DAAB34]">See all stores</Link>
                </p>
              ) : nearbyStores.map(({ store, km }) => {
                const coords = store.location?.coordinates;
                const directions = coords && (coords[0] !== 0 || coords[1] !== 0)
                  ? `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.addressLine || ""} ${store.city || ""}`)}`;
                return (
                  <div key={store._id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{store.name}</p>
                        <p className="mt-0.5 text-xs text-white/50">{[store.addressLine, store.city, store.pincode].filter(Boolean).join(", ")}</p>
                      </div>
                      {km !== undefined && <span className="shrink-0 text-xs font-bold text-[#DAAB34]">{km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}</span>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a href={directions} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#DAAB34] py-2 text-xs font-bold text-black">
                        <Navigation className="h-3.5 w-3.5" /> Directions
                      </a>
                      {store.phone && (
                        <a href={`tel:${store.phone}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 py-2 text-xs font-bold text-white">
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default LocationBar;
