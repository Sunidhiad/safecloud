'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { File as FileIcon, Search } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatFileSize';
import { getFileIcon } from '@/lib/utils/getFileIcon';
import FileActions from './FileActions';

interface FileType {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface FileListProps {
  refreshTrigger: number;
  currentFolderId: string | null;
  onFileDeleted?: () => void;
  onFileRenamed?: () => void;
}

export default function FileList({ refreshTrigger, currentFolderId, onFileDeleted, onFileRenamed }: FileListProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger, currentFolderId, searchQuery]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'uploaded');

      // Filter by current folder
      if (currentFolderId === null) {
        query = query.is('folder_id', null);
      } else {
        query = query.eq('folder_id', currentFolderId);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.ilike('file_name', `%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      await loadFiles();
      if (onFileDeleted) onFileDeleted();
    } catch (error: any) {
      alert('Failed to delete file: ' + error.message);
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    if (!newName.trim()) {
      alert('File name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('files')
        .update({ file_name: newName })
        .eq('id', fileId);

      if (error) throw error;

      await loadFiles();
      if (onFileRenamed) onFileRenamed();
      setRenamingFile(null);
    } catch (error: any) {
      alert('Failed to rename file: ' + error.message);
    }
  };

  const handleDownload = (file: FileType) => {
    // Phase 3: Implement actual file download from OpenStack
    alert(`Phase 3: Download "${file.file_name}" will be implemented with OpenStack storage.`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileIcon className="h-5 w-5 mr-2 text-blue-600" />
          Files
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileIcon className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No files in this folder</p>
          <p className="text-sm text-gray-400 mt-1">
            Upload your first file using the box above
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 rounded-lg">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-3">Uploaded</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* File list */}
          {files.map((file) => (
            <div
              key={file.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="col-span-5 flex items-center space-x-3">
                <span className="text-xl">{getFileIcon(file.file_name)}</span>
                {renamingFile === file.id ? (
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameFile(file.id, newFileName);
                      }
                    }}
                    onBlur={() => setRenamingFile(null)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <div>
                    <p className="font-medium text-gray-900 text-sm truncate max-w-xs">
                      {file.file_name}
                    </p>
                    <p className="text-xs text-gray-500 md:hidden">
                      {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="hidden md:block col-span-2 text-sm text-gray-600">
                {formatFileSize(file.file_size)}
              </div>
              <div className="hidden md:block col-span-3 text-sm text-gray-600">
                {new Date(file.created_at).toLocaleDateString()}
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <FileActions
                  onRename={() => {
                    setRenamingFile(file.id);
                    setNewFileName(file.file_name);
                  }}
                  onDelete={() => handleDeleteFile(file.id, file.file_name)}
                  onDownload={() => handleDownload(file)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        {files.length} file{files.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}