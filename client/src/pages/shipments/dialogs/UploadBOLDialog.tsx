import React, { useCallback, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Ship, Upload, X } from 'lucide-react';

interface UploadBOLDialogProps {
  open: boolean;
  onClose: () => void;
  onExtract: (file: File) => void;
}

const UploadBOLDialog: React.FC<UploadBOLDialogProps> = ({ open, onClose, onExtract }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleExtract = () => {
    if (file) {
      onExtract(file);
      setFile(null);
    }
  };

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200 rounded-2xl border border-border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Ship size={16} />
            </div>
            <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
              Upload Bill of Lading
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight block mb-2">
            Bill of Lading / AWB PDF
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50/60 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide text-indigo-700 transition-all hover:border-indigo-400 hover:bg-indigo-100/60 active:scale-[0.98]"
            >
              <Upload size={14} />
              Upload your file
            </button>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-4 py-3 text-[12px] font-medium transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5 text-primary'
                  : file
                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50/60 text-slate-400 hover:border-slate-300 hover:text-slate-500'
              }`}
            >
              {file ? (
                <span className="truncate">{file.name}</span>
              ) : (
                'Upload your file'
              )}
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex items-center gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={handleExtract}
            disabled={!file}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm shadow-primary/15 transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
          >
            Extract Data
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-9 items-center justify-center px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 transition-colors hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default UploadBOLDialog;
