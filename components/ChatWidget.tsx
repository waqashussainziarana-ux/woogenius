import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ShoppingCart, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { geminiService } from '../services/geminiService';
import { Content } from '@google/genai';

export const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { 
            id: 'init', 
            role: 'model', 
            content: 'Hi! I can help you check stock, find products, and place orders. What are you looking for?', 
            timestamp: Date.now() 
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Convert app ChatMessage to Gemini Content format for history.
            // FILTER: We exclude the initial welcome message ('init') so the API 
            // starts clean with the user's first input + system prompt.
            const history: Content[] = messages
                .filter(m => m.id !== 'init')
                .map(m => ({
                    role: m.role === 'model' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));

            const responseText = await geminiService.sendMessage(history, userMsg.content);

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: responseText,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white w-[350px] h-[500px] shadow-2xl rounded-2xl flex flex-col border border-gray-200 mb-4 overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <MessageCircle size={18} />
                            </div>
                            <span className="font-semibold">WooBot Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-br-none' 
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                                    <Loader2 className="animate-spin text-indigo-600" size={16} />
                                    <span className="text-xs text-gray-500">Checking inventory...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about stock..."
                                className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 border rounded-full px-4 py-2 text-sm outline-none transition"
                            />
                            <button 
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-full transition shadow-md"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-xl transition-all hover:scale-105 flex items-center gap-2"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
                {!isOpen && <span className="font-medium pr-1">Chat with AI</span>}
            </button>
        </div>
    );
};