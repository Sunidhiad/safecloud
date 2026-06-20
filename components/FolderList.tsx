'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Edit2, Trash2, FolderOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FolderType {
  id: string;
  name: string;
  created_at: string;
}

interface FolderListProps {
  folders: FolderType[];
  currentFolderId: string | null;
  onFolderOpen: (folderId: string, folderName: string) => void;
  onFolderDeleted: () => void;
  onFolderRenamed: () => void;
}

export default function FolderList({ 
  folders, 
  currentFolderId, 
  onFolderOpen, 
  onFolderDeleted, 
  onFolderRenamed 
}: FolderListProps) {
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const supabase = createClient();

  const handleRenameFolder = async (folderId: string, newName: string) => {
    if (!newName.trim()) {
      alert('Folder name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId);

      if (error) throw error;

      setRenamingFolder(null);
      onFolderRenamed();
    } catch (error: any) {
      alert('Failed to rename folder: ' + error.message);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    try {
      // Check if folder has files
      const { data: files } = await supabase
        .from('files')
        .select('id')
        .eq('folder_id', folderId);

      const { data: subFolders } = await supabase
        .from('folders')
        .select('id')
        .eq('parent_folder_id', folderId);

      if ((files && files.length > 0) || (subFolders && subFolders.length > 0)) {
        alert(`Cannot delete "${folderName}" because it is not empty.`);
        return;
      }

      if (!confirm(`Delete "${folderName}"?`)) return;

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      onFolderDeleted();
    } catch (error: any) {
      alert('Failed to delete folder: ' + error.message);
    }
  };

  if (folders.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <Folder className="h-5 w-5 mr-2 text-blue-600" />
        Folders
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {folders.map((folder) => (
          <div key={folder.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all">
            {renamingFolder === folder.id ? (
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameFolder(folder.id, newFolderName);
                  }
                }}
                onBlur={() => setRenamingFolder(null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <button
                onClick={() => onFolderOpen(folder.id, folder.name)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-slate-900">{folder.name}</h3>
                      <p className="text-xs text-slate-400">
                        {new Date(folder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingFolder(folder.id);
                        setNewFolderName(folder.name);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id, folder.name);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}