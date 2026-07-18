import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import TopCategories from "@/components/sections/TopCategories";
import OfferBanner from "@/components/sections/OfferBanner";
import TrendingBanners from "@/components/sections/TrendingBanners";
import ShapeSelection from "@/components/sections/ShapeSelection";
import CategoryProductSliders from "@/components/sections/CategoryProductSliders";
import NewArrivals from "@/components/sections/NewArrivals";
import TrustSection from "@/components/sections/TrustSection";
import Testimonials from "@/components/sections/Testimonials";
import EyeCheckupSection from "@/components/sections/EyeCheckupSection";
import FAQSection from "@/components/sections/FAQSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="space-y-0">
        <HeroSection />
        <TopCategories />
        <OfferBanner />
        <ShapeSelection type="eyeglasses" title="Get the perfect shape - Eyeglasses" />
        <TrendingBanners />
        <ShapeSelection type="sunglasses" title="Get the perfect shape - Sunglasses" />
        
        <div className="bg-background py-6 lg:py-12 border-t border-white/5">
           <CategoryProductSliders />
        </div>
        
        <NewArrivals />
        <EyeCheckupSection />
        <Testimonials />
        <FAQSection />
        <TrustSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
