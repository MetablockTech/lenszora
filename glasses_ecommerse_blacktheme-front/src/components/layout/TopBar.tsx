import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

const TopBar = () => {
  const { settings } = useSettings();
  const [phone, setPhone] = useState('+91 98765 43210');

  useEffect(() => {
    loadContactInfo();
  }, []);

  async function loadContactInfo() {
    try {
      const res = await fetch(`${API_URL}/api/settings/contact_info`);
      if (res.ok) {
        const data = await res.json();
        if (data.value && data.value.phone) {
          setPhone(data.value.phone);
        }
      }
    } catch (error) {
      console.error('Failed to load contact info:', error);
    }
  }

  const playStoreUrl = settings?.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.lenszora.app';

  return (
    <div className="bg-black border-b border-white/10 py-2">
      <div className="container mx-auto flex items-center justify-between text-sm px-4">
        <div className="flex items-center gap-6">
          <span className="text-slate-300">
            Free Shipping | Easy Returns | <span className="text-gold">Nationwide Delivery</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a 
            href={playStoreUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 text-slate-300 hover:text-gold transition-colors group cursor-pointer"
          >
            <svg className="h-4 w-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a2.372 2.372 0 0 1-.61-1.614V3.428c0-.623.224-1.196.609-1.614z" fill="#00E676"/>
              <path d="M17.438 8.354l-3.646 3.646 3.646 3.646 4.14-2.366c.866-.495.866-1.966 0-2.461l-4.14-2.465z" fill="#FFD54F"/>
              <path d="M3.61 1.814l10.182 10.186L17.438 8.354 5.922 1.785A2.35 2.35 0 0 0 3.61 1.814z" fill="#FF1744"/>
              <path d="M3.61 22.186a2.35 2.35 0 0 0 2.312-.029l11.516-6.569-3.646-3.646L3.61 22.186z" fill="#2979FF"/>
            </svg>
            <span className="font-semibold text-xs uppercase tracking-wider text-slate-200 group-hover:text-gold">Get App on Play Store</span>
          </a>
          <div className="flex items-center gap-2 text-gold">
            <Phone className="h-4 w-4" />
            <span className="font-medium">{phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
