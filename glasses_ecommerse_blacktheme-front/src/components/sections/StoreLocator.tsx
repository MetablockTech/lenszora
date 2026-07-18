import { motion } from "framer-motion";
import { MapPin, Phone, Clock } from "lucide-react";

const stores = [
  {
    name: "LensZora - Connaught Place",
    address: "123 Fashion Street, Block M, Connaught Place, New Delhi - 110001",
    phone: "+91 98765 43210",
    hours: "10:00 AM - 9:00 PM",
  },
  {
    name: "LensZora - South Extension",
    address: "456 Ring Road, South Extension Part II, New Delhi - 110049",
    phone: "+91 98765 43211",
    hours: "10:00 AM - 9:00 PM",
  },
  {
    name: "LensZora - Gurugram",
    address: "789 MG Road, DLF Phase 2, Gurugram, Haryana - 122002",
    phone: "+91 98765 43212",
    hours: "11:00 AM - 10:00 PM",
  },
];

const StoreLocator = () => {
  return (
    <section id="store-locator" className="pt-8 pb-16 bg-background">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="section-heading mb-4">
            Visit Our <span className="gold-gradient-text">Stores</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience our premium collection in person at any of our exclusive stores
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {stores.map((store, index) => (
            <motion.div
              key={store.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="premium-card p-6 group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 border border-primary/30 rounded-full flex items-center justify-center flex-shrink-0 group-hover:border-primary group-hover:bg-primary/10 transition-all">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-playfair text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {store.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {store.address}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pl-14">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{store.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{store.hours}</span>
                </div>
              </div>

              <div className="mt-6 pl-14">
                <a
                  href="#"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  View on Map →
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoreLocator;
