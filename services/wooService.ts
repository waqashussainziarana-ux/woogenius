import { Cart, CartItem, Product } from '../types';

// MOCK WOOCOMMERCE CLIENT
// In production, use 'woocommerce-rest-api' or axios to hit the WC REST endpoints.

let currentCart: Cart = {
    items: [],
    total: 0
};

type CartListener = (cart: Cart) => void;
const listeners: CartListener[] = [];

const notifyListeners = () => {
    // Create a copy to ensure immutability
    const cartCopy = JSON.parse(JSON.stringify(currentCart));
    listeners.forEach(listener => listener(cartCopy));
};

export const wooService = {
    getCart: async (): Promise<Cart> => {
        return { ...currentCart };
    },

    // Allow React components to listen for updates
    subscribe: (listener: CartListener) => {
        listeners.push(listener);
        // Send current state immediately
        listener(JSON.parse(JSON.stringify(currentCart)));
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) listeners.splice(index, 1);
        };
    },

    addToCart: async (product: Product, quantity: number): Promise<Cart> => {
        console.log(`[WooCommerce] Adding ${quantity} of ${product.sku} to cart.`);
        
        const existingItemIndex = currentCart.items.findIndex(i => i.sku === product.sku);
        
        if (existingItemIndex > -1) {
            currentCart.items[existingItemIndex].quantity += quantity;
        } else {
            // Ensure we don't store references that might change
            const item = { ...product, quantity };
            currentCart.items.push(item);
        }
        
        // Recalculate total
        currentCart.total = currentCart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        notifyListeners();
        return { ...currentCart };
    },

    clearCart: async (): Promise<void> => {
        currentCart = { items: [], total: 0 };
        notifyListeners();
    },

    getCheckoutUrl: async (): Promise<string> => {
        // In a real app, this would create an Order via REST API and return the payment link.
        return "https://your-store.com/checkout?session_id=mock_session_123";
    }
};