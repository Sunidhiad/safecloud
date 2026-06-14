export function getFileIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    // Documents
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📃',
    // Presentations
    ppt: '📊',
    pptx: '📊',
    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    svg: '🎨',
    // Videos
    mp4: '🎥',
    avi: '🎥',
    mkv: '🎥',
    // Audio
    mp3: '🎵',
    wav: '🎵',
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
    // Archives
    zip: '📦',
    rar: '📦',
    '7z': '📦',
  };
  
  return iconMap[extension || ''] || '📁';
}