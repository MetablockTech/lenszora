import { useSettings } from "@/context/SettingsContext";
import { motion } from "framer-motion";
import { PhoneCall } from "lucide-react";

const AgentCallingButton = () => {
  const { settings } = useSettings();
  const phoneNumber = settings.contactInfo?.phone || "+919876543210";

  return (
    <motion.a
      href={`tel:${phoneNumber}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-[104px] right-6 z-50 w-16 h-16 bg-[#DAAB34] rounded-full flex items-center justify-center shadow-2xl hover:bg-[#c29528] transition-colors duration-300 group cursor-pointer"
      aria-label="Call Agent"
    >
      {/* Pulse Animation */}
      <span className="absolute inset-0 rounded-full bg-[#DAAB34] animate-ping opacity-25 group-hover:opacity-40" />
      
      <PhoneCall className="w-8 h-8 text-black animate-pulse" />
    </motion.a>
  );
};

export default AgentCallingButton;
