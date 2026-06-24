'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { File as FileIcon, Star, Download, Trash2, Eye, Edit2, Search, XCircle } from 'lucide-react';
import { formatFileSize, getFileIcon } from '@/lib/files/fileTypes';

interface FileType {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  is_favorite: boolean;
  is_trashed: boolean;
  folder_name?: string | null;
}

interface FileListProps {
  refreshTrigger: number;
  currentFolderId: string | null;
  categoryFilter?: string[] | null;
  title?: string;
  limit?: number;
  searchQuery?: string;
  onFileDeleted?: () => void;
  onFileRenamed?: () => void;
  onSearchResults?: (count: number) => void;
}

export default function FileList({ 
  refreshTrigger, 
  currentFolderId, 
  categoryFilter,
  title = 'My Files',
  limit,
  searchQuery = '',
  onFileDeleted, 
  onFileRenamed,
  onSearchResults
}: FileListProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger, currentFolderId, categoryFilter, searchQuery]);

  const loadFiles = async () => {
    setLoading(true);
    setIsSearching(!!searchQuery);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFiles([]);
        setLoading(false);
        return;
      }

      // If there's a search query, use the search API
      if (searchQuery && searchQuery.trim()) {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          folderId: currentFolderId ?? 'null',
          includeTrash: 'false'
        });
        
        const response = await fetch(`/api/files/search?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setFiles(data.files || []);
          if (onSearchResults) onSearchResults(data.count);
        } else {
          console.error('Search error:', data.error);
          setFiles([]);
        }
        
        setLoading(false);
        setIsSearching(false);
        return;
      }

      // Normal file loading (no search)
      let query = supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_trashed', false);

      if (currentFolderId === null) {
        query = query.is('folder_id', null);
      } else {
        query = query.eq('folder_id', currentFolderId);
      }

      if (categoryFilter && categoryFilter.length > 0) {
        const extensions = categoryFilter.join('|');
        query = query.or(`file_name.ilike.%.${extensions.split('|').join(',file_name.ilike.%.')}`);
      }

      let { data, error } = await query.order('created_at', { ascending: false });

      if (limit && data && data.length > limit) {
        data = data.slice(0, limit);
      }

      if (error) throw error;
      setFiles(data || []);
      if (onSearchResults) onSearchResults(data?.length || 0);
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleRename = async (fileId: string, newName: string) => {
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

      if (!response.ok) throw new Error('Rename failed');

      await loadFiles();
      if (onFileRenamed) onFileRenamed();
      setRenamingFile(null);
    } catch (error: any) {
      alert('Failed to rename file: ' + error.message);
    }
  };

  const handleFavorite = async (fileId: string, isFavorite: boolean) => {
    await fetch(`/api/files/favorite/${fileId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: !isFavorite })
    });
    await loadFiles();
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Move "${fileName}" to trash?`)) return;
    const response = await fetch(`/api/files/delete/${fileId}`, { method: 'DELETE' });
    if (response.ok) {
      await loadFiles();
      if (onFileDeleted) onFileDeleted();
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    const response = await fetch(`/api/files/download/${fileId}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleView = (fileId: string) => {
    window.open(`/api/files/view/${fileId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {isSearching && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-sm text-blue-700 flex items-center">
            <Search className="h-4 w-4 mr-2" />
            Searching...
          </span>
        </div>
      )}

      {files.length === 0 && !isSearching && (
        <div className="p-12 text-center">
          <FileIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg text-slate-500 font-medium">No files found</p>
          <p className="text-base text-slate-400 mt-2">Upload your first file to get started</p>
        </div>
      )}

      {files.length === 0 && isSearching && (
        <div className="p-12 text-center">
          <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg text-slate-500 font-medium">No results found</p>
          <p className="text-base text-slate-400 mt-2">
            No files match your search "{searchQuery}"
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Size</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Modified</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((file) => {
                const isImage = file.file_type?.startsWith('image/') || false;
                return (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {isImage ? (
                          <img src={`/api/files/view/${file.id}`} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <span className="text-3xl">{getFileIcon(file.file_name)}</span>
                        )}
                        {renamingFile === file.id ? (
                          <input
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleRename(file.id, newFileName)}
                            onBlur={() => setRenamingFile(null)}
                            className="px-3 py-2 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <div>
                            <span className="text-base font-medium text-slate-700 truncate max-w-md block">
                              {file.file_name}
                            </span>
                            {file.folder_name && (
                              <span className="text-xs text-slate-400">
                                📁 {file.folder_name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-base text-slate-500">
                      {file.file_type?.split('/')[0] || 'file'}
                    </td>
                    <td className="px-6 py-4 text-base text-slate-500">
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-6 py-4 text-base text-slate-500">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleView(file.id)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="View">
                          <Eye className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDownload(file.id, file.file_name)} className="p-2 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors" title="Download">
                          <Download className="h-5 w-5" />
                        </button>
                        <button onClick={() => {
                          setRenamingFile(file.id);
                          setNewFileName(file.file_name);
                        }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Rename">
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleFavorite(file.id, file.is_favorite)} className={`p-2 rounded-lg transition-colors ${file.is_favorite ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`} title="Favorite">
                          <Star className={`h-5 w-5 ${file.is_favorite ? 'fill-yellow-500' : ''}`} />
                        </button>
                        <button onClick={() => handleDelete(file.id, file.file_name)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}