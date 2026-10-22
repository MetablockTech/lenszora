import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { getProductImage, calculateProductDiscount } from "@/lib/utils";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface Product {
    _id: string;
    title: string;
    images: string[];
    price: number;
    salePrice?: number;
    category?: any;
    brand?: any;
    colors?: string[];
    eyewearDetails?: {
        frameMaterial?: string;
        frameType?: string;
        frameShape?: string;
        frameColor?: string;
        glassColor?: string;
        polarized?: boolean;
        gender?: string;
        frameSize?: string;
    };
}

interface ProductSliderProps {
    title: string;
    subtitle?: string;
    products: Product[];
    viewAllLink?: string;
    viewAllText?: string;
}

const ProductSlider: React.FC<ProductSliderProps> = ({
    title,
    subtitle,
    products,
    viewAllLink = "/shop",
    viewAllText = "Explore more"
}) => {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            align: 'start',
            loop: true,
            dragFree: true,
            containScroll: 'trimSnaps'
        },
        [Autoplay({ delay: 4000, stopOnInteraction: true })]
    );

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanScrollLeft(emblaApi.canScrollPrev());
        setCanScrollRight(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    return (
        <div className="relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-playfair mb-2 text-white"
                    >
                        {title}
                    </motion.h2>
                    {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
                </div>

                <Link
                    to={viewAllLink}
                    className="hidden md:flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium"
                >
                    {viewAllText} <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Slider */}
            <div className="relative group">
                {/* Navigation Buttons */}
                <button
                    onClick={scrollPrev}
                    className={`absolute left-2 top-[38%] -translate-y-1/2 z-10 bg-black/70 hover:bg-black backdrop-blur text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:block border border-white/15 ${!canScrollLeft ? 'pointer-events-none opacity-0' : ''}`}
                    aria-label="Previous"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                    onClick={scrollNext}
                    className={`absolute right-2 top-[38%] -translate-y-1/2 z-10 bg-black/70 hover:bg-black backdrop-blur text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:block border border-white/15 ${!canScrollRight ? 'pointer-events-none opacity-0' : ''}`}
                    aria-label="Next"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Products Container */}
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex -ml-4">
                        {products.map((product) => (
                            <div
                                key={product._id}
                                className="flex-[0_0_auto] w-56 sm:w-64 md:w-72 pl-4"
                            >
                                <Link
                                    to={`/product/${product._id}`}
                                    className="block group/card h-full"
                                >
                                    {(() => {
                                        const calc = calculateProductDiscount(product);
                                        const brandName = product.brand ? (typeof product.brand === 'string' ? product.brand : product.brand.name) : '';
                                        // One short spec line, without repeating the same word (e.g. category "Women" + gender "Women")
                                        const specs = [product.eyewearDetails?.frameShape, product.eyewearDetails?.frameMaterial, product.eyewearDetails?.gender]
                                            .filter((v): v is string => !!v)
                                            .filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i);
                                        return (
                                            <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-amber-400/50 hover:shadow-[0_8px_30px_rgba(218,171,52,0.12)]">
                                                {/* Image fills the top of the card edge to edge */}
                                                <div className="relative aspect-[4/3] overflow-hidden bg-[#0d0d0f]">
                                                    <img
                                                        src={getProductImage(product)}
                                                        alt={product.title}
                                                        loading="lazy"
                                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                                                    />
                                                    {calc.hasDiscount && (
                                                        <span className="absolute top-2.5 left-2.5 rounded-md bg-red-600/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                                                            {calc.discountLabel}
                                                        </span>
                                                    )}
                                                    {product.eyewearDetails?.polarized && (
                                                        <span className="absolute top-2.5 right-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur">
                                                            Polarized
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-1 flex-col p-3.5">
                                                    {brandName && (
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400/90 truncate">{brandName}</p>
                                                    )}
                                                    <h3 className="mt-0.5 text-sm font-bold text-white line-clamp-1 transition-colors group-hover/card:text-amber-400">
                                                        {product.title}
                                                    </h3>
                                                    {specs.length > 0 && (
                                                        <p className="mt-1 text-[11px] text-slate-400 truncate capitalize">{specs.join(' · ').toLowerCase()}</p>
                                                    )}

                                                    <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                                                        <div className="flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden">
                                                            <span className={`text-base font-extrabold ${calc.hasDiscount ? 'text-amber-400' : 'text-white'}`}>
                                                                ₹{calc.sellingPrice.toLocaleString()}
                                                            </span>
                                                            {calc.hasDiscount && (
                                                                <span className="text-xs text-slate-500 line-through">₹{calc.mrpPrice.toLocaleString()}</span>
                                                            )}
                                                        </div>
                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors group-hover/card:bg-amber-400 group-hover/card:text-slate-950">
                                                            <ArrowRight className="h-4 w-4" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile View All Link */}
            <Link
                to={viewAllLink}
                className="md:hidden flex items-center justify-center gap-2 text-primary hover:gap-3 transition-all font-medium mt-4"
            >
                {viewAllText} <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
};

export default ProductSlider;
