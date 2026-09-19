import { useState, useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';

/**
 * A file picker with an optional category select, wired to an async onUpload(file, category)
 * handler (which should call the relevant api.js multipart upload function).
 */
export default function FileUpload({ categories, onUpload, accept, buttonLabel = 'Upload' }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(categories ? categories[0] : undefined);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file, category);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand-sageLight file:text-brand-forest file:text-xs file:font-bold hover:file:bg-brand-sage hover:file:text-white file:cursor-pointer cursor-pointer"
      />
      {categories && (
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-sage"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-forest text-white px-3 py-1.5 rounded-lg hover:bg-brand-forestHover disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
        {buttonLabel}
      </button>
    </div>
  );
}
