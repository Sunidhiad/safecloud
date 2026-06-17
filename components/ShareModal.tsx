'use client';

import { useState } from 'react';
import { X, Share2, Mail, Lock, Users, Eye, Download } from 'lucide-react';

interface ShareModalProps {
    fileId: string;
    fileName: string;
    isOpen: boolean;
    onClose: () => void;
    onShare: (email: string, permission: string) => Promise<void>;
    existingShares?: Array<{ id: string; shared_with_email: string; permission: string }>;
    onRevoke?: (shareId: string) => Promise<void>;
}

export default function ShareModal({ 
    fileId, 
    fileName, 
    isOpen, 
    onClose, 
    onShare,
    existingShares = [],
    onRevoke
}: ShareModalProps) {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('view');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [shares, setShares] = useState(existingShares);

    if (!isOpen) return null;

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await onShare(email, permission);
            setSuccess(`File shared with ${email}`);
            setEmail('');
            // Refresh shares list
            const response = await fetch(`/api/files/share/${fileId}`);
            const data = await response.json();
            if (data.success) {
                setShares(data.shares);
            }
        } catch (error: any) {
            setError(error.message || 'Failed to share file');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (shareId: string, email: string) => {
        if (!confirm(`Remove access for ${email}?`)) return;
        
        try {
            const response = await fetch(`/api/files/share/${fileId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sharedWithUserId: shareId })
            });
            
            const data = await response.json();
            if (data.success) {
                setShares(shares.filter(s => s.id !== shareId));
                setSuccess(`Access revoked for ${email}`);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error: any) {
            setError('Failed to revoke access');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                        <Share2 className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-semibold text-slate-800">Share File</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-4">
                    <p className="text-sm text-slate-500 mb-4">
                        Sharing: <span className="font-medium text-slate-700">{fileName}</span>
                    </p>

                    {/* Share Form */}
                    <form onSubmit={handleShare} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter user's email"
                                    className="pl-10 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Permission
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPermission('view')}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        permission === 'view'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    <Eye className="h-4 w-4 inline mr-1" />
                                    View Only
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPermission('download')}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        permission === 'download'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    <Download className="h-4 w-4 inline mr-1" />
                                    View & Download
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Sharing...' : 'Share File'}
                        </button>
                    </form>

                    {/* Existing Shares */}
                    {shares && shares.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-200">
                            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                Shared with
                            </h3>
                            <div className="space-y-2">
                                {shares.map((share) => (
                                    <div key={share.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{share.shared_with_email}</p>
                                            <p className="text-xs text-slate-500">
                                                Permission: {share.permission}
                                            </p>
                                        </div>
                                        {onRevoke && (
                                            <button
                                                onClick={() => handleRevoke(share.id, share.shared_with_email)}
                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Revoke access"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}