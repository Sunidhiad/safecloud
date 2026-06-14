'use client';

import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      
      // Redirect to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-all"
    >
      <LogOut className="h-4 w-4" />
      <span>Sign Out</span>
    </button>
  );
}