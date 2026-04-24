import React, { useCallback, useState } from 'react';

export const FileUploadZone: React.FC<{ onUpload: (file: File, onProgress: (p: number) => void) => Promise<void> }> = ({ onUpload }) => {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    setUploading(true);
    try {
      await onUpload(f, (p) => setProgress(p));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(e.dataTransfer.files); }}
      className={`p-4 rounded-md border-dashed ${dragOver ? 'border-cyan-400' : 'border-slate-700'} border-2 bg-slate-900/20`}
      data-testid="file-upload-zone"
    >
      <div className="text-sm text-slate-300">Drag & drop files here, or click to select</div>
      <input type="file" onChange={(e) => onDrop(e.target.files)} className="mt-2" data-testid="file-input" />
      {uploading && <div className="mt-2">
        <div className="h-2 bg-slate-800 rounded">
          <div style={{ width: `${progress}%` }} className="h-2 bg-cyan-400 rounded" />
        </div>
        <div className="text-xs text-slate-400 mt-1">{progress}%</div>
      </div>}
    </div>
  );
};
