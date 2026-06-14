export function getFileIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const iconMap: Record<string, string> = {
    // Documents
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📃',
    md: '📝',
    // Presentations
    ppt: '📊',
    pptx: '📊',
    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    webp: '🖼️',
    svg: '🎨',
    // Videos
    mp4: '🎥',
    mov: '🎥',
    avi: '🎥',
    mkv: '🎥',
    // Audio
    mp3: '🎵',
    wav: '🎵',
    ogg: '🎵',
    flac: '🎵',
    // Archives
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    gz: '📦',
    // Code
    js: '💻',
    ts: '💻',
    jsx: '⚛️',
    tsx: '⚛️',
    html: '🌐',
    css: '🎨',
    json: '📋',
    py: '🐍',
    java: '☕',
    // APK
    apk: '📱',
  };
  
  return iconMap[extension] || '📁';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}