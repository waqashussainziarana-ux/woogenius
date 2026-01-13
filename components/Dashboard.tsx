import React, { useState, useEffect } from 'react';
import { Upload, RefreshCw, Package, Search, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { Product, InventoryStats } from '../types';

export const Dashboard: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [expandedSku, setExpandedSku] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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
                    alert(`Processed ${count} rows from CSV. Products have been aggregated by name.`);
                    loadData();
                }
            };
            reader.readAsText(file);
        }
    };

    const toggleExpand = (sku: string) => {
        if (expandedSku === sku) {
            setExpandedSku(null);
        } else {
            setExpandedSku(sku);
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.serialNumbers && p.serialNumbers.some(sn => sn.includes(searchTerm)))
    );

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
                        <div className="text-gray-500 text-sm font-medium uppercase">Unique Products</div>
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
                        placeholder="Search SKU, Name, or IMEI..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProducts.map((p) => (
                            <React.Fragment key={p.id}>
                                <tr className="hover:bg-gray-50 transition cursor-pointer" onClick={() => toggleExpand(p.sku)}>
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
                                    <td className="px-6 py-4 text-gray-400">
                                        {expandedSku === p.sku ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </td>
                                </tr>
                                {expandedSku === p.sku && (
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <td colSpan={7} className="px-6 py-4">
                                            <div className="pl-14">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <Tag size={14} /> 
                                                    Recorded Serial Numbers / IMEIs
                                                </h4>
                                                {p.serialNumbers && p.serialNumbers.length > 0 ? (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {p.serialNumbers.map((sn, idx) => (
                                                            <div key={idx} className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-mono text-gray-600">
                                                                {sn}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No serial numbers tracked for this item.</p>
                                                )}
                                                <div className="mt-2 text-xs text-gray-400">
                                                    Showing {p.serialNumbers?.length || 0} identifiers for {p.stock_quantity} stock items.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                     <div className="p-8 text-center text-gray-500">
                        No products found matching your search.
                     </div>
                )}
            </div>
        </div>
    );
};