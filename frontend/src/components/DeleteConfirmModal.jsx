import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252720]/60 backdrop-blur-[2px] animate-fade-in font-sans">
      <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm w-full max-w-sm p-6 shadow-xl relative text-[#252720]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#77766B] hover:text-[#252720] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-sm bg-[#C63E32]/10 border border-[#C63E32]/30 flex items-center justify-center text-[#C63E32] shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-serif font-normal text-[#252720]">{title || 'Confirm Deletion'}</h3>
            <p className="text-[11px] text-[#77766B]">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-xs text-[#77766B] mb-5 bg-[#E8E1D5]/60 p-3 rounded-sm border border-[#D4CCBE]">
          {message || 'Are you sure you want to delete this resource and all historical telemetry?'}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-medium text-[#77766B] hover:text-[#252720] bg-[#E8E1D5]/60 hover:bg-[#E8E1D5] border border-[#D4CCBE] rounded-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#C63E32] hover:bg-[#C63E32]/90 rounded-sm transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
