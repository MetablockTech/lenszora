import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_center,_#1f1f23_0%,_#0d0d0f_75%)] group">
        <AnimatePresence mode="wait">
          <motion.img
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            src={getImageUrl(images[selectedImage] || images[0])}
            alt={`${productName} - View ${selectedImage + 1}`}
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setSelectedImage((selectedImage + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur text-[11px] font-medium text-white/80 pointer-events-none">
              {selectedImage + 1} / {images.length}
            </div>
          </>
        )}
      </div>

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
