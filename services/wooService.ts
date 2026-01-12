import { Cart, CartItem, Product } from '../types';

// MOCK WOOCOMMERCE CLIENT
// In production, use 'woocommerce-rest-api' or axios to hit the WC REST endpoints.

let currentCart: Cart = {
    items: [],
    total: 0
};

export const wooService = {
    getCart: async (): Promise<Cart> => {
        return { ...currentCart };
    },

    addToCart: async (product: Product, quantity: number): Promise<Cart> => {
        console.log(`[WooCommerce] Adding ${quantity} of ${product.sku} to cart.`);
        
        const existingItemIndex = currentCart.items.findIndex(i => i.sku === product.sku);
        
        if (existingItemIndex > -1) {
            currentCart.items[existingItemIndex].quantity += quantity;
        } else {
            currentCart.items.push({ ...product, quantity });
        }
        
        // Recalculate total
        currentCart.total = currentCart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        return { ...currentCart };
    },

    clearCart: async (): Promise<void> => {
        currentCart = { items: [], total: 0 };
    },

    getCheckoutUrl: async (): Promise<string> => {
        // In a real app, this would create an Order via REST API and return the payment link.
        return "https://your-store.com/checkout?session_id=mock_session_123";
    }
};
