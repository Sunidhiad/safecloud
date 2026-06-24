'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Upload, User, Settings, LayoutGrid, List, Bell, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface NavbarProps {
  onSearch?: (query: string) => void;
  onUpload?: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  searchQuery?: string;
}

export default function Navbar({ 
  onSearch, 
  onUpload, 
  viewMode = 'list', 
  onViewModeChange,
  searchQuery: externalSearchQuery = ''
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Update search query when external prop changes
  useEffect(() => {
    setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) onSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (onSearch) onSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      clearSearch();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 py-5">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className={`relative transition-all duration-200 ${
            isSearchFocused ? 'ring-2 ring-blue-500 rounded-xl' : ''
          }`}>
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
              isSearchFocused ? 'text-blue-500' : 'text-slate-400'
            }`} />
            <input
              type="text"
              placeholder="Search files, folders..."
              value={searchQuery}
              onChange={handleSearch}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-0 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          {onViewModeChange && (
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
                title="List view"
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={onUpload}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-base font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-5 w-5" />
            <span>Upload</span>
          </button>

          {/* Notifications */}
          <button className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            <Bell className="h-6 w-6" />
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <User className="h-6 w-6 text-slate-500" />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/dashboard/settings');
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-base text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
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