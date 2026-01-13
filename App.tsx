import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Settings, LogOut, Menu, ShoppingCart } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ChatWidget } from './components/ChatWidget';
import { SettingsView } from './components/SettingsView';
import { inventoryService } from './services/inventoryService';
import { wooService } from './services/wooService';
import { Cart } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'store' | 'settings'>('store');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });

  React.useEffect(() => {
    // Initial load for storefront view
    inventoryService.getAll().then(setProducts);

    // Subscribe to cart changes (handles both UI clicks and AI actions)
    const unsubscribe = wooService.subscribe((updatedCart) => {
      setCart(updatedCart);
    });

    return () => unsubscribe();
  }, []);

  const handleAddToCart = async (product: any) => {
    await wooService.addToCart(product, 1);
  };

  const cartItemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">W</div>
          WooGenius
        </div>
        <div className="flex items-center gap-4">
           {/* Mobile Cart Icon */}
           <div className="relative">
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
           </div>
           <button className="p-2 hover:bg-slate-800 rounded-lg">
              <Menu size={24} />
           </button>
        </div>
      </div>

      {/* Sidebar - Hidden on mobile, fixed on desktop */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col fixed h-full z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">W</div>
            WooGenius
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span>Admin Dashboard</span>
          </button>
          <button 
            onClick={() => setCurrentView('store')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition justify-between ${currentView === 'store' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} />
              <span>Live Store View</span>
            </div>
            {cartItemCount > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartItemCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${currentView === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-lg transition">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Adjusted margins for mobile/desktop */}
      <main className="flex-1 md:ml-64 p-4 w-full">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'settings' && <SettingsView />}
        {currentView === 'store' && (
          // Storefront Simulation
          <div className="max-w-7xl mx-auto pt-4 md:pt-8">
             <header className="mb-8 md:mb-12 flex flex-col items-center px-4 relative">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Featured Products</h2>
                <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-sm md:text-base text-center">Browse our latest collection. Use the AI Chatbot in the bottom right to check stock or place orders instantly.</p>
                
                {/* Desktop Cart Summary in Header */}
                {cartItemCount > 0 && (
                    <div className="hidden md:flex absolute right-4 top-0 items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                            <ShoppingCart size={20} />
                        </div>
                        <div className="text-sm">
                            <p className="font-bold text-gray-900">{cartItemCount} Items</p>
                            <p className="text-gray-500">${cart.total.toFixed(2)}</p>
                        </div>
                        <button className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition">
                            Checkout
                        </button>
                    </div>
                )}
             </header>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-2 md:px-8 pb-24">
                {products.map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col">
                    <div className="h-48 md:h-64 overflow-hidden relative shrink-0">
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      {p.stock_quantity === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">SOLD OUT</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 md:p-6 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="font-bold text-lg text-slate-900 truncate pr-2">{p.name}</h3>
                         <span className="font-bold text-indigo-600 shrink-0">${p.price}</span>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{p.description}</p>
                      <button 
                        disabled={p.stock_quantity === 0}
                        onClick={() => handleAddToCart(p)}
                        className="w-full py-2.5 rounded-xl font-semibold text-sm transition colors bg-slate-900 text-white hover:bg-slate-800 disabled:bg-gray-200 disabled:text-gray-400 active:scale-95"
                      >
                        {p.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
             </div>
             
             {/* The AI Chat Widget is mounted here for the Store View */}
             <ChatWidget />
          </div>
        )}
      </main>
    </div>
  );
}