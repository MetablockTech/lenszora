import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { settings } from "@/lib/api";
import { Loader2, ShieldCheck } from "lucide-react";

const DEFAULT_PRIVACY_POLICY = `
<p className="text-slate-400 mb-6">Last Updated: September 2026</p>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
    <p className="text-slate-300 mb-3 leading-relaxed">At LensZora, we prioritize your privacy and are committed to protecting your personal information. When you use our platform, we collect:</p>
    <ul className="list-disc list-inside text-slate-300 space-y-2 pl-2">
        <li><strong>Personal Information:</strong> Full name, email address, phone number, and delivery addresses.</li>
        <li><strong>Optical & Eye Power Details:</strong> Prescription values (SPH, CYL, AXIS, ADD, PD) and uploaded prescription documents/photos.</li>
        <li><strong>Payment Details:</strong> Encrypted payment metadata (transactions processed securely via PCI-DSS compliant payment gateways).</li>
        <li><strong>Usage & Device Data:</strong> IP address, browser type, and interactions with our store.</li>
    </ul>
</section>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Data</h2>
    <p className="text-slate-300 mb-3 leading-relaxed">Your data enables us to provide a seamless optical shopping experience, including:</p>
    <ul className="list-disc list-inside text-slate-300 space-y-2 pl-2">
        <li>Custom crafting and quality testing your prescription optical lenses.</li>
        <li>Processing payments and fulfilling orders accurately.</li>
        <li>Providing real-time order updates via SMS, WhatsApp, and Email.</li>
        <li>Continuous optimization of user interface and store recommendations.</li>
    </ul>
</section>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">3. Prescription Data Security</h2>
    <p className="text-slate-300 leading-relaxed">All uploaded eye test prescriptions and manual power entries are strictly accessible only by authorized optical technicians and stored with AES-256 encryption.</p>
</section>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">4. Third-Party Services</h2>
    <p className="text-slate-300 leading-relaxed">We share necessary order details only with verified logistics partners (couriers) and certified payment processors. We NEVER sell or rent your personal information to third-party advertisers.</p>
</section>

<section className="mb-8">
    <h2 className="text-xl font-bold text-white mb-3">5. Contact Us Regarding Privacy</h2>
    <p className="text-slate-300 leading-relaxed">If you have any questions or data requests, contact our privacy team at <a href="mailto:support@lenszora.com" className="text-[#DAAB34] underline font-semibold">support@lenszora.com</a>.</p>
</section>
`;

export default function PrivacyPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPrivacy() {
      try {
        const res = await settings.get("privacy_policy");
        if (res && res.value) {
          setContent(res.value);
        } else {
          setContent(DEFAULT_PRIVACY_POLICY);
        }
      } catch (err) {
        setContent(DEFAULT_PRIVACY_POLICY);
      } finally {
        setLoading(false);
      }
    }
    loadPrivacy();
  }, []);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="p-3 rounded-2xl bg-[#DAAB34]/10 border border-[#DAAB34]/30 text-[#DAAB34]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-slate-400">LensZora Customer Data Protection & Privacy Terms</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#DAAB34]" />
            <p className="text-sm text-slate-400">Loading Privacy Policy...</p>
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
