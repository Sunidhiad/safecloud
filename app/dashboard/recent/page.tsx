'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import { formatFileSize, getFileIcon } from '@/lib/files/fileTypes';
import { Clock, Eye, Download, File as FileIcon, AlertCircle, RefreshCw } from 'lucide-react';

interface RecentFile {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    created_at: string;
    is_favorite: boolean;
    is_trashed: boolean;
    activity_action: string;
    activity_created_at: string;
}

export default function RecentPage() {
    const [files, setFiles] = useState<RecentFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        loadRecentFiles();
    }, []);

    const loadRecentFiles = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('User not authenticated');
                setLoading(false);
                return;
            }

            // Get recent activity logs with file details
            const { data: activities, error: activityError } = await supabase
                .from('file_activity_logs')
                .select(`
                    id,
                    file_id,
                    action,
                    created_at,
                    files (
                        id,
                        file_name,
                        file_type,
                        file_size,
                        created_at,
                        is_favorite,
                        is_trashed
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (activityError) {
                console.error('Activity error:', activityError);
                setError('Failed to load recent files');
                setLoading(false);
                return;
            }

            // Filter out null files and deduplicate by file_id (keep the latest activity)
            const fileMap = new Map();
            activities?.forEach(activity => {
                if (activity.files && Array.isArray(activity.files) && activity.files.length > 0 && !activity.files[0].is_trashed) {
                    if (!fileMap.has(activity.file_id)) {
                        fileMap.set(activity.file_id, {
                            ...activity.files[0],
                            activity_action: activity.action,
                            activity_created_at: activity.created_at
                        });
                    }
                }
            });

            // If no activity, show files ordered by created_at
            if (fileMap.size === 0) {
                const { data: latestFiles, error: filesError } = await supabase
                    .from('files')
                    .select('*')
                    .eq('owner_id', user.id)
                    .eq('is_trashed', false)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (filesError) {
                    console.error('Files error:', filesError);
                    setError('Failed to load files');
                    setLoading(false);
                    return;
                }

                const formattedFiles = latestFiles?.map(file => ({
                    ...file,
                    activity_action: 'uploaded',
                    activity_created_at: file.created_at
                })) || [];
                
                setFiles(formattedFiles);
            } else {
                setFiles(Array.from(fileMap.values()));
            }
        } catch (error) {
            console.error('Error loading recent files:', error);
            setError('Failed to load recent files');
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
            if (!response.ok) {
                throw new Error('Download failed');
            }
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

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'view': return 'Viewed';
            case 'download': return 'Downloaded';
            case 'upload': return 'Uploaded';
            case 'share': return 'Shared';
            case 'favorite': return 'Favorited';
            case 'rename': return 'Renamed';
            default: return 'Opened';
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'view': return 'text-blue-500 bg-blue-50';
            case 'download': return 'text-green-500 bg-green-50';
            case 'upload': return 'text-purple-500 bg-purple-50';
            case 'share': return 'text-indigo-500 bg-indigo-50';
            case 'favorite': return 'text-yellow-500 bg-yellow-50';
            case 'rename': return 'text-orange-500 bg-orange-50';
            default: return 'text-slate-500 bg-slate-50';
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
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                            <Clock className="h-8 w-8 mr-3 text-blue-600" />
                            Recent Files
                        </h1>
                        <p className="text-base text-slate-500 mt-1">Files you've recently viewed, downloaded, or uploaded</p>
                    </div>
                    <button
                        onClick={loadRecentFiles}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Error loading recent files</p>
                            <p className="text-sm text-red-700">{error}</p>
                            <button
                                onClick={loadRecentFiles}
                                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                {files.length === 0 && !error ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
                        <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-slate-500">No recent activity</p>
                        <p className="text-base text-slate-400 mt-2">View, download, or upload files to see them here</p>
                    </div>
                ) : files.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">File</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Action</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Size</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">When</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {files.map((file) => {
                                        const isImage = file.file_type.startsWith('image/');
                                        return (
                                            <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        {isImage ? (
                                                            <img src={`/api/files/view/${file.id}`} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                        ) : (
                                                            <span className="text-3xl">{getFileIcon(file.file_name)}</span>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-slate-800">{file.file_name}</p>
                                                            <p className="text-sm text-slate-500">{file.file_type.split('/')[0] || 'file'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(file.activity_action || 'view')}`}>
                                                        {getActionLabel(file.activity_action || 'view')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {formatFileSize(file.file_size)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    <div className="flex flex-col">
                                                        <span>{new Date(file.activity_created_at || file.created_at).toLocaleDateString()}</span>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(file.activity_created_at || file.created_at).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleView(file.id)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownload(file.id, file.file_name)}
                                                            className="p-2 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>
        </DashboardLayout>
    );
}