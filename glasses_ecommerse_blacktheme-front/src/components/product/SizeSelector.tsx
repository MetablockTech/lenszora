import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface Size {
  id: string;
  label: string;
  lensWidth: string;
  bridgeWidth: string;
  templeLength: string;
}

const sizes: Size[] = [
  { id: "small", label: "Small", lensWidth: "48mm", bridgeWidth: "18mm", templeLength: "140mm" },
  { id: "medium", label: "Medium", lensWidth: "52mm", bridgeWidth: "20mm", templeLength: "145mm" },
  { id: "large", label: "Large", lensWidth: "56mm", bridgeWidth: "22mm", templeLength: "150mm" },
];

interface SizeSelectorProps {
  selectedSize: string;
  onSelectSize: (sizeId: string) => void;
}

const SizeSelector = ({ selectedSize, onSelectSize }: SizeSelectorProps) => {
  const [showGuide, setShowGuide] = useState(false);
  const currentSize = sizes.find(s => s.id === selectedSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-playfair text-lg font-semibold text-foreground">
          Select <span className="text-primary">Size</span>
        </h3>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Info className="h-4 w-4" />
          Size Guide
        </button>
      </div>

      {/* Size Buttons */}
      <div className="flex gap-3">
        {sizes.map((size) => (
          <motion.button
            key={size.id}
            onClick={() => onSelectSize(size.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex-1 py-3 px-4 border text-center transition-all duration-300",
              selectedSize === size.id
                ? "border-primary bg-primary text-primary-foreground font-medium"
                : "border-border/50 hover:border-primary/50 text-foreground"
            )}
          >
            {size.label}
          </motion.button>
        ))}
      </div>

      {/* Current Size Info */}
      {currentSize && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Lens: <span className="text-foreground">{currentSize.lensWidth}</span></span>
          <span>Bridge: <span className="text-foreground">{currentSize.bridgeWidth}</span></span>
          <span>Temple: <span className="text-foreground">{currentSize.templeLength}</span></span>
        </div>
      )}

      {/* Size Guide Modal */}
      {showGuide && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 border border-border/50 bg-card"
        >
          <h4 className="font-medium mb-3">Frame Size Guide</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">Small</p>
              <p className="font-medium">Narrow Face</p>
              <p className="text-xs text-muted-foreground mt-1">Face width &lt; 130mm</p>
            </div>
            <div className="text-center p-3 bg-secondary/50 border border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">Medium</p>
              <p className="font-medium">Average Face</p>
              <p className="text-xs text-muted-foreground mt-1">Face width 130-145mm</p>
            </div>
            <div className="text-center p-3 bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">Large</p>
              <p className="font-medium">Wide Face</p>
              <p className="text-xs text-muted-foreground mt-1">Face width &gt; 145mm</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Tip: Measure the width of your face from temple to temple for the best fit.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default SizeSelector;
