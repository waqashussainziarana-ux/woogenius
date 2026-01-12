import { Product, InventoryStats } from '../types';

// MOCK DATABASE
// In production, this would be replaced by SQL queries to PostgreSQL.
let MOCK_DB: Product[] = [
    {
        id: '1',
        sku: 'LAP-PRO-16',
        name: 'ProBook 16"',
        description: 'High performance laptop with M2 chip, 32GB RAM.',
        price: 2499.99,
        stock_quantity: 12,
        category: 'Laptops',
        image_url: 'https://picsum.photos/400/400?random=1'
    },
    {
        id: '2',
        sku: 'HEAD-NC-500',
        name: 'NoiseCancel 500',
        description: 'Over-ear noise cancelling headphones with 20h battery.',
        price: 299.99,
        stock_quantity: 45,
        category: 'Audio',
        image_url: 'https://picsum.photos/400/400?random=2'
    },
    {
        id: '3',
        sku: 'PHONE-ULTRA-X',
        name: 'UltraPhone X',
        description: 'Latest flagship smartphone, 5G, 256GB.',
        price: 999.00,
        stock_quantity: 0, // OUT OF STOCK EXAMPLE
        category: 'Phones',
        image_url: 'https://picsum.photos/400/400?random=3'
    },
    {
        id: '4',
        sku: 'WATCH-SPORT-2',
        name: 'SportWatch Gen 2',
        description: 'Waterproof fitness tracker with GPS.',
        price: 199.50,
        stock_quantity: 8,
        category: 'Wearables',
        image_url: 'https://picsum.photos/400/400?random=4'
    }
];

// Service Methods
export const inventoryService = {
    getAll: async (): Promise<Product[]> => {
        // Simulate DB latency
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...MOCK_DB];
    },

    search: async (query: string): Promise<Product[]> => {
        console.log(`[DB] Searching for: ${query}`);
        const lowerQ = query.toLowerCase();
        return MOCK_DB.filter(p => 
            p.name.toLowerCase().includes(lowerQ) || 
            p.category.toLowerCase().includes(lowerQ) ||
            p.sku.toLowerCase().includes(lowerQ)
        );
    },

    getBySku: async (sku: string): Promise<Product | undefined> => {
        return MOCK_DB.find(p => p.sku === sku);
    },

    // Used for API Sync logic
    updateStock: async (sku: string, quantity: number): Promise<boolean> => {
        const idx = MOCK_DB.findIndex(p => p.sku === sku);
        if (idx !== -1) {
            MOCK_DB[idx].stock_quantity = quantity;
            return true;
        }
        return false;
    },

    // CSV Upload Logic
    processCsvUpload: async (csvText: string): Promise<number> => {
        const lines = csvText.trim().split('\n');
        let updateCount = 0;
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
            const [sku, name, price, stock, category] = lines[i].split(',').map(s => s.trim());
            
            const existingIdx = MOCK_DB.findIndex(p => p.sku === sku);
            if (existingIdx !== -1) {
                // Update existing
                MOCK_DB[existingIdx].stock_quantity = parseInt(stock);
                MOCK_DB[existingIdx].price = parseFloat(price);
                updateCount++;
            } else {
                // Add new (simplified for demo)
                MOCK_DB.push({
                    id: Math.random().toString(36).substr(2, 9),
                    sku,
                    name,
                    price: parseFloat(price),
                    stock_quantity: parseInt(stock),
                    category,
                    description: 'Imported product',
                    image_url: `https://picsum.photos/400/400?random=${MOCK_DB.length + 1}`
                });
                updateCount++;
            }
        }
        return updateCount;
    },

    getStats: (): InventoryStats => {
        return {
            totalProducts: MOCK_DB.length,
            totalStock: MOCK_DB.reduce((acc, p) => acc + p.stock_quantity, 0),
            lowStockCount: MOCK_DB.filter(p => p.stock_quantity < 5 && p.stock_quantity > 0).length,
            categories: new Set(MOCK_DB.map(p => p.category)).size
        };
    }
};
