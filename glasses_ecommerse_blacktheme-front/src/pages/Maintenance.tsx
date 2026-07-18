import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, Clock, Mail } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

const Maintenance = () => {
    const { settings } = useSettings();
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full text-center space-y-8"
            >
                <div className="relative inline-block">
                    <div className="h-24 w-24 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
                        <Hammer className="h-12 w-12 text-white" />
                    </div>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-2 -right-2 h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg"
                    >
                        <Clock className="h-5 w-5 text-white" />
                    </motion.div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                        Under Maintenance
                    </h1>
                    <p className="text-lg text-slate-600">
                        We're currently updating {settings.websiteName} to provide you with a better shopping experience. We'll be back shortly!
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 text-slate-700">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Need help? Contact us:</span>
                    </div>
                    <p className="text-slate-600 text-sm">
                        {settings.contactInfo.email}
                    </p>
                </div>

                <p className="text-slate-400 text-sm">
                    Thank you for your patience.
                </p>
            </motion.div>
        </div>
    );
};

export default Maintenance;
