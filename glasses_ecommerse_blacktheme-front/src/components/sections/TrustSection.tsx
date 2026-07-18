import { motion } from "framer-motion";
import { Shield, Truck, RefreshCw, CreditCard, Award, Headphones } from "lucide-react";

const trustBadges = [
  {
    icon: Shield,
    title: "Premium Quality",
    description: "100% authentic products",
  },
  {
    icon: Award,
    title: "Certified Products",
    description: "Verified authenticity",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above ₹999",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "Upto 14-day return policy",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "100% Secure Transaction",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Always here to help",
  },
];

const TrustSection = () => {
  return (
    <section className="pt-16 pb-8 bg-background border-y border-border/30">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {trustBadges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="text-center group"
            >
              <div className="w-12 h-12 mx-auto mb-3 border border-primary/30 rounded-full flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                <badge.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium text-foreground text-sm mb-1">{badge.title}</h4>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
