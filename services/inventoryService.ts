import { Product, InventoryStats } from '../types';

// Initial Data Set
const INITIAL_DATA: Product[] = [
    {
        id: '1',
        sku: 'LAP-PRO-16',
        name: 'ProBook 16"',
        description: 'High performance laptop with M2 chip, 32GB RAM.',
        price: 2499.99,
        stock_quantity: 12,
        category: 'Laptops',
        image_url: 'https://picsum.photos/400/400?random=1',
        serialNumbers: []
    },
    {
        id: '2',
        sku: 'HEAD-NC-500',
        name: 'NoiseCancel 500',
        description: 'Over-ear noise cancelling headphones with 20h battery.',
        price: 299.99,
        stock_quantity: 45,
        category: 'Audio',
        image_url: 'https://picsum.photos/400/400?random=2',
        serialNumbers: []
    },
    {
        id: '3',
        sku: 'PHONE-ULTRA-X',
        name: 'UltraPhone X',
        description: 'Latest flagship smartphone, 5G, 256GB.',
        price: 999.00,
        stock_quantity: 0, // OUT OF STOCK EXAMPLE
        category: 'Phones',
        image_url: 'https://picsum.photos/400/400?random=3',
        serialNumbers: []
    },
    {
        id: '4',
        sku: 'WATCH-SPORT-2',
        name: 'SportWatch Gen 2',
        description: 'Waterproof fitness tracker with GPS.',
        price: 199.50,
        stock_quantity: 8,
        category: 'Wearables',
        image_url: 'https://picsum.photos/400/400?random=4',
        serialNumbers: []
    }
];

// MOCK DATABASE
// In production, this would be replaced by SQL queries to PostgreSQL.
let MOCK_DB: Product[] = JSON.parse(JSON.stringify(INITIAL_DATA));

// Helper to generate a slug/sku from a product name
const generateSku = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphens
};

// Helper to robustly parse a CSV line handling quotes
const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuote) {
            if (c === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    cur += '"'; // unescape ""
                    i++;
                } else {
                    inQuote = false;
                }
            } else {
                cur += c;
            }
        } else {
            if (c === '"') {
                inQuote = true;
            } else if (c === ',') {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += c;
            }
        }
    }
    result.push(cur.trim());
    return result;
};

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
            p.sku.toLowerCase().includes(lowerQ) ||
            (p.serialNumbers && p.serialNumbers.some(sn => sn.toLowerCase().includes(lowerQ)))
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

    resetDatabase: async (): Promise<void> => {
        MOCK_DB = JSON.parse(JSON.stringify(INITIAL_DATA));
        return;
    },

    // CSV Upload Logic
    // Parses specific format: Name,Category,Status,IMEI,Quantity,Cost,Price...
    processCsvUpload: async (csvText: string): Promise<number> => {
        // Handle different newline formats
        const lines = csvText.trim().split(/\r?\n/);
        
        // Temporary Map to aggregate serialized items
        // Key: Generated SKU
        const aggregatedProducts = new Map<string, Product>();
        let processedCount = 0;

        // Start from 1 to skip header
        // Expected Header: Product Name,Category,Status,Identifier (IMEI/SN),Quantity,Cost (€),Price (€),Date Added,Client,Notes
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = parseCSVLine(line);
            
            // Safety check for column length (allow for empty trailing columns)
            if (cols.length < 5) continue;

            // Map columns based on the provided standard
            const name = cols[0];
            const category = cols[1];
            const status = cols[2].toLowerCase(); // 'Available' or 'Sold'
            const imei = cols[3]; 
            // Quantity is often 1 per row for serialized items, but parse just in case
            const quantity = parseInt(cols[4]) || 0;
            
            // Clean price string (remove currency symbols if present) before parsing
            const priceStr = cols[6] ? cols[6].replace(/[^0-9.,]/g, '') : '0';
            const price = parseFloat(priceStr) || 0;

            if (!name) continue;

            // Generate a consistent SKU based on the name to group items
            const sku = generateSku(name);

            // Initialize product in map if not exists
            if (!aggregatedProducts.has(sku)) {
                aggregatedProducts.set(sku, {
                    id: sku, 
                    sku: sku,
                    name: name,
                    description: `${category} - ${name}`,
                    price: price,
                    stock_quantity: 0,
                    category: category,
                    image_url: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`,
                    serialNumbers: []
                });
            }

            const product = aggregatedProducts.get(sku)!;

            // Aggregation Logic:
            // 1. Stock: Only add quantity if status is 'available'
            if (status.includes('available')) {
                product.stock_quantity += quantity;
                
                // Track IMEI/Serial Number if present
                if (imei && imei.trim() !== '' && imei.toUpperCase() !== 'N/A') {
                    if (!product.serialNumbers) product.serialNumbers = [];
                    product.serialNumbers.push(imei.trim());
                }
            }

            // 2. Price: Update price if the current row has a valid price
            // This handles cases where some rows might have 0 or missing price
            if (price > 0) {
                product.price = price;
            }
            
            // 3. Category: Prefer non-empty category
            if (category && !product.category) {
                product.category = category;
            }

            processedCount++;
        }

        // Merge aggregated data into MOCK_DB
        // Strategy: Upsert (Update if exists, Insert if new)
        for (const [sku, newProductData] of aggregatedProducts) {
            const existingIdx = MOCK_DB.findIndex(p => p.sku === sku);
            
            if (existingIdx !== -1) {
                // Update existing product
                MOCK_DB[existingIdx].stock_quantity = newProductData.stock_quantity;
                // Only update price if the new data has a valid price
                if (newProductData.price > 0) {
                    MOCK_DB[existingIdx].price = newProductData.price;
                }
                // Update other metadata
                MOCK_DB[existingIdx].category = newProductData.category;
                MOCK_DB[existingIdx].serialNumbers = newProductData.serialNumbers;
            } else {
                // Add new product
                MOCK_DB.push(newProductData);
            }
        }

        return processedCount;
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