import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { brands, API_URL } from "@/lib/api";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const BrandsSection = () => {
    const [brandList, setBrandList] = useState<any[]>([]);
    const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 3000 })]);

    useEffect(() => {
        fetchBrands();
    }, []);

    async function fetchBrands() {
        try {
            const data = await brands.list();
            setBrandList(data);
        } catch (error) {
            console.error("Failed to fetch brands:", error);
        }
    }

    if (brandList.length === 0) return null;

    return (
        <section className="py-8 bg-background/50 overflow-hidden border-y border-border/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-sm font-semibold tracking-wider text-primary uppercase">Elite Partners</h2>
                    <p className="text-2xl font-playfair mt-2">Our Premium <span className="gold-gradient-text">Brands</span></p>
                </div>

                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex items-center">
                        {brandList.map((brand) => (
                            <div key={brand._id} className="flex-[0_0_200px] min-w-0 px-8 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 cursor-pointer">
                                {brand.logo ? (
                                    <img 
                                        src={brand.logo.startsWith('http') ? brand.logo : `${API_URL}${brand.logo}`} 
                                        alt={brand.name} 
                                        className="h-12 object-contain mx-auto" 
                                    />
                                ) : (
                                    <span className="text-xl font-bold text-slate-500 italic uppercase">{brand.name}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BrandsSection;
