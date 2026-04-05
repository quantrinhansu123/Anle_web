import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Trash2, RefreshCcw } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isProcessing?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message,
  confirmText = 'Confirm Delete',
  cancelText = 'Cancel',
  isProcessing = false
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={() => !isProcessing && onClose()} 
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">{title}</h3>
              <p className="text-[13px] text-muted-foreground">This action cannot be undone.</p>
            </div>
          </div>
          <div className="text-[14px] text-slate-600 font-medium leading-relaxed">
            {message}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-border flex items-center gap-3">
          <button
            disabled={isProcessing}
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-border bg-white text-[13px] font-bold text-slate-600 hover:bg-white/80 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            disabled={isProcessing}
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-red-600 text-white text-[13px] font-bold shadow-md shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? <RefreshCcw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {isProcessing ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
