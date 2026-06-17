'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard,
  Folder, 
  Share2, 
  Star, 
  Clock, 
  Trash2, 
  Settings,
  Cloud,
  LogOut,
  User,
  Menu,
  X,
  HardDrive,
  Plus
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onUploadClick?: () => void;
}

export default function DashboardLayout({ children, onUploadClick }: DashboardLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [storageUsed, setStorageUsed] = useState(0);
  const [totalStorage] = useState(10 * 1024 * 1024 * 1024);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/auth/login');
          return;
        }
        
        setUserEmail(user.email || '');
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        setUserName(name);
        
        const { data: files } = await supabase
          .from('files')
          .select('file_size')
          .eq('owner_id', user.id)
          .eq('is_trashed', false);
        
        const used = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
        setStorageUsed(used);
        
        setLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        router.replace('/auth/login');
      }
    };
    
    checkUser();
  }, [router, supabase]);

  const menuItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Files', href: '/dashboard/my-files', icon: Folder },
    { name: 'Shared With Me', href: '/dashboard/shared', icon: Share2 },
    { name: 'Recent', href: '/dashboard/recent', icon: Clock },
    { name: 'Favorites', href: '/dashboard/favorites', icon: Star },
    { name: 'Trash', href: '/dashboard/trash', icon: Trash2 },
  ];

  const bottomMenuItems = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const storagePercent = (storageUsed / totalStorage) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 text-base">Loading SafeCloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-5 left-5 z-50 p-3 bg-white rounded-xl shadow-md"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar - Wider (w-96 instead of w-72) */}
      <aside
        className={`fixed lg:relative z-40 h-full w-96 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo - Larger */}
        <div className="px-6 py-7 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Cloud className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">SafeCloud</span>
          </div>
        </div>

        {/* New Button - Larger */}
        <div className="px-5 pt-6 pb-5">
          <button
            onClick={onUploadClick}
            className="w-full flex items-center justify-center space-x-2 px-5 py-3.5 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span>New</span>
          </button>
        </div>

        {/* Navigation - Larger items */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl text-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? 'text-blue-700' : ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Storage Info - Larger */}
        <div className="px-5 py-6 border-t border-slate-100">
          <div className="mb-5">
            <div className="flex justify-between text-base text-slate-500 mb-2">
              <span>Storage</span>
              <span className="font-medium">{formatStorage(storageUsed)} / {formatStorage(totalStorage)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>
          
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl text-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? 'text-blue-700' : ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl text-lg text-red-600 hover:bg-red-50 transition-colors mt-3"
          >
            <LogOut className="h-6 w-6" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}