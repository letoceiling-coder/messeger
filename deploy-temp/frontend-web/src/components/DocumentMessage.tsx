interface DocumentMessageProps {
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentUrl: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const getFileIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar')) return '📦';
  if (mimeType.includes('text')) return '📃';
  if (mimeType.includes('json') || mimeType.includes('xml')) return '🔧';
  return '📎';
};

const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
};

export const DocumentMessage = ({ fileName, fileSize, mimeType, documentUrl }: DocumentMessageProps) => {
  const icon = getFileIcon(mimeType);
  const extension = getFileExtension(fileName);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-app-surface border border-app-border hover:border-app-accent transition-colors max-w-xs">
      {/* Иконка файла */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-app-surface-hover flex items-center justify-center text-2xl">
        {icon}
      </div>

      {/* Информация о файле */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-app-text truncate" title={fileName}>
          {fileName}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-app-text-secondary">{extension}</span>
          <span className="text-xs text-app-text-secondary">•</span>
          <span className="text-xs text-app-text-secondary">{formatFileSize(fileSize)}</span>
        </div>
      </div>

      {/* Кнопка скачивания */}
      <button
        onClick={handleDownload}
        className="flex-shrink-0 w-10 h-10 rounded-lg bg-app-accent hover:bg-app-accent-hover text-white flex items-center justify-center transition-colors"
        title="Скачать файл"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
    </div>
  );
};
