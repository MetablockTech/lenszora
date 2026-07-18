import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const checkupOptions = [
  {
    title: "Visit Nearest Store",
    description: "Walk in for popular Glasses",
    image: "/images/sections/nearest_store.png",
    link: "/store-locator"
  },
  {
    title: "Schedule at Store",
    description: "Try 1000+ frames",
    image: "/images/sections/schedule_at_home.png",
    link: "/store-locator"
  },
  {
    title: "Take an quick Eye Test",
    description: "Anytime, anywhere",
    image: "/images/sections/online_eye_test.png",
    link: "/store-locator"
  }
];

const EyeCheckupSection = () => {
  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Heading */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white font-playfair tracking-tight">
            Get a <span className="text-[#DAAB34]">FREE</span> Eye Check Up
          </h2>
          <div className="h-1 w-20 bg-[#DAAB34] mt-4 rounded-full" />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {checkupOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative bg-[#F8F9FA] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(218,171,52,0.15)] flex flex-col"
            >
              {/* Image Container */}
              <div className="relative h-[320px] overflow-hidden">
                <img
                  src={option.image}
                  alt={option.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Overlay for premium feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Text Area */}
              <div className="p-8 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] group-hover:text-[#DAAB34] transition-colors duration-300">
                    {option.title}
                  </h3>
                  <p className="text-gray-500 mt-1 font-medium">
                    {option.description}
                  </p>
                </div>

                {/* Action Button */}
                <Link
                  to={option.link}
                  className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center bg-white group-hover:bg-[#DAAB34] group-hover:border-[#DAAB34] transition-all duration-300 shadow-sm"
                >
                  <ChevronRight className="w-6 h-6 text-[#1A1A1A] group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                </Link>
              </div>

              {/* Bottom Decorative Bar */}
              <div className="h-1.5 w-0 bg-[#DAAB34] group-hover:w-full transition-all duration-700" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EyeCheckupSection;
