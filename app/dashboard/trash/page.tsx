'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import { formatFileSize, getFileIcon } from '@/lib/files/fileTypes';
import { Trash2, RotateCcw, AlertTriangle, Clock, Eye, Download } from 'lucide-react';

interface TrashedFile {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    created_at: string;
    trashed_at: string;
    object_key: string;
}

export default function TrashPage() {
    const [files, setFiles] = useState<TrashedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadTrashedFiles();
    }, []);

    const loadTrashedFiles = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('files')
                .select('*')
                .eq('owner_id', user.id)
                .eq('is_trashed', true)
                .order('trashed_at', { ascending: false });

            if (error) throw error;
            setFiles(data || []);
        } catch (error) {
            console.error('Error loading trashed files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (fileId: string) => {
        try {
            const response = await fetch(`/api/files/restore/${fileId}`, {
                method: 'POST',
            });
            
            if (response.ok) {
                await loadTrashedFiles();
                alert('File restored successfully!');
            } else {
                const error = await response.json();
                alert('Failed to restore: ' + error.error);
            }
        } catch (error) {
            console.error('Restore error:', error);
            alert('Failed to restore file');
        }
    };

    const handlePermanentDelete = async (fileId: string, fileName: string) => {
        if (confirm(`⚠️ Permanently delete "${fileName}"?\n\nThis action cannot be undone.`)) {
            try {
                const response = await fetch(`/api/files/permanent-delete/${fileId}`, {
                    method: 'DELETE',
                });
                
                if (response.ok) {
                    await loadTrashedFiles();
                    alert('File permanently deleted');
                } else {
                    const error = await response.json();
                    alert('Failed to delete: ' + error.error);
                }
            } catch (error) {
                console.error('Delete error:', error);
                alert('Failed to delete file');
            }
        }
    };

    const handleEmptyTrash = async () => {
        if (confirm('⚠️ Empty trash?\n\nAll files in trash will be permanently deleted. This action cannot be undone.')) {
            for (const file of files) {
                await fetch(`/api/files/permanent-delete/${file.id}`, {
                    method: 'DELETE',
                });
            }
            await loadTrashedFiles();
            alert('Trash emptied successfully');
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
                <div className="p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Navbar />
            
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                            <Trash2 className="h-6 w-6 mr-2 text-red-500" />
                            Trash
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Files remain in trash for 30 days before automatic deletion
                        </p>
                    </div>
                    {files.length > 0 && (
                        <button
                            onClick={handleEmptyTrash}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            Empty Trash
                        </button>
                    )}
                </div>

                {files.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                        <Trash2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Trash is empty</p>
                        <p className="text-sm text-slate-400 mt-1">
                            Deleted files will appear here
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <p className="text-sm text-yellow-700">
                                {files.length} file{files.length !== 1 ? 's' : ''} in trash
                            </p>
                        </div>

                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">File</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Size</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Deleted</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {files.map(file => (
                                        <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-2xl">{getFileIcon(file.file_name)}</span>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{file.file_name}</p>
                                                        <p className="text-xs text-slate-400">
                                                            {file.file_type.split('/')[0] || 'file'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {formatFileSize(file.file_size)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                    <span className="text-sm text-slate-500">
                                                        {new Date(file.trashed_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleView(file.id)}
                                                        className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(file.id, file.file_name)}
                                                        className="p-2 text-slate-500 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestore(file.id)}
                                                        className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePermanentDelete(file.id, file.file_name)}
                                                        className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                                                        title="Permanently Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}