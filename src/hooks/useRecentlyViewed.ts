import { useEffect } from 'react';
import { Product } from '@/types';

const RECENTLY_VIEWED_KEY = 'recentlyViewed';
const MAX_ITEMS = 10;

export const useRecentlyViewed = () => {
    const addToRecentlyViewed = (product: Product) => {
        try {
            const viewed = getRecentlyViewed();

            // Remove if already exists
            const filtered = viewed.filter((p) => p.id !== product.id);

            // Add to beginning
            const updated = [product, ...filtered].slice(0, MAX_ITEMS);

            localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error adding to recently viewed:', error);
        }
    };

    const getRecentlyViewed = (): Product[] => {
        try {
            const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error getting recently viewed:', error);
            return [];
        }
    };

    const clearRecentlyViewed = () => {
        localStorage.removeItem(RECENTLY_VIEWED_KEY);
    };

    return {
        addToRecentlyViewed,
        getRecentlyViewed,
        clearRecentlyViewed,
    };
};

