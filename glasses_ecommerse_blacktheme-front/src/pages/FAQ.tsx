import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FAQSection from "@/components/sections/FAQSection";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Header />
        <main className="py-8">
          <FAQSection />
        </main>
      </div>
      <Footer />
    </div>
  );
}
