'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import FileUploadBox from '@/components/FileUploadBox';
import FileList from '@/components/FileList';
import FolderList from '@/components/FolderList';
import CreateFolderButton from '@/components/CreateFolderButton';
import Breadcrumb from '@/components/Breadcrumb';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  HardDrive, 
  Shield, 
  Database, 
  FolderRoot,
  Brain,
  Zap,
  TrendingUp
} from 'lucide-react';

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
  const [userName, setUserName] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>('');
  const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([{ id: null, name: 'Root' }]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    totalFolders: 0
  });
  const fileUploadRef = useRef<{ triggerUpload: () => void } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUserAndStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        setUserName(name);
        await loadStats(user.id);
      }
    };
    
    getUserAndStats();
    loadFolders();
  }, [refreshTrigger, currentFolderId]);

  const loadStats = async (userId: string) => {
    const { data: files } = await supabase
      .from('files')
      .select('file_size')
      .eq('owner_id', userId);
    
    const { data: folders } = await supabase
      .from('folders')
      .select('id')
      .eq('owner_id', userId);
    
    const totalSize = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
    
    setStats({
      totalFiles: files?.length || 0,
      totalSize: totalSize,
      totalFolders: folders?.length || 0
    });
  };

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
    
    const newPath = [...folderPath];
    newPath.push({ id: folderId, name: folderName });
    setFolderPath(newPath);
  };

  const handleNavigateToFolder = (folderId: string | null) => {
    if (folderId === null) {
      setCurrentFolderId(null);
      setCurrentFolderName('');
      const rootIndex = folderPath.findIndex(item => item.id === null);
      setFolderPath(folderPath.slice(0, rootIndex + 1));
    } else {
      const folderIndex = folderPath.findIndex(item => item.id === folderId);
      if (folderIndex !== -1) {
        setFolderPath(folderPath.slice(0, folderIndex + 1));
        setCurrentFolderId(folderId);
        setCurrentFolderName(folderPath[folderIndex].name);
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
    }
  };

  const formatTotalSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const statCards = [
    {
      title: 'Total Files',
      value: stats.totalFiles.toLocaleString(),
      icon: Database,
      color: 'blue'
    },
    {
      title: 'Storage Used',
      value: formatTotalSize(stats.totalSize),
      icon: HardDrive,
      color: 'emerald'
    },
    {
      title: 'Total Folders',
      value: stats.totalFolders.toLocaleString(),
      icon: FolderRoot,
      color: 'purple'
    },
    {
      title: 'Security',
      value: 'Protected',
      icon: Shield,
      color: 'indigo'
    },
  ];

  return (
    <DashboardLayout>
      <Navbar onUpload={() => document.getElementById('file-input-trigger')?.click()} />
      
      <div className="p-6 space-y-6">
        {/* Welcome Banner - Compact */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Welcome back, {userName} 👋</h1>
              <p className="text-blue-100 text-sm mt-0.5">Your secure cloud storage is ready</p>
            </div>
            <TrendingUp className="h-8 w-8 text-white/20" />
          </div>
        </div>

        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600',
              emerald: 'bg-emerald-50 text-emerald-600',
              purple: 'bg-purple-50 text-purple-600',
              indigo: 'bg-indigo-50 text-indigo-600',
            }[stat.color];
            
            return (
              <div key={index} className="bg-white rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${colorClasses}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {folderPath.length > 1 && (
              <button
                onClick={handleGoBack}
                className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Breadcrumb items={folderPath} onNavigate={handleNavigateToFolder} />
          </div>
          <CreateFolderButton parentFolderId={currentFolderId} onFolderCreated={handleDataChange} />
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Recent Files */}
          <div className="lg:col-span-2 space-y-6">
            <FileUploadBox onUploadSuccess={handleDataChange} currentFolderId={currentFolderId} />
            
            {folders.length > 0 && (
              <FolderList
                folders={folders}
                currentFolderId={currentFolderId}
                onFolderOpen={handleFolderOpen}
                onFolderDeleted={handleDataChange}
                onFolderRenamed={handleDataChange}
              />
            )}
            
            <FileList
              refreshTrigger={refreshTrigger}
              currentFolderId={currentFolderId}
              onFileDeleted={handleDataChange}
              onFileRenamed={handleDataChange}
            />
          </div>

          {/* Right Column - Info Cards */}
          <div className="space-y-4">
            {/* AI Search Info */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <Brain className="h-6 w-6 mb-3" />
                  <h3 className="font-semibold text-sm">AI-Powered Search</h3>
                  <p className="text-xs text-purple-100 mt-1">Smart file discovery</p>
                </div>
                <Zap className="h-4 w-4 text-white/60" />
              </div>
            </div>

            {/* Storage Info */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Storage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Used</span>
                  <span className="text-slate-700 font-medium">{formatTotalSize(stats.totalSize)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min((stats.totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">10 GB total</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  📁 Create New Folder
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  🔍 Advanced Search
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  ⚡ AI File Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}