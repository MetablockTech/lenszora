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
    <div className="space-y-4">
      {/* Main Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative aspect-square max-w-[500px] mx-auto overflow-hidden bg-gradient-to-br from-secondary/30 to-muted/30 border border-border/50 group rounded-2xl shadow-xl"
      >
        <img
          src={getImageUrl(images[selectedImage] || images[0])}
          alt={`${productName} - View ${selectedImage + 1}`}
          className="w-full h-full object-contain p-3 transition-all duration-500"
        />

        {/* Gold corner accents */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/30" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/30" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/30" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/30" />
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
