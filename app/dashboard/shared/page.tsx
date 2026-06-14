'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import { Share2 } from 'lucide-react';

export default function SharedPage() {
  return (
    <DashboardLayout>
      <Navbar />
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Shared With Me</h2>
          <p className="text-slate-500">
            Shared files will appear here once permission-based sharing is enabled.
          </p>
          <p className="text-sm text-slate-400 mt-2">Coming in Phase 4</p>
        </div>
      </div>
    </DashboardLayout>
  );
}