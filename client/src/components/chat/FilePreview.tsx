import React from 'react';

export const FilePreview: React.FC<{ url: string; name: string; size: number; onDownload: () => void }> = ({ url, name, size, onDownload }) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  return (
    <div className="p-2 bg-slate-900/20 rounded-md flex items-center gap-3" data-testid="file-preview">
      {isImage ? <img src={url} alt={name} className="h-16 w-16 object-cover rounded" /> : <div className="h-16 w-16 flex items-center justify-center bg-slate-800 rounded text-slate-300">{ext.toUpperCase()}</div>}
      <div className="flex-1">
        <div className="text-sm text-white">{name}</div>
        <div className="text-xs text-slate-400">{(size / 1024).toFixed(2)} KB</div>
      </div>
      <div>
        <button onClick={onDownload} className="py-1 px-2 rounded bg-cyan-500 text-black" data-testid="file-download">Download</button>
      </div>
    </div>
  );
};
