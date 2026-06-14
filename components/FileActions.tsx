'use client';

import { Edit2, Trash2, Download } from 'lucide-react';

interface FileActionsProps {
  onRename: () => void;
  onDelete: () => void;
  onDownload?: () => void;
}

export default function FileActions({ onRename, onDelete, onDownload }: FileActionsProps) {
  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={onRename}
        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
        title="Rename"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        onClick={onDownload}
        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
        title="Download"
      >
        <Download className="h-4 w-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}