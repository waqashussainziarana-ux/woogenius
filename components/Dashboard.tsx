import React, { useState, useEffect } from 'react';
import { Upload, RefreshCw, Package, Search } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { Product, InventoryStats } from '../types';

export const Dashboard: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadData = async () => {
        const allProducts = await inventoryService.getAll();
        setProducts(allProducts);
        setStats(inventoryService.getStats());
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        // Simulate API call to external provider
        await new Promise(r => setTimeout(r, 1500)); 
        await loadData();
        setIsSyncing(false);
        alert("Inventory synced with external provider!");
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const count = await inventoryService.processCsvUpload(text);
                    alert(`Processed ${count} items from CSV.`);
                    loadData();
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Inventory Command Center</h1>
                <p className="text-gray-500 mt-2">Manage stock, sync with providers, and monitor AI knowledge base.</p>
            </header>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm font-medium uppercase">Total Products</div>
                        <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm font-medium uppercase">Total Stock Items</div>
                        <div className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalStock}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm font-medium uppercase">Low Stock Alerts</div>
                        <div className="text-3xl font-bold text-red-600 mt-2">{stats.lowStockCount}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-gray-500 text-sm font-medium uppercase">Categories</div>
                        <div className="text-3xl font-bold text-gray-900 mt-2">{stats.categories}</div>
                    </div>
                </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition">
                        <Upload size={18} />
                        <span className="font-medium">Upload CSV</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                        <span className="font-medium">{isSyncing ? 'Syncing...' : 'Sync with API'}</span>
                    </button>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search local DB..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Product Name</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">SKU</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Category</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Price</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Stock</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                                            <Package size={20} className="text-gray-400" />
                                        </div>
                                        <span className="font-medium text-gray-900">{p.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{p.sku}</td>
                                <td className="px-6 py-4 text-gray-600 text-sm">{p.category}</td>
                                <td className="px-6 py-4 text-gray-900 font-medium">${p.price.toFixed(2)}</td>
                                <td className="px-6 py-4 text-gray-600">{p.stock_quantity}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        p.stock_quantity === 0 
                                            ? 'bg-red-100 text-red-700' 
                                            : p.stock_quantity < 10 
                                                ? 'bg-yellow-100 text-yellow-700' 
                                                : 'bg-green-100 text-green-700'
                                    }`}>
                                        {p.stock_quantity === 0 ? 'Out of Stock' : p.stock_quantity < 10 ? 'Low Stock' : 'In Stock'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
