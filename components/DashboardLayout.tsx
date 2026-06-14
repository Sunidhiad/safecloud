'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  Brain,
  User,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';
import LogoutButton from './LogoutButton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Check authentication - this protects the dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Not logged in - redirect to login page
          router.push('/auth/login');
          return;
        }
        
        // User is logged in, set user info
        setUserEmail(user.email || '');
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        setUserName(name);
        setLoading(false);
        
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/auth/login');
      }
    };
    
    checkAuth();
  }, [router, supabase]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Files', href: '/dashboard/my-files', icon: Folder },
    { name: 'Shared With Me', href: '/dashboard/shared', icon: Share2 },
    { name: 'AI Search', href: '/dashboard/ai-search', icon: Brain },
    { name: 'Favorites', href: '/dashboard/favorites', icon: Star },
    { name: 'Recent', href: '/dashboard/recent', icon: Clock },
    { name: 'Trash', href: '/dashboard/trash', icon: Trash2 },
  ];

  const bottomMenuItems = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading SafeCloud...</p>
          <p className="text-sm text-slate-400 mt-1">Your secure cloud awaits</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md lg:hidden"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200 flex flex-col transition-transform duration-300 shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Cloud className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SafeCloud
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-blue-700' : ''
                }`} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-0.5">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-blue-700' : ''
                }`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          {/* Sign Out Button */}
          <div className="pt-2 mt-2 border-t border-slate-100">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}