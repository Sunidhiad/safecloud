'use client';

import { useState, useEffect } from 'react';
import { Search, Upload, User, LogOut, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  onSearch?: (query: string) => void;
  onUpload?: () => void;
  currentFolderId?: string | null;
}

export default function Navbar({ onSearch, onUpload, currentFolderId }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }
    };
    getUser();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) onSearch(query);
  };

  const handleLogout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
        </div>

        <div className="flex-1 max-w-lg mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search files, folders..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onUpload}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm text-slate-700 hidden md:inline">{userEmail}</span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}