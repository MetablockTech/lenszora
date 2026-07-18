import { motion } from "framer-motion";

interface Specification {
  label: string;
  value: string;
}

interface ProductSpecsProps {
  specifications: Specification[];
}

const ProductSpecs = ({ specifications }: ProductSpecsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="font-playfair text-xl font-semibold text-foreground gold-underline">
        Specifications
      </h3>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="border border-border/50 bg-card overflow-hidden"
      >
        <table className="w-full">
          <tbody>
            {specifications.map((spec, index) => (
              <tr
                key={spec.label}
                className={index % 2 === 0 ? "bg-secondary/30" : "bg-transparent"}
              >
                <td className="py-3 px-3 md:px-4 text-sm text-muted-foreground border-r border-border/30 w-[40%]">
                  {spec.label}
                </td>
                <td className="py-3 px-3 md:px-4 text-sm text-foreground font-medium">
                  {spec.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Warranty Badge */}
      <div className="flex items-center gap-3 p-4 border border-primary/30 bg-primary/5">
        <div className="w-12 h-12 border border-primary/50 rounded-full flex items-center justify-center">
          <span className="text-primary font-playfair font-bold">6M</span>
        </div>
        <div>
          <p className="font-medium text-foreground">6 Months Warranty</p>
          <p className="text-sm text-muted-foreground">Manufacturing defects covered</p>
        </div>
      </div>
    </div>
  );
};

export default ProductSpecs;
