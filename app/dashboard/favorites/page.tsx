'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import { formatFileSize, getFileIcon } from '@/lib/files/fileTypes';
import { Star, Download, Eye, Trash2 } from 'lucide-react';

interface FavoriteFile {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    created_at: string;
    is_favorite: boolean;
}

export default function FavoritesPage() {
    const [files, setFiles] = useState<FavoriteFile[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('files')
                .select('*')
                .eq('owner_id', user.id)
                .eq('is_favorite', true)
                .eq('is_trashed', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFiles(data || []);
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (fileId: string) => {
        try {
            const response = await fetch(`/api/files/favorite/${fileId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFavorite: false })
            });
            
            if (response.ok) {
                await loadFavorites();
            }
        } catch (error) {
            console.error('Remove favorite error:', error);
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

    const handleDelete = async (fileId: string, fileName: string) => {
        if (!confirm(`Move "${fileName}" to trash?`)) return;
        
        try {
            const response = await fetch(`/api/files/delete/${fileId}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                await loadFavorites();
                alert('File moved to trash');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to move file to trash');
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
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Star className="h-6 w-6 mr-2 text-yellow-500 fill-yellow-500" />
                        Favorites
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Your favorite files, always accessible</p>
                </div>

                {files.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                        <Star className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No favorite files yet</p>
                        <p className="text-sm text-slate-400 mt-1">
                            Click the star icon on any file to add it to favorites
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map(file => (
                            <div key={file.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3 flex-1">
                                        <span className="text-3xl">{getFileIcon(file.file_name)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{file.file_name}</p>
                                            <p className="text-xs text-slate-400">{formatFileSize(file.file_size)}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(file.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFavorite(file.id)}
                                        className="p-1.5 text-yellow-500 hover:text-yellow-600"
                                        title="Remove from favorites"
                                    >
                                        <Star className="h-4 w-4 fill-yellow-500" />
                                    </button>
                                </div>
                                
                                <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={() => handleView(file.id)}
                                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                        title="View"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDownload(file.id, file.file_name)}
                                        className="p-1.5 text-slate-500 hover:text-green-600 rounded-lg hover:bg-green-50"
                                        title="Download"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.id, file.file_name)}
                                        className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}