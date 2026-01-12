import { FunctionDeclaration, Type } from "@google/genai";

// ---------------------------------------------------------------------------
// SYSTEM INSTRUCTION
// ---------------------------------------------------------------------------
// This is the core "brain" of the agent. It strictly enforces tool usage.
export const SYSTEM_INSTRUCTION = `
You are 'WooBot', an intelligent sales and inventory assistant for a high-end electronics store.

YOUR RESPONSIBILITIES:
1. Help customers find products based on their needs.
2. Check real-time stock availability using the 'check_inventory' or 'search_products' tools.
3. Add items to the customer's cart using 'add_to_cart'.
4. Guide customers to checkout.

CRITICAL RULES (DO NOT BREAK):
- NEVER guess stock levels. You MUST use 'check_inventory' or 'search_products' to get the current quantity.
- If a user asks for a product, ALWAYS search for it first to confirm existence and stock.
- If stock is 0, explicitly say "We are currently out of stock" and suggest an alternative from the database if available.
- If the user wants to buy, check stock first. If available, use 'add_to_cart'.
- Be polite, professional, and concise.

Refuse to answer questions unrelated to electronics, shopping, or order support.
`;

// ---------------------------------------------------------------------------
// TOOL DEFINITIONS (Function Declarations)
// ---------------------------------------------------------------------------

export const searchProductsTool: FunctionDeclaration = {
    name: 'search_products',
    description: 'Search for products by name or category to see details and stock levels.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: {
                type: Type.STRING,
                description: 'The search term (e.g., "headphones", "laptop", "wireless mouse").'
            }
        },
        required: ['query']
    }
};

export const checkInventoryTool: FunctionDeclaration = {
    name: 'check_inventory',
    description: 'Get precise stock quantity for a specific SKU.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            sku: {
                type: Type.STRING,
                description: 'The exact product SKU.'
            }
        },
        required: ['sku']
    }
};

export const addToCartTool: FunctionDeclaration = {
    name: 'add_to_cart',
    description: 'Add a product to the user shopping cart.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            sku: {
                type: Type.STRING,
                description: 'The SKU of the product to add.'
            },
            quantity: {
                type: Type.NUMBER,
                description: 'The number of items to add. Default is 1.'
            }
        },
        required: ['sku', 'quantity']
    }
};

export const checkoutTool: FunctionDeclaration = {
    name: 'initiate_checkout',
    description: 'Generate a checkout link for the customer when they are ready to buy.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            ready: {
                type: Type.STRING,
                description: "User confirmation to proceed to checkout (e.g., 'yes')."
            }
        },
        required: ['ready']
    }
};

export const TOOLS = [searchProductsTool, checkInventoryTool, addToCartTool, checkoutTool];
