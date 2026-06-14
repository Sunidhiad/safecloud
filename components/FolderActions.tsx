'use client';

import { Edit2, Trash2, FolderOpen } from 'lucide-react';

interface FolderActionsProps {
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export default function FolderActions({ onOpen, onRename, onDelete }: FolderActionsProps) {
  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={onOpen}
        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
        title="Open"
      >
        <FolderOpen className="h-4 w-4" />
      </button>
      <button
        onClick={onRename}
        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
        title="Rename"
      >
        <Edit2 className="h-4 w-4" />
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