import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const PremiumBanner = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden border border-primary/30"
        >
          {/* Main Content */}
          <div className="grid lg:grid-cols-2 min-h-[400px]">
            {/* Left - Image Area */}
            <div className="relative bg-gradient-to-br from-secondary to-muted flex items-center justify-center p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(43,69%,53%,0.1),transparent_50%)]" />
              <div className="relative text-center">
                <div className="w-48 h-48 border-2 border-primary/50 rounded-full mx-auto flex items-center justify-center animate-pulse-gold">
                  <span className="font-playfair text-4xl font-bold gold-gradient-text">GOLD</span>
                </div>
                <p className="text-muted-foreground mt-4">Luxury Series</p>
              </div>
            </div>

            {/* Right - Content */}
            <div className="bg-background p-12 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <p className="text-primary font-medium tracking-widest mb-4">
                  THE EXCLUSIVE COLLECTION
                </p>
                <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
                  Black & Gold{" "}
                  <span className="gold-gradient-text">Luxury Series</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-md">
                  Handcrafted titanium frames with 18K gold accents. 
                  For those who appreciate the finer things in life.
                </p>

                <div className="flex flex-wrap gap-4">
                  <a href="#" className="btn-gold flex items-center gap-2 group">
                    Explore Collection
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>

                {/* Features */}
                <div className="mt-10 flex gap-8">
                  {[
                    { label: "18K Gold", desc: "Accents" },
                    { label: "Titanium", desc: "Frame" },
                    { label: "Limited", desc: "Edition" },
                  ].map((feat) => (
                    <div key={feat.label} className="text-center">
                      <p className="font-playfair text-xl font-semibold text-primary">{feat.label}</p>
                      <p className="text-sm text-muted-foreground">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Decorative corner elements */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-primary/50" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-primary/50" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-primary/50" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-primary/50" />
        </motion.div>
      </div>
    </section>
  );
};

export default PremiumBanner;
