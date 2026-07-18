import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Monitor, Sparkles, Sun, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface LensOption {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ElementType;
  recommended?: boolean;
}

const lensOptions: LensOption[] = [
  {
    id: "zero-power",
    name: "Zero Power",
    description: "Clear lenses without prescription",
    price: 0,
    icon: Eye,
  },
  {
    id: "blue-cut",
    name: "Blue Cut",
    description: "Block harmful blue light from screens",
    price: 499,
    icon: Monitor,
    recommended: true,
  },
  {
    id: "powered",
    name: "Powered Lenses",
    description: "Custom prescription lenses",
    price: 799,
    icon: Sparkles,
  },
  {
    id: "photochromatic",
    name: "Photochromatic",
    description: "Adapt to light conditions automatically",
    price: 1299,
    icon: Sun,
  },
];

interface LensSelectorProps {
  selectedLens: string;
  onSelectLens: (lensId: string) => void;
  onUploadPrescription?: () => void;
}

const LensSelector = ({ selectedLens, onSelectLens, onUploadPrescription }: LensSelectorProps) => {
  const [showPrescription, setShowPrescription] = useState(false);

  const handleSelect = (lensId: string) => {
    onSelectLens(lensId);
    setShowPrescription(lensId === "powered");
  };

  return (
    <div className="space-y-4">
      <h3 className="font-playfair text-lg font-semibold text-foreground">
        Choose Your <span className="text-primary">Lens</span>
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {lensOptions.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative p-4 text-left border transition-all duration-300",
              selectedLens === option.id
                ? "border-primary bg-primary/10"
                : "border-border/50 hover:border-primary/50 bg-card"
            )}
          >
            {option.recommended && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5">
                Recommended
              </span>
            )}

            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full border flex items-center justify-center transition-colors",
                selectedLens === option.id
                  ? "border-primary bg-primary/20"
                  : "border-border/50"
              )}>
                <option.icon className={cn(
                  "h-5 w-5",
                  selectedLens === option.id ? "text-primary" : "text-muted-foreground"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm",
                    selectedLens === option.id ? "text-primary" : "text-foreground"
                  )}>
                    {option.name}
                  </span>
                  {selectedLens === option.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {option.description}
                </p>
                <p className="text-sm font-medium text-primary mt-1">
                  {option.price === 0 ? "Free" : `+₹${option.price}`}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Prescription Upload Section */}
      {showPrescription && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 border border-primary/30 bg-primary/5"
        >
          <h4 className="font-medium text-sm mb-3">Upload Your Prescription</h4>
          <div className="flex gap-3">
            <button
              onClick={onUploadPrescription}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-primary/50 hover:border-primary hover:bg-primary/10 transition-all text-sm"
            >
              <Upload className="h-4 w-4" />
              Upload File
            </button>
            <button className="flex-1 py-3 border border-border/50 hover:border-primary/50 transition-all text-sm">
              Enter Manually
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Accepted formats: JPG, PNG, PDF (Max 5MB)
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default LensSelector;
