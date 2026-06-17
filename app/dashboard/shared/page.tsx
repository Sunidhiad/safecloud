'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import { formatFileSize, getFileIcon } from '@/lib/files/fileTypes';
import { Share2, Eye, Download, File as FileIcon, User } from 'lucide-react';

interface SharedFile {
  shareId: string;
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  ownerEmail: string;
  permission: string;
  sharedAt: string;
}

export default function SharedPage() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadSharedFiles();
  }, []);

  const loadSharedFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/files/shared');
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files || []);
      } else {
        console.error('Failed to load shared files:', data.error);
      }
    } catch (error) {
      console.error('Error loading shared files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (fileId: string) => {
    window.open(`/api/files/view/${fileId}`, '_blank');
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/download/${fileId}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Navbar />
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Navbar />
      
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <Share2 className="h-8 w-8 mr-3 text-blue-600" />
            Shared With Me
          </h1>
          <p className="text-base text-slate-500 mt-1">Files shared with you by others</p>
        </div>

        {files.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <Share2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500">No shared files</p>
            <p className="text-base text-slate-400 mt-2">Files shared with you will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">File</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Owner</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Permission</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Shared</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {files.map((file) => (
                    <tr key={file.shareId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{getFileIcon(file.fileName)}</span>
                          <div>
                            <p className="font-medium text-slate-800">{file.fileName}</p>
                            <p className="text-sm text-slate-500">{formatFileSize(file.fileSize)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{file.ownerEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          file.permission === 'download'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {file.permission}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(file.sharedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleView(file.fileId)}
                            className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="View"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {file.permission === 'download' && (
                            <button
                              onClick={() => handleDownload(file.fileId, file.fileName)}
                              className="p-2 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                              title="Download"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}