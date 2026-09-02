import React, { createContext, useContext, useEffect, useState } from 'react';
import { settings } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

interface Settings {
    websiteName: string;
    logoUrl: string;
    maintenanceMode: boolean;
    contactInfo: {
        address: string;
        phone: string;
        email: string;
    };
    socialLinks: any[];
}

interface SettingsContextType {
    settings: Settings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
    websiteName: 'LensZora',
    logoUrl: '',
    maintenanceMode: false,
    contactInfo: {
        address: '',
        phone: '',
        email: '',
    },
    socialLinks: [],
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentSettings, setCurrentSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const updateFaviconAndTitle = (logoUrl?: string, websiteName?: string) => {
        // Dynamically update browser tab Favicon with the uploaded website logo
        if (logoUrl) {
            const fullFaviconUrl = getImageUrl(logoUrl);
            let faviconLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
            if (!faviconLink) {
                faviconLink = document.createElement('link');
                faviconLink.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(faviconLink);
            }
            faviconLink.href = fullFaviconUrl;
        }

        // Dynamically update browser tab title
        if (websiteName) {
            document.title = `${websiteName} - Premium Eyewear`;
        }
    };

    const loadSettings = async () => {
        try {
            const [general, contact, social] = await Promise.all([
                settings.list('general'),
                settings.get('contact_info').catch(() => ({ value: {} })),
                settings.get('social_links').catch(() => ({ value: [] })),
            ]);

            const genMap: any = {};
            general.forEach((s: any) => (genMap[s.key] = s.value));

            const newSettings = {
                websiteName: genMap.websiteName || 'LensZora',
                logoUrl: genMap.logoUrl || '',
                maintenanceMode: genMap.maintenanceMode === true || genMap.maintenanceMode === 'true',
                contactInfo: contact.value || defaultSettings.contactInfo,
                socialLinks: social.value || [],
            };

            setCurrentSettings(newSettings);
            updateFaviconAndTitle(newSettings.logoUrl, newSettings.websiteName);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings: currentSettings, loading, refreshSettings: loadSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
