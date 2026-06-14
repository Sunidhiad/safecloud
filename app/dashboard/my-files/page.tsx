'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import { getFileCategory, formatFileSize, getFileIcon } from '@/lib/files/fileTypes';
import { 
  Folder, 
  File, 
  Download, 
  Trash2, 
  Star, 
  Eye,
  Search,
  X
} from 'lucide-react';

interface FileType {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  is_favorite: boolean;
}

interface FolderType {
  id: string;
  name: string;
  created_at: string;
}

type FilterType = 'All' | 'Documents' | 'Images' | 'Videos' | 'Audio' | 'APK' | 'Others';

export default function MyFilesPage() {
  const [files, setFiles] = useState<FileType[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [searchQuery, activeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load folders
      const { data: foldersData } = await supabase
        .from('folders')
        .select('*')
        .eq('owner_id', user.id)
        .is('parent_folder_id', null)
        .order('created_at', { ascending: false });

      setFolders(foldersData || []);

      // Load files
      let query = supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_trashed', false)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('file_name', `%${searchQuery}%`);
      }

      const { data: filesData } = await query;
      
      // Apply filter
      let filteredFiles = filesData || [];
      if (activeFilter !== 'All') {
        filteredFiles = filteredFiles.filter(file => {
          const category = getFileCategory(file.file_name);
          return category.name === activeFilter;
        });
      }

      setFiles(filteredFiles);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (fileId: string, isFavorite: boolean) => {
    await supabase
      .from('files')
      .update({ is_favorite: !isFavorite })
      .eq('id', fileId);
    loadData();
  };

  const handleDelete = async (fileId: string) => {
    if (confirm('Move to trash?')) {
      await supabase
        .from('files')
        .update({ is_trashed: true, trashed_at: new Date().toISOString() })
        .eq('id', fileId);
      loadData();
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

  const handleView = (fileId: string, fileType: string) => {
    if (fileType.startsWith('image/')) {
      window.open(`/api/files/view/${fileId}`, '_blank');
    } else if (fileType === 'application/pdf') {
      window.open(`/api/files/view/${fileId}`, '_blank');
    } else {
      alert('Preview not available. Download the file to view it.');
    }
  };

  const filters: FilterType[] = ['All', 'Documents', 'Images', 'Videos', 'Audio', 'APK', 'Others'];

  if (loading) {
    return (
      <DashboardLayout>
        <Navbar />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Navbar onSearch={setSearchQuery} />
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Files</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all your files and folders</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Folders Section */}
        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
              <Folder className="h-5 w-5 mr-2 text-blue-600" />
              Folders
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {folders.map(folder => (
                <div key={folder.id} className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-8 w-8 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{folder.name}</p>
                      <p className="text-xs text-slate-400">{new Date(folder.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
            <File className="h-5 w-5 mr-2 text-blue-600" />
            Files
          </h2>
          {files.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <File className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No files found</p>
              <p className="text-sm text-slate-400 mt-1">Upload your first file to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map(file => {
                const category = getFileCategory(file.file_name);
                return (
                  <div key={file.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
                    {/* Preview Section */}
                    <div className="aspect-video bg-slate-50 relative">
                      {file.file_type.startsWith('image/') ? (
                        <img
                          src={`/api/files/view/${file.id}`}
                          alt={file.file_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">{category.icon}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Info Section */}
                    <div className="p-3">
                      <p className="font-medium text-slate-800 truncate text-sm">{file.file_name}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatFileSize(file.file_size)}</p>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleView(file.id, file.file_type)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownload(file.id, file.file_name)}
                            className="p-1.5 text-slate-500 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleFavorite(file.id, file.is_favorite)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              file.is_favorite
                                ? 'text-yellow-500 hover:text-yellow-600'
                                : 'text-slate-500 hover:text-yellow-500'
                            }`}
                            title="Favorite"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}