export interface FileCategory {
  name: string;
  types: string[];
  icon: string;
  color: string;
}

export const fileCategories: FileCategory[] = [
  {
    name: 'Documents',
    types: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt'],
    icon: '📄',
    color: 'blue'
  },
  {
    name: 'Images',
    types: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'],
    icon: '🖼️',
    color: 'green'
  },
  {
    name: 'Videos',
    types: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'],
    icon: '🎥',
    color: 'purple'
  },
  {
    name: 'Audio',
    types: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    icon: '🎵',
    color: 'pink'
  },
  {
    name: 'APK',
    types: ['apk'],
    icon: '📱',
    color: 'orange'
  },
  {
    name: 'Archives',
    types: ['zip', 'rar', '7z', 'tar', 'gz'],
    icon: '📦',
    color: 'yellow'
  }
];

export function getFileCategory(fileName: string): FileCategory {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const category = fileCategories.find(cat => cat.types.includes(extension));
  return category || { name: 'Others', types: [], icon: '📁', color: 'gray' };
}

export function getFileIcon(fileName: string): string {
  return getFileCategory(fileName).icon;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}