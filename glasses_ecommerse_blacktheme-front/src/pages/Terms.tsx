import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { settings } from "@/lib/api";
import { Loader2, FileText } from "lucide-react";

const DEFAULT_TERMS = `
<p className="text-slate-400 mb-6">Last Updated: September 2026</p>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
    <p className="text-slate-300 leading-relaxed">By accessing and placing an order on LensZora, you agree to comply with these Terms & Conditions. Please read them carefully before making a purchase.</p>
</section>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">2. Optical Prescription Accuracy</h2>
    <p className="text-slate-300 mb-3 leading-relaxed">Customers ordering prescription lenses are responsible for providing valid and accurate eye test values. LensZora will manufacture lenses precisely according to the numerical values or prescription images submitted by the customer.</p>
</section>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">3. Pricing & Payments</h2>
    <p className="text-slate-300 leading-relaxed">All product prices on LensZora are displayed inclusive of applicable taxes unless specified otherwise. We reserve the right to modify prices or cancel orders in case of typographical pricing errors.</p>
</section>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">4. Shipping & Delivery</h2>
    <p className="text-slate-300 leading-relaxed">Orders are dispatched after optical fitting and quality verification. Delivery timelines may vary based on pin code accessibility and prescription customization requirements.</p>
</section>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">5. Returns & Warranty</h2>
    <p className="text-slate-300 leading-relaxed">Frame damage and lens manufacturing defects are covered under LensZora warranty policies. Returns must meet our return criteria as detailed in the Return Policy.</p>
</section>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">6. Customer Support</h2>
    <p className="text-slate-300 leading-relaxed">For any queries, contact our support desk at <a href="mailto:support@lenszora.com" className="text-[#DAAB34] underline font-semibold">support@lenszora.com</a>.</p>
</section>
`;

export default function TermsPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTerms() {
      try {
        const res = await settings.get("terms_and_conditions");
        if (res && res.value) {
          setContent(res.value);
        } else {
          setContent(DEFAULT_TERMS);
        }
      } catch (err) {
        setContent(DEFAULT_TERMS);
      } finally {
        setLoading(false);
      }
    }
    loadTerms();
  }, []);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="p-3 rounded-2xl bg-[#DAAB34]/10 border border-[#DAAB34]/30 text-[#DAAB34]">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Terms & Conditions</h1>
            <p className="text-sm text-slate-400">LensZora Customer Terms of Service & Store Policies</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#DAAB34]" />
            <p className="text-sm text-slate-400">Loading Terms & Conditions...</p>
          </div>
        ) : (
          <div 
            className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm prose prose-invert max-w-none text-slate-200 leading-relaxed text-sm sm:text-base font-normal space-y-6"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
