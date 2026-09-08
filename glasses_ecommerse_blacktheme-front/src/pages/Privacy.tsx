import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { settings } from "@/lib/api";
import { Loader2, ShieldCheck } from "lucide-react";

export const DEFAULT_PRIVACY_POLICY = `Last Updated: September 2026

1. Information We Collect
At LensZora, we prioritize your privacy and are committed to protecting your personal information. When you use our platform, we collect:
• Personal Information: Full name, email address, phone number, and delivery addresses.
• Optical & Eye Power Details: Prescription values (SPH, CYL, AXIS, ADD, PD) and uploaded prescription documents/photos.
• Payment Details: Encrypted payment metadata (transactions processed securely via PCI-DSS compliant payment gateways).
• Usage & Device Data: IP address, browser type, and interactions with our store.

2. How We Use Your Data
Your data enables us to provide a seamless optical shopping experience, including:
• Custom crafting and quality testing your prescription optical lenses.
• Processing payments and fulfilling orders accurately.
• Providing real-time order updates via SMS, WhatsApp, and Email.
• Continuous optimization of user interface and store recommendations.

3. Prescription Data Security
All uploaded eye test prescriptions and manual power entries are strictly accessible only by authorized optical technicians and stored with AES-256 encryption.

4. Third-Party Services
We share necessary order details only with verified logistics partners (couriers) and certified payment processors. We NEVER sell or rent your personal information to third-party advertisers.

5. Contact Us Regarding Privacy
If you have any questions or data requests, contact our privacy team at support@lenszora.com.`;

export function renderFormattedPolicy(rawText: string) {
  if (!rawText) return null;

  // If text already contains explicit HTML tags like <section> or <h2> or <p>, render via dangerouslySetInnerHTML
  if (/<[a-z][\s\S]*>/i.test(rawText)) {
    const cleanedHtml = rawText.replace(/className=/g, 'class=');
    return <div dangerouslySetInnerHTML={{ __html: cleanedHtml }} />;
  }

  // Parse plain text into sections, headings, bullet points
  const lines = rawText.split('\n');
  return (
    <div className="space-y-4 text-slate-300 leading-relaxed text-sm sm:text-base">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Check if heading (starts with digit followed by dot e.g. "1. Information We Collect" or Last Updated)
        if (/^\d+\.\s+/.test(trimmed) || /^Last Updated:/i.test(trimmed)) {
          if (/^Last Updated:/i.test(trimmed)) {
            return <p key={index} className="text-slate-400 font-semibold mb-4">{trimmed}</p>;
          }
          return (
            <h2 key={index} className="text-xl font-bold text-white mt-6 mb-2 border-b border-white/10 pb-2">
              {trimmed}
            </h2>
          );
        }

        // Check if bullet point (starts with • or - or *)
        if (/^[•\-\*]\s+/.test(trimmed)) {
          const bulletContent = trimmed.replace(/^[•\-\*]\s+/, '');
          return (
            <li key={index} className="ml-4 list-disc text-slate-300 pl-1 my-1">
              {bulletContent}
            </li>
          );
        }

        // Regular paragraph
        return <p key={index} className="text-slate-300">{trimmed}</p>;
      })}
    </div>
  );
}

export default function PrivacyPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPrivacy() {
      try {
        const res = await settings.get("privacy_policy");
        if (res && res.value && res.value.trim().length > 0) {
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
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
            {renderFormattedPolicy(content)}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
