'use client';

import { Edit2, Trash2, Download, Star, Eye, Share2 } from 'lucide-react';

interface FileActionsProps {
  onView: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  onFavorite: () => void;
  onShare: () => void;
  isFavorite: boolean;
  showShare?: boolean;
}

export default function FileActions({ 
  onView, 
  onDownload, 
  onRename, 
  onDelete, 
  onFavorite, 
  onShare,
  isFavorite,
  showShare = true
}: FileActionsProps) {
  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={onView}
        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={onDownload}
        className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
        title="Download"
      >
        <Download className="h-4 w-4" />
      </button>
      <button
        onClick={onRename}
        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        title="Rename"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        onClick={onFavorite}
        className={`p-2 rounded-lg transition-colors ${
          isFavorite
            ? 'text-yellow-500 hover:text-yellow-600'
            : 'text-gray-400 hover:text-yellow-500'
        }`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
      </button>
      {showShare && (
        <button
          onClick={onShare}
          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          title="Share"
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={onDelete}
        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        title="Move to Trash"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}