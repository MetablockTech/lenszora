import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSettings } from "@/context/SettingsContext";
import { PhoneCall, MessageSquare, Mail, MapPin, Headphones, ArrowRight, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Support: React.FC = () => {
  const { settings } = useSettings();
  const contactInfo = settings.contactInfo || {};
  const rawPhone = contactInfo.phone || "+919876543210";
  const formattedPhone = rawPhone.replace(/\D/g, "");
  const email = contactInfo.email || "support@lenszora.com";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Headphones className="w-3.5 h-3.5" /> 24/7 Customer Support
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Customer Support & Assistance
          </h1>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Choose your preferred way to connect with our support team or AI Agent for instant help with orders, eyewear prescriptions, returns, and inquiries.
          </p>
        </div>

        {/* Primary Support Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Card 1: Agent Calling / Voice Support */}
          <div className="relative group bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/15 transition-all"></div>
            <div>
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#DAAB34] mb-6 shadow-inner">
                <PhoneCall className="w-8 h-8 animate-pulse" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                Voice Agent & Phone Support
              </span>
              <h2 className="text-2xl font-bold text-white mt-3 mb-3">
                Call Support / AI Agent
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Connect directly with our AI Voice Agent & Dedicated Helpline for immediate assistance regarding product details, order status, or eyewear consultations.
              </p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Phone Helpline</div>
                  <div className="text-white font-mono font-bold text-base mt-0.5">{rawPhone}</div>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  Available Now
                </span>
              </div>
            </div>

            <a
              href={`tel:${rawPhone}`}
              className="w-full inline-flex items-center justify-center gap-3 bg-[#DAAB34] hover:bg-[#c29528] text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 text-sm uppercase tracking-wider"
            >
              <PhoneCall className="w-4 h-4" />
              Call Support Now
            </a>
          </div>

          {/* Card 2: WhatsApp Live Support */}
          <div className="relative group bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-all"></div>
            <div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-inner">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                Instant Chat Support
              </span>
              <h2 className="text-2xl font-bold text-white mt-3 mb-3">
                WhatsApp Support
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Start a live chat on WhatsApp with our customer service team. Send prescription photos, ask product questions, or request order updates.
              </p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">WhatsApp Number</div>
                  <div className="text-white font-mono font-bold text-base mt-0.5">+{formattedPhone}</div>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  Fast Response
                </span>
              </div>
            </div>

            <a
              href={`https://wa.me/${formattedPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 text-sm uppercase tracking-wider"
            >
              <MessageSquare className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Secondary Info & Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-xl flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">Email Support</h3>
              <p className="text-slate-400 text-xs mb-2">Send us your inquiry via email</p>
              <a href={`mailto:${email}`} className="text-blue-400 hover:underline text-xs font-mono">
                {email}
              </a>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-xl flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">Frequently Asked Questions</h3>
              <p className="text-slate-400 text-xs mb-2">Find quick answers to common questions</p>
              <Link to="/faq" className="text-purple-400 hover:underline text-xs font-semibold inline-flex items-center gap-1">
                View FAQs <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-xl flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">Store Locator</h3>
              <p className="text-slate-400 text-xs mb-2">Visit our physical eyewear stores</p>
              <Link to="/store-locator" className="text-amber-400 hover:underline text-xs font-semibold inline-flex items-center gap-1">
                Locate Store <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
