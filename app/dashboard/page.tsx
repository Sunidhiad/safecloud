'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import FileUploadBox from '@/components/FileUploadBox';
import FileList from '@/components/FileList';
import FolderList from '@/components/FolderList';
import CreateFolderButton from '@/components/CreateFolderButton';
import Breadcrumb from '@/components/Breadcrumb';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  HardDrive, 
  Shield, 
  TrendingUp, 
  Database, 
  FolderRoot,
  Sparkles,
  Activity
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
      change: '+12%',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Storage Used',
      value: formatTotalSize(stats.totalSize),
      icon: HardDrive,
      change: '+8%',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Total Folders',
      value: stats.totalFolders.toLocaleString(),
      icon: FolderRoot,
      change: '+3',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Security Status',
      value: 'Protected',
      icon: Shield,
      change: 'Active',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50'
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white"
        >
          <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-10`}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2 flex items-center">
                Welcome back, {userName}! 👋
                <Sparkles className="ml-2 h-5 w-5 text-yellow-300" />
              </h1>
              <p className="text-blue-100">
                Your secure cloud storage dashboard is ready
              </p>
              <div className="mt-3 flex items-center space-x-2 text-sm text-blue-200">
                <Activity className="h-4 w-4" />
                <span>All systems operational</span>
              </div>
            </div>
            <TrendingUp className="h-12 w-12 text-white/20 hidden sm:block" />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={`h-6 w-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-slate-600">{stat.title}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            {folderPath.length > 1 && (
              <button
                onClick={handleGoBack}
                className="inline-flex items-center px-3 py-2 text-slate-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
            )}
            <Breadcrumb items={folderPath} onNavigate={handleNavigateToFolder} />
          </div>
          <CreateFolderButton parentFolderId={currentFolderId} onFolderCreated={handleDataChange} />
        </div>

        {/* Current Location Indicator */}
        {currentFolderId && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-3"
          >
            <p className="text-sm text-blue-800">
              📁 Currently in folder: <strong>{currentFolderName}</strong>
            </p>
          </motion.div>
        )}

        {/* Folders Section */}
        <FolderList
          folders={folders}
          currentFolderId={currentFolderId}
          onFolderOpen={handleFolderOpen}
          onFolderDeleted={handleDataChange}
          onFolderRenamed={handleDataChange}
        />

        {/* Upload Section */}
        <FileUploadBox onUploadSuccess={handleDataChange} currentFolderId={currentFolderId} />

        {/* Files Section */}
        <FileList
          refreshTrigger={refreshTrigger}
          currentFolderId={currentFolderId}
          onFileDeleted={handleDataChange}
          onFileRenamed={handleDataChange}
        />
      </div>
    </DashboardLayout>
  );
}