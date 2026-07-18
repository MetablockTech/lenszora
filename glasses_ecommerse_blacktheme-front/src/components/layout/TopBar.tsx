import { useState, useEffect } from "react";
import { Phone, Download } from "lucide-react";
import { API_URL } from "@/lib/api";

const TopBar = () => {
  const [phone, setPhone] = useState('+91 98765 43210')

  useEffect(() => {
    loadContactInfo()
  }, [])

  async function loadContactInfo() {
    try {
      const res = await fetch(`${API_URL}/api/settings/contact_info`)
      if (res.ok) {
        const data = await res.json()
        if (data.value && data.value.phone) {
          setPhone(data.value.phone)
        }
      }
    } catch (error) {
      console.error('Failed to load contact info:', error)
    }
  }

  return (
    <div className="bg-black border-b border-white/10 py-2">
      <div className="container mx-auto flex items-center justify-between text-sm px-4">
        <div className="flex items-center gap-6">
          <span className="text-slate-300">
            Free Shipping | Easy Returns | <span className="text-gold">Nationwide Delivery</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="/LensZora.apk" download="LensZora.apk" className="flex items-center gap-2 text-slate-300 hover:text-gold transition-colors">
            <Download className="h-4 w-4" />
            <span>Download App</span>
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
