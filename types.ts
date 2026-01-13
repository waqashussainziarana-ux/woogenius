// Data Models matching Database Schema

export enum StockStatus {
    IN_STOCK = 'IN_STOCK',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    LOW_STOCK = 'LOW_STOCK'
}
  
export interface Product {
    id: string;
    sku: string;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    category: string;
    image_url: string;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Cart {
    items: CartItem[];
    total: number;
}

// Chat Types
export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'system';
    content: string;
    isTyping?: boolean;
    timestamp: number;
}

export interface InventoryStats {
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
    categories: number;
}