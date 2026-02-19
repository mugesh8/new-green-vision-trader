import React from 'react';
import { X, AlertTriangle, PackageOpen } from 'lucide-react';

const InsufficientStockModal = ({ isOpen, onClose, onNavigateToInventory, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                            <PackageOpen className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Insufficient Inventory</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-100">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 font-medium leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-6">
                        Would you like to go to the Inventory Stock page to update the stock levels?
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onNavigateToInventory}
                            className="flex-1 px-4 py-2.5 bg-[#0D7C66] text-white rounded-lg hover:bg-[#0a6252] transition-colors font-medium text-sm shadow-sm"
                        >
                            Update Stock
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsufficientStockModal;
