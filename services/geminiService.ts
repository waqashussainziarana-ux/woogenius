import { GoogleGenAI, Content, Part } from "@google/genai";
import { SYSTEM_INSTRUCTION, TOOLS } from "../constants";
import { inventoryService } from "./inventoryService";
import { wooService } from "./wooService";

// STRICT REQUIREMENT: API Key must come from process.env.API_KEY
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

// Helper to wait for a specified duration
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper wrapper for API calls to handle 429s (Rate Limits)
// Now includes logic to parse "retry in X seconds" from the error message
const generateWithRetry = async (params: any, retries = 5, delay = 4000) => {
    try {
        return await ai.models.generateContent(params);
    } catch (e: any) {
        const errorMessage = e.message || JSON.stringify(e);
        
        // 1. Check if the API explicitly tells us how long to wait
        // Example error: "Please retry in 23.565305139s."
        const retryMatch = errorMessage.match(/retry in ([\d\.]+)s/);
        
        if (retryMatch && retryMatch[1] && retries > 0) {
             // Parse seconds, convert to ms, add 2 second buffer
             const waitTime = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 2000;
             console.warn(`[Gemini] Rate limit hit. API requested wait. Sleeping for ${waitTime}ms...`);
             
             await wait(waitTime);
             // Retry with original delay param since we just handled the specific wait
             return generateWithRetry(params, retries - 1, delay); 
        }

        // 2. Standard Exponential Backoff for generic 429s
        const isRateLimit = errorMessage.includes('429') || 
                           errorMessage.includes('RESOURCE_EXHAUSTED') || 
                           errorMessage.includes('quota') ||
                           e.status === 429;

        if (isRateLimit && retries > 0) {
            console.warn(`[Gemini] Rate limit hit. Retrying in ${delay}ms...`);
            await wait(delay);
            // Double the delay for the next attempt
            return generateWithRetry(params, retries - 1, delay * 2);
        }
        
        // If no retries left or not a rate limit error, throw
        throw e;
    }
};

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
        if (!apiKey) {
            return "Configuration Error: process.env.API_KEY is missing. Please check your environment variables.";
        }

        // Changed from gemini-3-flash-preview to gemini-flash-latest per user request
        const model = "gemini-flash-latest"; 

        // 1. Add user message to history for the API call
        const currentHistory = [
            ...history,
            { role: "user", parts: [{ text: userMessage }] } as Content
        ];

        try {
            // 2. Initial Call to Model with Retry Wrapper
            let response = await generateWithRetry({
                model: model,
                contents: currentHistory,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    tools: [{ functionDeclarations: TOOLS }],
                }
            });

            // 3. Check for Function Calls
            const candidates = response.candidates;
            if (!candidates || candidates.length === 0) {
                 return "The AI agent could not generate a response. (No candidates returned)";
            }

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

                // 5. Final Generation based on Tool Result (Also with Retry)
                const finalResponse = await generateWithRetry({
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

        } catch (e: any) {
            console.error("Gemini Error:", e);
            
            // CLEAN ERROR MESSAGE PARSING
            let displayMessage = e.message || "Unknown communication error";

            // If it's the specific raw JSON error the user encountered, parse it
            try {
                if (displayMessage.trim().startsWith('{')) {
                    const parsed = JSON.parse(displayMessage);
                    if (parsed.error && parsed.error.message) {
                        displayMessage = parsed.error.message;
                    }
                }
            } catch (parseError) {
                // Keep original message if parsing fails
            }

            // Friendly message for Quota Limits
            if (displayMessage.includes('429') || displayMessage.includes('quota') || displayMessage.includes('RESOURCE_EXHAUSTED')) {
                return "⚠️ High Traffic Alert: The AI is currently experiencing heavy load (Quota Exceeded). Please wait 30 seconds and try again.";
            }

            return `AI Error: ${displayMessage}`;
        }
    }
};