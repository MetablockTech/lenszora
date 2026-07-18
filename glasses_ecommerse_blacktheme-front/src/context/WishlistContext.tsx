import React, { createContext, useContext, useEffect, useState } from 'react';
import { wishlist, getToken } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface WishlistContextType {
    wishlistItems: any[];
    loading: boolean;
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const token = getToken();

    const loadWishlist = async () => {
        if (!token) {
            setWishlistItems([]);
            return;
        }
        try {
            setLoading(true);
            const data = await wishlist.get(token);
            if (Array.isArray(data)) {
                setWishlistItems(data);
            } else {
                console.error('Wishlist data is not an array:', data);
                setWishlistItems([]);
            }
        } catch (error) {
            console.error('Failed to load wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWishlist();
    }, [token]);

    const toggleWishlist = async (productId: string) => {
        if (!token) {
            toast({
                title: "Authentication Required",
                description: "Please login to add items to your wishlist.",
                variant: "destructive"
            });
            return;
        }

        try {
            const result = await wishlist.toggle(productId, token);
            await loadWishlist();
            toast({
                title: result.isWishlisted ? "Added to Wishlist" : "Removed from Wishlist",
                description: result.message,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update wishlist",
                variant: "destructive"
            });
        }
    };

    const isInWishlist = (productId: string) => {
        return Array.isArray(wishlistItems) && wishlistItems.some(item => item._id === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlistItems, loading, toggleWishlist, isInWishlist, refreshWishlist: loadWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
