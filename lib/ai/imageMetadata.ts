import sharp from 'sharp';
import path from 'path';

export interface ImageMetadata {
  width: number;
  height: number;
  dominantColors: string[];
  colorTags: string[];
  manualTags: string[];
}

const colorTagMap: Record<string, string[]> = {
  'red': ['red', 'crimson', 'scarlet', 'ruby'],
  'blue': ['blue', 'azure', 'cobalt', 'navy', 'sky'],
  'green': ['green', 'emerald', 'forest', 'lime', 'olive'],
  'yellow': ['yellow', 'gold', 'amber', 'lemon'],
  'purple': ['purple', 'violet', 'lavender', 'magenta'],
  'orange': ['orange', 'tangerine', 'coral', 'peach'],
  'pink': ['pink', 'rose', 'fuchsia', 'blush'],
  'brown': ['brown', 'copper', 'bronze', 'tan'],
  'gray': ['gray', 'grey', 'silver', 'slate'],
  'black': ['black', 'dark', 'ebony', 'midnight'],
  'white': ['white', 'light', 'pale', 'ivory']
};

function getColorTag(colorName: string): string {
  for (const [tag, variations] of Object.entries(colorTagMap)) {
    if (variations.some(v => colorName.toLowerCase().includes(v))) {
      return tag;
    }
  }
  return 'other';
}

export async function extractImageMetadata(imagePath: string): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(imagePath).metadata();
    
    // Get dominant colors by analyzing the image
    const { data, info } = await sharp(imagePath)
      .resize(100, 100) // Resize for faster processing
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Simple color frequency analysis
    const colorMap = new Map<string, number>();
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Get top 5 dominant colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const dominantColors = sortedColors.map(([key]) => {
      const [r, g, b] = key.split('-').map(Number);
      const rVal = r * 32;
      const gVal = g * 32;
      const bVal = b * 32;
      return `rgb(${rVal}, ${gVal}, ${bVal})`;
    });
    
    // Generate color tags
    const colorTags = [...new Set(dominantColors.map(color => {
      // Simple color name mapping
      if (color.includes('255,0,0')) return 'red';
      if (color.includes('0,0,255')) return 'blue';
      if (color.includes('0,255,0')) return 'green';
      if (color.includes('255,255,0')) return 'yellow';
      if (color.includes('255,0,255')) return 'purple';
      if (color.includes('0,255,255')) return 'cyan';
      return getColorTag(color);
    }))];
    
    // Generate manual tags based on image properties
    const manualTags: string[] = [];
    if (metadata.width && metadata.height) {
      if (metadata.width > metadata.height) manualTags.push('landscape');
      else if (metadata.height > metadata.width) manualTags.push('portrait');
      else manualTags.push('square');
    }
    
    if (metadata.format) manualTags.push(metadata.format);
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      dominantColors,
      colorTags,
      manualTags,
    };
  } catch (error) {
    console.error('Image metadata extraction error:', error);
    return {
      width: 0,
      height: 0,
      dominantColors: [],
      colorTags: [],
      manualTags: [],
    };
  }
}

export function generateSearchableTags(fileName: string, fileType: string): string[] {
  const tags: string[] = [];
  
  // Extract words from filename
  const words = fileName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(' ')
    .filter(word => word.length > 2);
  
  tags.push(...words);
  
  // Add file type tags
  const extension = path.extname(fileName).toLowerCase();
  const typeMap: Record<string, string[]> = {
    '.pdf': ['document', 'pdf', 'report'],
    '.docx': ['document', 'word', 'text'],
    '.txt': ['text', 'document'],
    '.jpg': ['image', 'photo', 'picture'],
    '.jpeg': ['image', 'photo', 'picture'],
    '.png': ['image', 'graphic', 'picture'],
    '.mp4': ['video', 'movie'],
    '.mp3': ['audio', 'music'],
  };
  
  if (typeMap[extension]) {
    tags.push(...typeMap[extension]);
  }
  
  return [...new Set(tags)]; // Remove duplicates
}