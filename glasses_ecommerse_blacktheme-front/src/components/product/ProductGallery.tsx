import { useState } from "react";
import { motion } from "framer-motion";
import { cn, getImageUrl } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  hideThumbnails?: boolean;
  currentImage?: number;
  onImageChange?: (index: number) => void;
}

const ProductGallery = ({ images, productName, hideThumbnails, currentImage, onImageChange }: ProductGalleryProps) => {
  const [internalIndex, setInternalIndex] = useState(0);

  const selectedImage = currentImage !== undefined ? currentImage : internalIndex;
  const setSelectedImage = (i: number) => {
    setInternalIndex(i);
    onImageChange?.(i);
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full aspect-[4/3] sm:aspect-[16/11] max-w-[650px] mx-auto overflow-hidden bg-gradient-to-b from-slate-900/90 via-slate-900 to-slate-950 border border-slate-800/80 group rounded-2xl shadow-2xl flex items-center justify-center"
      >
        <img
          src={getImageUrl(images[selectedImage] || images[0])}
          alt={`${productName} - View ${selectedImage + 1}`}
          className="w-full h-full object-contain p-2 sm:p-4 scale-105 group-hover:scale-110 transition-transform duration-500"
        />

        {/* Gold corner accents */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-400/40" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-400/40" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-400/40" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-400/40" />

        {/* Studio Badge */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-md border border-amber-400/30 rounded-full text-[10px] font-bold text-amber-400 uppercase tracking-widest pointer-events-none shadow-md">
          HD Studio View
        </div>
      </motion.div>

      {/* Thumbnails — hidden when handled externally */}
      {!hideThumbnails && (
        <div className="flex gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "relative w-20 h-20 overflow-hidden border-2 transition-all duration-300",
                selectedImage === index
                  ? "border-primary"
                  : "border-border/50 hover:border-primary/50"
              )}
            >
              <img
                src={getImageUrl(image)}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {selectedImage === index && (
                <div className="absolute inset-0 bg-primary/10" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
