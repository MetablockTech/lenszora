import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I order prescription glasses online?",
    answer: "Simply choose a frame you love, click 'Add Lenses', enter or upload your prescription, select your lens package, and proceed to checkout. We will craft the lenses to your exact specifications.",
  },
  {
    question: "What if I don't have my prescription right now?",
    answer: "No worries! You can complete your purchase and select 'Send Prescription Later'. Our customer support team will contact you via email or WhatsApp to retrieve your details before we process the lenses.",
  },
  {
    question: "Can I book an eye test at a LENSZORA store?",
    answer: "Yes, you can schedule a free eye test at any of our outlets. Use the 'Prescription - Near Store' or 'Locate a store' option in the menu to find a store and book a convenient slot.",
  },
  {
    question: "What is your return and exchange policy?",
    answer: "We offer an easy 14-day return policy for all frames and sunglasses. Due to their custom nature, prescription lenses are covered against errors or defects, but cannot be returned for a change of mind.",
  },
  {
    question: "Do you offer a warranty on your products?",
    answer: "Every pair of glasses comes with a 1-year manufacturing warranty covering frame components and lens coatings against peeling or cracking under normal use.",
  },
  {
    question: "How can I check the status of my order?",
    answer: "You can track your order status directly from the 'Track Order' option in your account dropdown menu or by visiting our Orders page after logging in.",
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-[#090909] border-t border-white/5 relative overflow-hidden">
      {/* Decorative premium background blur */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-gold/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <span className="text-gold text-xs font-black uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
            Support & Help
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto">
            Got questions about lenses, prescriptions, orders, or shipping? We have got you covered.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-white/10 bg-white/[0.02] backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 hover:border-gold/30"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full py-5 px-6 flex items-center justify-between gap-4 text-left transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-gold shrink-0" />
                    <span className="text-white font-semibold text-sm md:text-base leading-snug">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gold shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-1 text-gray-300 text-sm leading-relaxed border-t border-white/5 bg-white/[0.01]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
