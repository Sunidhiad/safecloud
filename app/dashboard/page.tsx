'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import FileList from '@/components/FileList';
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
  Upload,
  Plus,
  TrendingUp
} from 'lucide-react';

const categories = [
  { id: 'images', name: 'Images', icon: Image, types: ['jpg', 'jpeg', 'png', 'webp', 'gif'], color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
  { id: 'videos', name: 'Videos', icon: Video, types: ['mp4', 'mov', 'mkv', 'avi'], color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50' },
  { id: 'audio', name: 'Audio', icon: Music, types: ['mp3', 'wav', 'm4a', 'ogg'], color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' },
  { id: 'documents', name: 'Documents', icon: FileText, types: ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'], color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50' }
];

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryTypes, setCategoryTypes] = useState<string[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  }, [refreshTrigger]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setRefreshTrigger(prev => prev + 1);
        alert(`File "${file.name}" uploaded successfully!`);
      } else {
        const error = await response.json();
        alert('Upload failed: ' + error.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
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

  return (
    <DashboardLayout onUploadClick={triggerUpload}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        className="hidden"
      />
      
      <Navbar onUpload={triggerUpload} />
      
      <div className="p-8 lg:p-10">
        {/* Welcome Banner - Larger */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">Welcome back, {userName}!</h1>
              <p className="text-blue-100 text-base lg:text-lg">Your secure cloud storage dashboard is ready</p>
            </div>
            <TrendingUp className="h-16 w-16 text-white/20 hidden lg:block" />
          </div>
        </div>

        {/* Stats Cards - Larger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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

        {/* Upload Area - Larger */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-10 mb-10 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-5">
              <Upload className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-800 mb-3">Upload files to your cloud</h3>
            <p className="text-base text-slate-500 mb-6">Drag and drop or click the button below</p>
            <button
              onClick={triggerUpload}
              disabled={uploading}
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl font-medium text-base hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              {uploading ? 'Uploading...' : 'Select files to upload'}
            </button>
          </div>
        </div>

        {/* Quick Categories - Larger */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-slate-800 mb-5">Quick filters</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className={`flex items-center space-x-4 p-5 rounded-xl border-2 transition-all ${
                    isActive 
                      ? 'bg-blue-50 border-blue-400 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${cat.bgColor}`}>
                    <Icon className={`h-7 w-7 bg-gradient-to-r ${cat.color} bg-clip-text text-transparent`} />
                  </div>
                  <span className={`text-lg ${isActive ? 'text-blue-700 font-semibold' : 'text-slate-700'}`}>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Files Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-slate-800">Recent files</h2>
            <span className="text-sm text-slate-400">Last 5 files</span>
          </div>
          <FileList
            refreshTrigger={refreshTrigger}
            currentFolderId={null}
            title=""
            limit={5}
            onFileDeleted={() => setRefreshTrigger(prev => prev + 1)}
            onFileRenamed={() => setRefreshTrigger(prev => prev + 1)}
          />
        </div>

        {/* All Files Section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-slate-800">
              {selectedCategory ? `${selectedCategory} (filtered)` : 'All files'}
            </h2>
            {selectedCategory && (
              <button
                onClick={clearFilter}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filter
              </button>
            )}
          </div>
          <FileList
            refreshTrigger={refreshTrigger}
            currentFolderId={null}
            categoryFilter={categoryTypes}
            title=""
            onFileDeleted={() => setRefreshTrigger(prev => prev + 1)}
            onFileRenamed={() => setRefreshTrigger(prev => prev + 1)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}