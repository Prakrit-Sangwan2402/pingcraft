import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#131A23] border border-[#263241] rounded-xl w-full max-w-sm p-6 shadow-2xl relative text-[#E8EDF4]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9AA8B8] hover:text-[#E8EDF4]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-lg bg-[#FF647C]/10 border border-[#FF647C]/25 flex items-center justify-center text-[#FF647C] shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#E8EDF4]">{title || 'Confirm Deletion'}</h3>
            <p className="text-[11px] text-[#9AA8B8]">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-xs text-[#9AA8B8] mb-5 bg-[#0E131A] p-3 rounded-lg border border-[#263241]">
          {message || 'Are you sure you want to delete this resource and all historical telemetry?'}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-medium text-[#9AA8B8] hover:text-[#E8EDF4] bg-[#192330] hover:bg-[#202B39] border border-[#263241] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF647C] hover:bg-[#FF647C]/90 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
