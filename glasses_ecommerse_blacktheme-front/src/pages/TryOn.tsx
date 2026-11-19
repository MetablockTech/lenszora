import { Link } from "react-router-dom";
import { Scan, Sparkles } from "lucide-react";
import Header from "@/components/layout/Header";

// AR Try On (bottom nav): placeholder until virtual try-on launches. App-style screen, no site footer.
const TryOn = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto flex max-w-md flex-col items-center px-6 pb-28 pt-16 text-center md:pb-16">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[#DAAB34]/20 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#DAAB34]/40 bg-[#DAAB34]/10">
          <Scan className="h-11 w-11 text-[#DAAB34]" />
        </div>
      </div>
      <span className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-[#DAAB34]/40 bg-[#DAAB34]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#DAAB34]">
        <Sparkles className="h-3.5 w-3.5" /> Coming Soon
      </span>
      <h1 className="mt-4 font-playfair text-3xl font-bold text-white">AR Try On</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-400">
        Try frames on your face using your phone camera. We're putting the finishing touches on it — it's coming soon.
      </p>
      <Link
        to="/shop"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#DAAB34] px-8 text-sm font-bold text-black"
      >
        Browse Frames
      </Link>
    </main>
  </div>
);

export default TryOn;
