import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { getImageUrl, getProductImage } from "@/lib/utils";
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

                <a
                    href={viewAllLink}
                    className="hidden md:flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium"
                >
                    {viewAllText} <ArrowRight className="w-4 h-4" />
                </a>
            </div>

            {/* Slider */}
            <div className="relative group">
                {/* Navigation Buttons */}
                <button
                    onClick={scrollPrev}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 hidden md:block border border-white/10 ${!canScrollLeft ? 'pointer-events-none opacity-0' : ''}`}
                    aria-label="Previous"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                    onClick={scrollNext}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 hidden md:block border border-white/10 ${!canScrollRight ? 'pointer-events-none opacity-0' : ''}`}
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
                                className="flex-[0_0_auto] w-52 md:w-60 pl-4"
                            >
                                <a
                                    href={`/product/${product._id}`}
                                    className="block group/card h-full"
                                >
                                    <div className="bg-slate-900/40 rounded-xl overflow-hidden border border-slate-800 hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
                                        {/* Product Image */}
                                        <div className="relative aspect-[4/5] overflow-hidden bg-slate-800">
                                            <img
                                                src={getProductImage(product)}
                                                alt={product.title}
                                                className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                                            />
                                            {product.salePrice && product.price > product.salePrice && (
                                                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                                    Save {Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                                </div>
                                            )}
                                            {product.eyewearDetails?.polarized && (
                                                <div className="absolute top-2 right-2 bg-primary/90 text-black px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                                    Polarized
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-3 flex-grow flex flex-col">
                                            <h3 className="text-sm font-medium text-white mb-1 line-clamp-1 group-hover/card:text-primary transition-colors">
                                                {product.title}
                                            </h3>

                                            {/* Specs Pills */}
                                            <div className="flex flex-wrap gap-x-1.5 gap-y-1 mb-3">
                                                {product.brand && (
                                                    <span className="text-[9px] font-bold text-primary border border-primary/30 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                        {typeof product.brand === 'string' ? product.brand : product.brand.name}
                                                    </span>
                                                )}

                                                {product.category && (
                                                    <span className="text-[9px] text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded uppercase font-medium">
                                                        {typeof product.category === 'string' ? product.category : product.category.name}
                                                    </span>
                                                )}

                                                {product.eyewearDetails?.gender && (
                                                    <span className="text-[9px] text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded">
                                                        {product.eyewearDetails.gender}
                                                    </span>
                                                )}

                                                {product.eyewearDetails?.frameMaterial && (
                                                    <span className="text-[9px] text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded">
                                                        {product.eyewearDetails.frameMaterial}
                                                    </span>
                                                )}

                                                {product.eyewearDetails?.frameShape && (
                                                    <span className="text-[9px] text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded">
                                                        {product.eyewearDetails.frameShape}
                                                    </span>
                                                )}

                                                {(product.eyewearDetails?.frameColor || product.eyewearDetails?.glassColor) && (
                                                    <span className="text-[9px] text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded">
                                                        {product.eyewearDetails.glassColor || product.eyewearDetails.frameColor}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-auto flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    {product.salePrice && product.salePrice < product.price ? (
                                                        <>
                                                            <span className="text-base font-bold text-primary">
                                                                ₹{product.salePrice.toLocaleString()}
                                                            </span>
                                                            <span className="text-xs text-slate-500 line-through">
                                                                ₹{product.price.toLocaleString()}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-base font-bold text-white">
                                                            ₹{product.price.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover/card:bg-primary transition-colors">
                                                    <ArrowRight className="w-4 h-4 text-white group-hover/card:text-black" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile View All Link */}
            <a
                href={viewAllLink}
                className="md:hidden flex items-center justify-center gap-2 text-primary hover:gap-3 transition-all font-medium mt-4"
            >
                {viewAllText} <ArrowRight className="w-4 h-4" />
            </a>
        </div>
    );
};

export default ProductSlider;
