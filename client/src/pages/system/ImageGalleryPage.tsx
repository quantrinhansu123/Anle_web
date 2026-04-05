import React, { useState, useEffect } from 'react';
import { 
  ImageIcon, Upload, Copy, Check, Loader2, ImagePlus
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useToastContext } from '../../contexts/ToastContext';

interface UploadedFile {
  name: string;
  created_at: string;
  size: number;
  mimetype: string;
  url: string;
}

const ImageGalleryPage: React.FC = () => {
  const { success, error } = useToastContext();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<UploadedFile[]>('/upload');
      setFiles(data);
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      error('Please upload an image file.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      await apiFetch<{ url: string }>('/upload', {
        method: 'POST',
        body: formData
      });
      
      success('Image uploaded successfully');
      // Refresh the list after upload
      fetchFiles();
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    success('URL copied to clipboard!');
    setTimeout(() => {
      setCopiedUrl(null);
    }, 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
            <ImageIcon size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Image Gallery</h1>
            <p className="text-muted-foreground text-sm">Upload, manage, and get URLs for your web images.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-[14px] font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer ${uploading ? 'opacity-70 pointer-events-none' : ''}`}>
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading images...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-card rounded-2xl border border-dashed border-border shadow-sm p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <ImagePlus size={40} />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">No Images Found</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Your image gallery is currently empty. Upload images here to host them and generate direct web URLs for your application.
          </p>
          <label className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-[14px] font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer">
            <Upload size={18} />
            Upload Your First Image
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
              disabled={uploading}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {files.map((file, index) => (
            <div key={index} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all hover:border-primary/30 flex flex-col">
              <div className="w-full h-40 bg-muted/30 relative flex items-center justify-center p-2 overflow-hidden border-b border-border">
                {/* Checkered background for transparent images */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                <img 
                  src={file.url} 
                  alt={file.name} 
                  className="max-w-full max-h-full object-contain relative z-10 transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="truncate text-[13px] font-bold text-foreground mb-1" title={file.name}>
                  {file.name.split('-').slice(1).join('-') || file.name}
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 pb-2">
                   <div className="text-[11px] text-muted-foreground">
                    {formatSize(file.size)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                   {new Date(file.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  onClick={() => handleCopyUrl(file.url)}
                  className={`mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-bold transition-all border ${
                    copiedUrl === file.url 
                    ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                    : 'bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary border-transparent'
                  }`}
                >
                  {copiedUrl === file.url ? (
                    <>
                      <Check size={14} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy URL
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGalleryPage;
