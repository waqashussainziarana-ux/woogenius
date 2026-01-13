import React from 'react';
import { Database, Server, RefreshCw, Trash2, ShieldCheck, CreditCard } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export const SettingsView: React.FC = () => {
    const handleReset = async () => {
        if (confirm("Are you sure you want to reset the database? All imported CSV data will be lost.")) {
            await inventoryService.resetDatabase();
            alert("Database has been reset to initial demo state.");
            window.location.reload(); // Reload to refresh all states
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
             <header className="mb-8 border-b border-gray-200 pb-6">
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-500 mt-2">Configure your store, manage data, and view system health.</p>
            </header>

            <div className="space-y-6">
                {/* System Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Server className="text-indigo-600" size={20} />
                            <h2 className="font-semibold text-gray-900">System Status</h2>
                        </div>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Operational</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Backend Connection</p>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Connected (Mock Mode)
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">AI Service (Gemini)</p>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Active
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">WooCommerce API</p>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                Simulated
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Version</p>
                            <div className="text-gray-900 font-medium">v1.2.0-beta</div>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                        <Database className="text-indigo-600" size={20} />
                        <h2 className="font-semibold text-gray-900">Data Management</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 text-sm mb-4">
                            Manage your local inventory database. Resetting will clear all imported CSV data and return the system to its initial demo state.
                        </p>
                        <div className="flex items-center gap-4">
                             <button 
                                onClick={handleReset}
                                className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                            >
                                <Trash2 size={18} />
                                <span className="font-medium">Reset Database</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition">
                                <RefreshCw size={18} />
                                <span className="font-medium">Force Sync</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security (Mock) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-75">
                     <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                        <ShieldCheck className="text-indigo-600" size={20} />
                        <h2 className="font-semibold text-gray-900">Security & API Keys</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <p className="font-medium text-gray-900">Google Gemini API Key</p>
                                <p className="text-xs text-gray-500">Configured via Environment Variables</p>
                            </div>
                            <span className="text-sm font-mono text-gray-500">•••••••••••••</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};