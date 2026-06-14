'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, MoreVertical, Edit2, Trash2, FolderOpen } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-8"
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <Folder className="h-5 w-5 mr-2 text-blue-600" />
        Folders
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {folders.map((folder, index) => (
          <motion.div
            key={folder.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="group relative bg-white rounded-xl border border-slate-100 hover:shadow-lg transition-all duration-300"
          >
            {renamingFolder === folder.id ? (
              <div className="p-4">
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <button
                  onClick={() => onFolderOpen(folder.id, folder.name)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Folder className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{folder.name}</h3>
                        <p className="text-xs text-slate-400">
                          {new Date(folder.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
                
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => setMenuOpen(menuOpen === folder.id ? null : folder.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  
                  <AnimatePresence>
                    {menuOpen === folder.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpen(null)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50"
                        >
                          <button
                            onClick={() => {
                              setRenamingFolder(folder.id);
                              setNewFolderName(folder.name);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Rename</span>
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteFolder(folder.id, folder.name);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}