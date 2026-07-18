import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Phone, Clock, Navigation, Star, Gift, Maximize2, ExternalLink, ChevronRight, CheckCircle2 } from "lucide-react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useNavigate } from "react-router-dom";
import { stores as storesApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppointmentModal from "@/components/modals/AppointmentModal";

interface Store {
  _id: string;
  name: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  hours: string;
  rating?: number;
  totalReviews?: number;
  freeGift?: boolean;
  vendorId?: string | { _id: string; businessName: string };
  services: string[];
  mapUrl?: string;
  images?: string[];
  isActive: boolean;
  location?: {
    type: string;
    coordinates: number[]; // [lng, lat]
  };
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1b1b1b" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }
];

const StoreLocator = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [bookingStore, setBookingStore] = useState<Store | null>(null);
  const storeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  // Haversine Distance Formula (Returns KM)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    // 1. Get User Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => console.error("Geolocation error:", error)
      );
    }

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const fetchStores = async () => {
      try {
        const data = await storesApi.list({ isActive: true });
        setStores(data);
        if (data.length > 0) setSelectedStore(data[0]);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();

    return () => { document.head.removeChild(link); };
  }, []);

  const filteredStores = stores
    .filter((store) =>
      `${store.name} ${store.city} ${store.state} ${store.pincode}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(store => {
      if (userLocation && store.location?.coordinates) {
        const dist = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          store.location.coordinates[1],
          store.location.coordinates[0]
        );
        return { ...store, distance: dist };
      }
      return store;
    })
    .sort((a, b) => {
      if ((a as any).distance !== undefined && (b as any).distance !== undefined) {
        return (a as any).distance - (b as any).distance;
      }
      return 0;
    });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    if (filteredStores.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      filteredStores.forEach(s => {
        if (s.location?.coordinates?.[1]) {
          bounds.extend({ lat: s.location.coordinates[1], lng: s.location.coordinates[0] });
        }
      });
      map.fitBounds(bounds);
    }
  }, [filteredStores]);

  // Sync marker click with list scroll
  useEffect(() => {
    if (selectedStore && storeRefs.current[selectedStore._id]) {
        storeRefs.current[selectedStore._id]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }
  }, [selectedStore]);

  useEffect(() => {
    if (map && filteredStores.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;
      filteredStores.forEach(s => {
        if (s.location?.coordinates?.[1]) {
          bounds.extend({ lat: s.location.coordinates[1], lng: s.location.coordinates[0] });
          hasValidCoords = true;
        }
      });
      if (hasValidCoords) {
        map.fitBounds(bounds);
        // Don't zoom in too much for a single store
        if (filteredStores.length === 1) {
          map.setZoom(14);
        }
      }
    }
  }, [filteredStores, map]);

  useEffect(() => {
    if (map && selectedStore?.location?.coordinates?.[1]) {
      map.panTo({
        lat: selectedStore.location.coordinates[1],
        lng: selectedStore.location.coordinates[0]
      });
      map.setZoom(15);
    }
  }, [selectedStore, map]);

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-[#DAAB34] selection:text-black">
      <Header />

      {/* ─── TOP BAR ─── */}
      <div className="bg-[#0A0A0B] border-b border-white/5 py-3 lg:py-4 px-4 lg:px-8 sticky top-0 z-[40] flex flex-col md:flex-row items-stretch md:items-center gap-3 lg:gap-6 shadow-2xl backdrop-blur-md">
        <div className="hidden lg:block shrink-0">
          <h1 className="font-playfair text-2xl font-bold text-white leading-tight">Find a Store</h1>
          <p className="text-[11px] text-[#DAAB34] uppercase tracking-widest font-bold">Lenzora Outlets</p>
        </div>

        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#DAAB34] transition-colors" />
          <input
            type="text"
            placeholder="Search by Locality / State / Pincode"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#DAAB34] transition-all placeholder:text-white/20"
          />
        </div>

        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                  setUserLocation(pos);
                  if (map) {
                    map.panTo(pos);
                    map.setZoom(14);
                  }
                },
                (error) => {
                  console.error("Error getting location", error);
                  alert("Please enable location access to use this feature.");
                }
              );
            }
          }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#DAAB34]/10 border border-[#DAAB34]/30 text-[#DAAB34] rounded-full text-sm font-bold hover:bg-[#DAAB34] hover:text-black transition-all shrink-0"
        >
          <Navigation className="w-4 h-4" />
          Use My Location
        </button>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex flex-col lg:grid lg:grid-cols-2 h-[calc(100vh-140px)] lg:h-[calc(100vh-75px)]">

        {/* ─── LEFT PANEL ─── */}
        <section className="overflow-y-auto bg-[#0A0A0B] custom-scrollbar border-r border-white/5 flex-1 order-last lg:order-first">
          <div className="px-4 lg:px-8 pb-10 pt-4 lg:pt-8 space-y-6">
            <div className="flex items-center justify-between text-xs text-white/40 font-bold uppercase tracking-widest px-1">
              <span>{filteredStores.length} Stores Found</span>
              <div className="flex gap-4">
                <button className="hover:text-[#DAAB34]">Filter</button>
                <button className="hover:text-[#DAAB34]">Sort</button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-60">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DAAB34]"></div>
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-white/40 italic">No stores found matching your search.</p>
              </div>
            ) : (
              filteredStores.map((store) => (
                <motion.div
                  key={store._id}
                  layout
                  ref={el => storeRefs.current[store._id] = el}
                  onClick={() => setSelectedStore(store)}
                  className={`group bg-[#111112] border transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden ${selectedStore?._id === store._id ? "border-[#DAAB34] shadow-[0_0_30px_rgba(218,171,52,0.1)]" : "border-white/5 hover:border-white/10"
                    }`}
                >
                  <div className="flex p-4 gap-4">
                    <div className="relative w-[140px] md:w-[160px] self-stretch bg-[#0C1B3A] rounded-xl overflow-hidden grow-0 shrink-0 shadow-inner">
                      {store.images?.[0] ? (
                        <img src={getImageUrl(store.images[0])} alt={store.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                          <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Lenzora</span>
                          <span className="text-[14px]">✨</span>
                        </div>
                      )}

                      {store.freeGift && (
                        <div className="absolute top-0 left-0 -translate-x-1/4 translate-y-1/4 -rotate-45 bg-[#DAAB34] text-black text-[7px] font-black px-6 py-1 z-10 shadow-sm uppercase tracking-tighter w-[100px] text-center">
                          Free Gift
                        </div>
                      )}

                      {store.isActive && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold text-[#0D8A3E] bg-[#E6F7EE]/90 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0D8A3E] animate-pulse" />
                          Open Now
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex flex-col min-w-0 flex-1">
                          <h3 className="font-playfair text-lg font-bold text-white leading-tight truncate pr-2 group-hover:text-[#DAAB34] transition-colors">{store.name}</h3>
                          {store.vendorId && typeof store.vendorId === 'object' && (
                            <span className="text-[10px] text-[#DAAB34] font-bold uppercase tracking-wider mt-0.5">
                              {(store.vendorId as any).businessName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[13px] font-bold text-[#DAAB34] shrink-0">
                          <Star className="w-3.5 h-3.5 fill-[#DAAB34]" />
                          {store.rating || 4.9}
                          <span className="text-white/40 font-normal">({store.totalReviews || 970})</span>
                        </div>
                      </div>

                      <p className="text-[12px] text-white/60 leading-snug mb-1.5 line-clamp-2">
                        {store.addressLine}, {store.city}, {store.state}, {store.pincode}
                      </p>
                      <p className="text-[11px] text-[#DAAB34]/60 font-medium mb-3">Hours: {store.hours}</p>

                      <div className="flex items-center gap-6 mb-4">
                        <a href={`tel:${store.phone}`} className="flex items-center gap-2 text-[12px] font-semibold text-white/80 hover:text-[#DAAB34] transition-colors">
                          <Phone className="w-3.5 h-3.5 text-[#DAAB34]" />
                          {store.phone}
                        </a>
                        <button className="flex items-center gap-2 text-[12px] font-semibold text-white/80 hover:text-[#DAAB34] transition-colors" onClick={(e) => {
                          e.stopPropagation();
                          const query = encodeURIComponent(`${store.name}, ${store.addressLine}, ${store.city}, ${store.state} ${store.pincode}`);
                          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                        }}>
                          <Navigation className="w-4 h-4 text-[#DAAB34]" />
                          {(store as any).distance ? `${(store as any).distance.toFixed(1)} km` : '1.8 km'} . Direction
                        </button>
                      </div>

                      <div className="flex gap-2.5 mt-auto">
                        <button 
                          className="flex-1 py-2.5 border border-white/10 rounded-xl text-[13px] font-semibold hover:bg-white/5 transition-colors text-white/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (store.vendorId) {
                              navigate(`/shop?vendorId=${store.vendorId}`);
                            } else {
                              navigate('/shop');
                            }
                          }}
                        >
                          Store Details
                        </button>
                        <button 
                          className="flex-[1.5] py-2.5 bg-[#DAAB34] text-black rounded-xl text-[13px] font-bold hover:opacity-90 transition-all shadow-lg active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookingStore(store);
                            setIsAppointmentModalOpen(true);
                          }}
                        >
                          Book Free Appointment
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] py-2.5 px-4 flex items-center justify-center gap-4 border-t border-white/5 overflow-hidden">
                    {store.services.map((svc, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-[11px] font-semibold text-white/40 whitespace-nowrap">{svc}</span>
                        {i < store.services.length - 1 && <div className="w-1 h-1 rounded-full bg-white/10" />}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* ─── RIGHT PANEL (INTERACTIVE MAP) ─── */}
        <section className="relative bg-[#050505] overflow-hidden group h-[40vh] lg:h-auto shrink-0 order-first lg:order-last border-b lg:border-b-0 border-white/10">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={selectedStore?.location?.coordinates?.[1] ? { lat: selectedStore.location.coordinates[1], lng: selectedStore.location.coordinates[0] } : (userLocation || { lat: 26.9124, lng: 75.7873 })}
              zoom={12}
              onLoad={onMapLoad}
              options={{
                styles: darkMapStyle,
                disableDefaultUI: true,
                zoomControl: false,
                gestureHandling: 'cooperative'
              }}
            >
              {/* User Location Marker */}
              {userLocation && (
                <MarkerF
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2,
                  }}
                  title="Your Location"
                />
              )}

              {filteredStores.map(store => (
                store.location?.coordinates?.[1] && (
                  <MarkerF
                    key={store._id}
                    position={{ lat: store.location.coordinates[1], lng: store.location.coordinates[0] }}
                    onClick={() => setSelectedStore(store)}
                    icon={{
                      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                      fillColor: selectedStore?._id === store._id ? "#DAAB34" : "#FFFFFF",
                      fillOpacity: 1,
                      strokeColor: "#000000",
                      strokeWeight: 2,
                      scale: 2,
                      anchor: new google.maps.Point(12, 24)
                    }}
                  />
                )
              ))}

              {/* Map UI Overlays */}
              <div className="absolute top-6 right-6 z-10">
                <button className="p-3 bg-white/5 text-white rounded-xl shadow-lg border border-white/10 hover:bg-white/10 transition-all">
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>

              <div className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] text-white/20 border border-white/5 flex items-center gap-2 italic">
                <span>Use ctrl + scroll to zoom the map</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </GoogleMap>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/20 bg-[#0A0A0B]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DAAB34]"></div>
              <p className="mt-4 font-bold uppercase tracking-[2px] text-[11px]">Loading Interactive Map...</p>
            </div>
          )}
        </section>

      </main>

      <Footer />

      {bookingStore && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          store={bookingStore}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .font-playfair { font-family: 'Playfair Display', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}} />
    </div>
  );
};

export default StoreLocator;
