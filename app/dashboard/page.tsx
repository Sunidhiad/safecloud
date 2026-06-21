'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import FileList from '@/components/FileList';
import FolderList from '@/components/FolderList';
import CreateFolderButton from '@/components/CreateFolderButton';
import Breadcrumb from '@/components/Breadcrumb';
import FileUploadBox from '@/components/FileUploadBox';
import { createClient } from '@/lib/supabase/client';
import { 
  HardDrive, 
  Shield, 
  Database, 
  FolderRoot,
  Image,
  Video,
  Music,
  FileText,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';

const categories = [
  { id: 'images', name: 'Images', icon: Image, types: ['jpg', 'jpeg', 'png', 'webp', 'gif'], color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
  { id: 'videos', name: 'Videos', icon: Video, types: ['mp4', 'mov', 'mkv', 'avi'], color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50' },
  { id: 'audio', name: 'Audio', icon: Music, types: ['mp3', 'wav', 'm4a', 'ogg'], color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' },
  { id: 'documents', name: 'Documents', icon: FileText, types: ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'], color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50' }
];

interface FolderType {
  id: string;
  name: string;
  created_at: string;
  parent_folder_id: string | null;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>('');
  const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([{ id: null, name: 'Root' }]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryTypes, setCategoryTypes] = useState<string[] | null>(null);
  const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0, totalFolders: 0 });
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        setUserName(name);
        
        const { data: files } = await supabase.from('files').select('file_size').eq('owner_id', user.id).eq('is_trashed', false);
        const { data: folders } = await supabase.from('folders').select('id').eq('owner_id', user.id);
        const totalSize = files?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0;
        setStats({ totalFiles: files?.length || 0, totalSize, totalFolders: folders?.length || 0 });
      }
    };
    loadData();
    loadFolders();
  }, [refreshTrigger, currentFolderId]);

  const loadFolders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('folders')
        .select('*')
        .eq('owner_id', user.id);

      if (currentFolderId === null) {
        query = query.is('parent_folder_id', null);
      } else {
        query = query.eq('parent_folder_id', currentFolderId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleDataChange = () => {
    setRefreshTrigger(prev => prev + 1);
    loadFolders();
  };

  const handleFolderOpen = async (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setCurrentFolderName(folderName);
    setSelectedCategory(null);
    setCategoryTypes(null);
    
    const newPath = [...folderPath];
    newPath.push({ id: folderId, name: folderName });
    setFolderPath(newPath);
  };

  const handleNavigateToFolder = (folderId: string | null) => {
    if (folderId === null) {
      setCurrentFolderId(null);
      setCurrentFolderName('');
      setSelectedCategory(null);
      setCategoryTypes(null);
      const rootIndex = folderPath.findIndex(item => item.id === null);
      setFolderPath(folderPath.slice(0, rootIndex + 1));
    } else {
      const folderIndex = folderPath.findIndex(item => item.id === folderId);
      if (folderIndex !== -1) {
        setFolderPath(folderPath.slice(0, folderIndex + 1));
        setCurrentFolderId(folderId);
        setCurrentFolderName(folderPath[folderIndex].name);
        setSelectedCategory(null);
        setCategoryTypes(null);
      }
    }
  };

  const handleGoBack = () => {
    if (folderPath.length > 1) {
      const newPath = [...folderPath];
      newPath.pop();
      const newCurrentFolder = newPath[newPath.length - 1];
      setFolderPath(newPath);
      setCurrentFolderId(newCurrentFolder.id);
      setCurrentFolderName(newCurrentFolder.name);
      setSelectedCategory(null);
      setCategoryTypes(null);
    }
  };

  const handleCategoryClick = (category: typeof categories[0]) => {
    if (selectedCategory === category.name) {
      setSelectedCategory(null);
      setCategoryTypes(null);
    } else {
      setSelectedCategory(category.name);
      setCategoryTypes(category.types);
    }
  };

  const clearFilter = () => {
    setSelectedCategory(null);
    setCategoryTypes(null);
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const statCards = [
    { title: 'Total Files', value: stats.totalFiles.toLocaleString(), icon: Database, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Storage Used', value: formatSize(stats.totalSize), icon: HardDrive, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50' },
    { title: 'Total Folders', value: stats.totalFolders.toLocaleString(), icon: FolderRoot, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Security', value: 'AES-256', icon: Shield, color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50' }
  ];

  return (
    <DashboardLayout>
      <Navbar />
      
      <div className="p-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">Welcome back, {userName}!</h1>
              <p className="text-blue-100 text-base lg:text-lg">Your secure cloud storage dashboard is ready</p>
            </div>
            <TrendingUp className="h-16 w-16 text-white/20 hidden lg:block" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className={`${stat.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`h-7 w-7 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                </div>
                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-base text-slate-500 mt-1">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Navigation Bar - Folder Creation Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {folderPath.length > 1 && (
              <button
                onClick={handleGoBack}
                className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Breadcrumb items={folderPath} onNavigate={handleNavigateToFolder} />
            {selectedCategory && (
              <button
                onClick={clearFilter}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span>Filter: {selectedCategory}</span>
                <span className="ml-1">×</span>
              </button>
            )}
          </div>
          <CreateFolderButton 
            parentFolderId={currentFolderId} 
            onFolderCreated={handleDataChange} 
          />
        </div>

        {/* Upload Section - Pass currentFolderId */}
        <div className="mb-8">
          <FileUploadBox 
            onUploadSuccess={handleDataChange} 
            currentFolderId={currentFolderId} 
          />
        </div>

        {/* Folders Section */}
        {folders.length > 0 && (
          <FolderList
            folders={folders}
            currentFolderId={currentFolderId}
            onFolderOpen={handleFolderOpen}
            onFolderDeleted={handleDataChange}
            onFolderRenamed={handleDataChange}
          />
        )}

        {/* Quick Categories */}
        {!currentFolderId && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick filters</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all ${
                      isActive 
                        ? 'bg-blue-50 border-blue-400 shadow-md' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${cat.bgColor}`}>
                      <Icon className={`h-6 w-6 bg-gradient-to-r ${cat.color} bg-clip-text text-transparent`} />
                    </div>
                    <span className={`text-base ${isActive ? 'text-blue-700 font-semibold' : 'text-slate-700'}`}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Files Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent files</h2>
          <FileList
            refreshTrigger={refreshTrigger}
            currentFolderId={currentFolderId}
            categoryFilter={categoryTypes}
            limit={5}
            onFileDeleted={handleDataChange}
            onFileRenamed={handleDataChange}
          />
        </div>

        {/* All Files Section */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {selectedCategory ? `${selectedCategory} (filtered)` : 'All files'}
          </h2>
          <FileList
            refreshTrigger={refreshTrigger}
            currentFolderId={currentFolderId}
            categoryFilter={categoryTypes}
            onFileDeleted={handleDataChange}
            onFileRenamed={handleDataChange}
          />
        </div>

        {/* Filter clear button */}
        {selectedCategory && (
          <div className="mt-6 text-center">
            <button
              onClick={clearFilter}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}