'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { File as FileIcon, Search, Eye, Download, Edit2, Trash2, Star } from 'lucide-react';
import { formatFileSize, getFileIcon } from '@/lib/files/fileTypes';
import FileActions from './FileActions';

interface FileType {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  is_favorite: boolean;
  is_trashed: boolean;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [supabase]);

  // Load files only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    }
  }, [refreshTrigger, currentFolderId, searchQuery, isAuthenticated]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setFiles([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_trashed', false);

      // Filter by current folder
      if (currentFolderId === null) {
        query = query.is('folder_id', null);
      } else {
        query = query.eq('folder_id', currentFolderId);
      }

      // Apply search filter
      if (searchQuery && searchQuery.trim()) {
        query = query.ilike('file_name', `%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading files:', error);
        setFiles([]);
      } else {
        setFiles(data || []);
      }
    } catch (error) {
      console.error('Error in loadFiles:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    if (!newName.trim()) {
      alert('File name cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/files/rename/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newFileName: newName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Rename failed');
      }

      await loadFiles();
      if (onFileRenamed) onFileRenamed();
      setRenamingFile(null);
    } catch (error: any) {
      console.error('Rename error:', error);
      alert('Failed to rename file: ' + error.message);
    }
  };

  const handleFavorite = async (fileId: string, isFavorite: boolean) => {
    try {
      const response = await fetch(`/api/files/favorite/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !isFavorite })
      });
      
      if (response.ok) {
        await loadFiles();
      } else {
        const error = await response.json();
        console.error('Favorite error:', error);
      }
    } catch (error: any) {
      console.error('Favorite error:', error);
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Move "${fileName}" to trash?`)) return;

    try {
      const response = await fetch(`/api/files/delete/${fileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }
      
      await loadFiles();
      if (onFileDeleted) onFileDeleted();
      alert(`"${fileName}" moved to trash`);
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('Failed to move file to trash: ' + error.message);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/download/${fileId}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      alert('Failed to download file: ' + error.message);
    }
  };

  const handleView = (fileId: string, fileType: string) => {
    window.open(`/api/files/view/${fileId}`, '_blank');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center">
          <FileIcon className="h-5 w-5 mr-2 text-blue-600" />
          My Files
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileIcon className="h-10 w-10 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No files in this folder</p>
          <p className="text-sm text-slate-400 mt-1">
            Upload your first file using the box above
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 rounded-lg">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-3">Uploaded</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* File list */}
          {files.map((file) => {
            const isImage = file.file_type.startsWith('image/');
            return (
              <div
                key={file.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors group"
              >
                <div className="col-span-5 flex items-center space-x-3">
                  {isImage ? (
                    <img
                      src={`/api/files/view/${file.id}`}
                      alt={file.file_name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{getFileIcon(file.file_name)}</span>
                  )}
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
                      className="flex-1 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <div>
                      <p className="font-medium text-slate-900 text-sm truncate max-w-xs">
                        {file.file_name}
                      </p>
                      <p className="text-xs text-slate-500 md:hidden">
                        {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="hidden md:block col-span-2 text-sm text-slate-600">
                  {formatFileSize(file.file_size)}
                </div>
                <div className="hidden md:block col-span-3 text-sm text-slate-600">
                  {new Date(file.created_at).toLocaleDateString()}
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  {renamingFile !== file.id && (
                    <FileActions
                      onView={() => handleView(file.id, file.file_type)}
                      onDownload={() => handleDownload(file.id, file.file_name)}
                      onRename={() => {
                        setRenamingFile(file.id);
                        setNewFileName(file.file_name);
                      }}
                      onDelete={() => handleDelete(file.id, file.file_name)}
                      onFavorite={() => handleFavorite(file.id, file.is_favorite)}
                      isFavorite={file.is_favorite}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 pt-4 border-t text-xs text-slate-500">
        {files.length} file{files.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}