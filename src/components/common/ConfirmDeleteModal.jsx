import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#0D5C4D]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B8782] hover:text-[#0D5C4D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-[#6B8782] mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[#D0E0DB] text-[#6B8782] rounded-lg hover:bg-[#F0F4F3] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;