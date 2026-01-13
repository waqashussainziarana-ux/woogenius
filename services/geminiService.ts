import { GoogleGenAI, Content, Part } from "@google/genai";
import { SYSTEM_INSTRUCTION, TOOLS } from "../constants";
import { inventoryService } from "./inventoryService";
import { wooService } from "./wooService";

// Helper to retrieve API Key safely across different environments (Vite, Next.js, CRA, Node)
const getApiKey = (): string => {
    // 1. Try Vite (Standard for this file structure)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
    
    // 2. Try Standard Node/Webpack/Next/CRA
    if (typeof process !== 'undefined' && process.env) {
        // Check for common framework prefixes
        return process.env.REACT_APP_API_KEY || 
               process.env.NEXT_PUBLIC_API_KEY || 
               process.env.API_KEY || 
               '';
    }
    
    return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// Helper to execute tools based on AI request
const executeTool = async (functionCall: any): Promise<any> => {
    const { name, args } = functionCall;
    console.log(`[Gemini] Executing Tool: ${name}`, args);

    try {
        switch (name) {
            case 'search_products':
                const results = await inventoryService.search(args.query);
                return { 
                    products: results.map(p => ({
                        sku: p.sku,
                        name: p.name,
                        stock: p.stock_quantity, // Crucial for AI to know
                        price: p.price
                    }))
                };

            case 'check_inventory':
                const product = await inventoryService.getBySku(args.sku);
                if (!product) return { error: "Product not found" };
                return { 
                    sku: product.sku, 
                    stock_quantity: product.stock_quantity,
                    status: product.stock_quantity > 0 ? "In Stock" : "Out of Stock"
                };

            case 'add_to_cart':
                const itemToAdd = await inventoryService.getBySku(args.sku);
                if (!itemToAdd) return { error: "Invalid SKU" };
                if (itemToAdd.stock_quantity < args.quantity) {
                    return { error: `Insufficient stock. Only ${itemToAdd.stock_quantity} available.` };
                }
                const cart = await wooService.addToCart(itemToAdd, args.quantity);
                return { success: true, cart_total: cart.total, message: "Item added to cart." };

            case 'initiate_checkout':
                const url = await wooService.getCheckoutUrl();
                return { checkout_url: url, message: "Checkout link generated." };

            default:
                return { error: "Unknown tool" };
        }
    } catch (error: any) {
        return { error: error.message };
    }
};

export const geminiService = {
    // Main Chat Function
    // Handles the conversational loop including tool execution
    sendMessage: async (history: Content[], userMessage: string): Promise<string> => {
        if (!apiKey) return "Error: API Key is missing. Please check your Vercel Environment Variables. Ensure you have added 'VITE_API_KEY'.";

        // Use Gemini 3 Flash for optimal speed and function calling capabilities
        const model = "gemini-3-flash-preview"; 

        // 1. Add user message to history for the API call
        const currentHistory = [
            ...history,
            { role: "user", parts: [{ text: userMessage }] } as Content
        ];

        try {
            // 2. Initial Call to Model
            let response = await ai.models.generateContent({
                model: model,
                contents: currentHistory,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    tools: [{ functionDeclarations: TOOLS }],
                }
            });

            // 3. Check for Function Calls
            const candidates = response.candidates;
            if (!candidates || candidates.length === 0) return "I'm having trouble connecting right now.";

            const firstPart = candidates[0].content.parts[0];
            
            // If the model wants to call a function (tool)
            if (firstPart.functionCall) {
                const functionCall = firstPart.functionCall;
                
                // Execute the actual logic (DB query, etc.)
                const toolResult = await executeTool(functionCall);

                // 4. Send Tool Response back to Model
                // We need to construct the history carefully for the follow-up
                const toolResponseParts = [
                    {
                        functionResponse: {
                            name: functionCall.name,
                            response: { result: toolResult }
                        }
                    }
                ];

                // Add the model's function call request to history so the flow makes sense
                const intermediateHistory = [
                    ...currentHistory,
                    { role: "model", parts: [firstPart] } as Content, // The function call
                    { role: "tool", parts: toolResponseParts } as Content // The result
                ];

                // 5. Final Generation based on Tool Result
                const finalResponse = await ai.models.generateContent({
                    model: model,
                    contents: intermediateHistory,
                    config: {
                        systemInstruction: SYSTEM_INSTRUCTION,
                        tools: [{ functionDeclarations: TOOLS }] // Keep tools available just in case
                    }
                });

                return finalResponse.text || "I processed that request.";
            }

            // Normal text response
            return response.text || "I didn't understand that.";

        } catch (e) {
            console.error("Gemini Error:", e);
            return "Sorry, I encountered an error communicating with the AI. Please try again.";
        }
    }
};