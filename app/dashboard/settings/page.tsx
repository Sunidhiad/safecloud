'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import { User, Lock, Shield, CheckCircle, XCircle, Smartphone, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // MFA states
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [mfaFactorId, setMfaFactorId] = useState<string>('');
    const [mfaQRCode, setMfaQRCode] = useState('');
    const [mfaSecret, setMfaSecret] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [enrollingMfa, setEnrollingMfa] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    
    // Delete account states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletingAccount, setDeletingAccount] = useState(false);
    
    const supabase = createClient();

    useEffect(() => {
        loadUserData();
        loadMFAFactors();
    }, []);

    const loadUserData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setEmail(user.email || '');
                setFullName(user.user_metadata?.full_name || '');
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMFAFactors = async () => {
        try {
            const { data: factors, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;
            
            const verifiedFactors = factors?.totp?.filter(f => f.status === 'verified') || [];
            const hasVerifiedFactor = verifiedFactors.length > 0;
            
            setMfaEnabled(hasVerifiedFactor);
            if (hasVerifiedFactor) {
                setMfaFactorId(verifiedFactors[0].id);
            }
        } catch (error) {
            console.error('Error loading MFA factors:', error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);
        
        try {
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });
            
            if (authError) throw authError;
            
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!currentPassword) {
            setMessage({ type: 'error', text: 'Current password is required' });
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        
        setUpdating(true);
        setMessage(null);
        
        try {
            // First verify current password by attempting to sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: currentPassword
            });
            
            if (signInError) {
                throw new Error('Current password is incorrect');
            }
            
            // Update password
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            
            if (error) throw error;
            
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update password' });
        } finally {
            setUpdating(false);
        }
    };

    const handleEnrollMFA = async () => {
        setEnrollingMfa(true);
        setMessage(null);
        
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp'
            });
            
            if (error) throw error;
            
            setMfaQRCode(data.totp.qr_code);
            setMfaSecret(data.totp.secret);
            setMfaFactorId(data.id);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to start MFA enrollment' });
            setEnrollingMfa(false);
        }
    };

    const handleVerifyMFA = async () => {
        if (!mfaCode || mfaCode.length !== 6) {
            setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
            return;
        }
        
        setVerifyLoading(true);
        setMessage(null);
        
        try {
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: mfaFactorId
            });
            
            if (challengeError) throw challengeError;
            
            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaFactorId,
                challengeId: challengeData.id,
                code: mfaCode
            });
            
            if (verifyError) throw verifyError;
            
            setMessage({ type: 'success', text: 'MFA enabled successfully!' });
            setMfaEnabled(true);
            setMfaQRCode('');
            setMfaSecret('');
            setMfaCode('');
            setEnrollingMfa(false);
            await loadMFAFactors();
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to verify MFA code' });
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleDisableMFA = async () => {
        if (!confirm('Are you sure you want to disable MFA? This will make your account less secure.')) return;
        
        setUpdating(true);
        
        try {
            const { error } = await supabase.auth.mfa.unenroll({
                factorId: mfaFactorId
            });
            
            if (error) throw error;
            
            setMessage({ type: 'success', text: 'MFA disabled successfully' });
            setMfaEnabled(false);
            setMfaFactorId('');
            await loadMFAFactors();
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to disable MFA' });
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        // Validate confirmation text
        if (deleteConfirmText !== 'DELETE') {
            setMessage({ type: 'error', text: 'Type "DELETE" to confirm account deletion' });
            return;
        }
        
        // Show final warning dialog
        const confirmed = confirm(
            '⚠️ FINAL WARNING ⚠️\n\n' +
            'This will PERMANENTLY DELETE:\n\n' +
            '• Your entire account\n' +
            '• All your files and folders\n' +
            '• Your profile information\n' +
            '• All activity history\n' +
            '• Favorite files\n\n' +
            'This action is IRREVERSIBLE and you will lose ALL data.\n\n' +
            'Click OK to permanently delete your account.'
        );
        
        if (!confirmed) {
            return;
        }
        
        setDeletingAccount(true);
        setMessage(null);
        
        try {
            // Call the server-side API to delete the account
            const response = await fetch('/api/user/delete-account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete account');
            }
            
            setMessage({ type: 'success', text: 'Account deleted successfully! Redirecting...' });
            
            // Clear all local storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to home page after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            
        } catch (error: any) {
            console.error('Account deletion error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to delete account. Please try again.' });
            setDeletingAccount(false);
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
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
            
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your account settings</p>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg ${
                        message.type === 'success' 
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Section */}
                <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <User className="h-5 w-5 text-blue-600 mr-2" />
                        <h2 className="text-lg font-semibold text-slate-800">Profile</h2>
                    </div>
                    
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your full name"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={updating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {updating ? 'Updating...' : 'Update Profile'}
                        </button>
                    </form>
                </div>

                {/* Password Section */}
                <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <Lock className="h-5 w-5 text-blue-600 mr-2" />
                        <h2 className="text-lg font-semibold text-slate-800">Change Password</h2>
                    </div>
                    
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter current password"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter new password (min. 6 characters)"
                                required
                                minLength={6}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Confirm new password"
                                required
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <button
                                type="submit"
                                disabled={updating}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {updating ? 'Updating...' : 'Update Password'}
                            </button>
                            
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </form>
                </div>

                {/* MFA Section */}
                <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <Shield className="h-5 w-5 text-blue-600 mr-2" />
                        <h2 className="text-lg font-semibold text-slate-800">Multi-Factor Authentication (MFA)</h2>
                    </div>
                    
                    {mfaEnabled ? (
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-sm text-green-700">MFA is enabled on your account</span>
                            </div>
                            <button
                                onClick={handleDisableMFA}
                                disabled={updating}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Disable MFA
                            </button>
                        </div>
                    ) : enrollingMfa ? (
                        <div>
                            <p className="text-sm text-slate-600 mb-4">
                                Scan the QR code below with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator)
                            </p>
                            
                            {mfaQRCode && (
                                <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200 inline-block">
                                    <div dangerouslySetInnerHTML={{ __html: mfaQRCode }} />
                                </div>
                            )}
                            
                            {mfaSecret && (
                                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">Or enter this secret manually:</p>
                                    <code className="text-sm font-mono text-blue-600 break-all">{mfaSecret}</code>
                                </div>
                            )}
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Enter 6-digit verification code
                                </label>
                                <input
                                    type="text"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-40 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                            </div>
                            
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleVerifyMFA}
                                    disabled={verifyLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                >
                                    {verifyLoading ? 'Verifying...' : 'Verify and Enable MFA'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEnrollingMfa(false);
                                        setMfaQRCode('');
                                        setMfaSecret('');
                                        setMfaCode('');
                                    }}
                                    className="px-4 py-2 bg-slate-500 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <XCircle className="h-5 w-5 text-red-500" />
                                <span className="text-sm text-red-700">MFA is not enabled on your account</span>
                            </div>
                            
                            <p className="text-sm text-slate-600 mb-4">
                                Multi-Factor Authentication adds an extra layer of security to your account.
                                You'll need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
                            </p>
                            
                            <button
                                onClick={handleEnrollMFA}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Smartphone className="h-4 w-4 mr-2" />
                                Enable MFA with Authenticator App
                            </button>
                        </div>
                    )}
                </div>

                {/* Delete Account Section */}
                <div className="bg-white rounded-lg border border-red-200 p-6">
                    <div className="flex items-center mb-4">
                        <Trash2 className="h-5 w-5 text-red-600 mr-2" />
                        <h2 className="text-lg font-semibold text-red-800">Delete Account</h2>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Warning: This action is permanent!</p>
                                <p className="text-sm text-red-700 mt-1">
                                    Deleting your account will permanently remove:
                                </p>
                                <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                                    <li>All your files and folders</li>
                                    <li>Your account and profile information</li>
                                    <li>All activity history and favorites</li>
                                    <li>AI metadata and search data</li>
                                </ul>
                                <p className="text-sm font-medium text-red-800 mt-3">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            Delete My Account
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800 mb-2">
                                    Type <strong className="font-mono bg-red-100 px-1 py-0.5 rounded">DELETE</strong> below to confirm account deletion:
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                                    placeholder="Type DELETE here"
                                    disabled={deletingAccount}
                                />
                            </div>
                            
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deletingAccount ? (
                                        <span className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Deleting...
                                        </span>
                                    ) : (
                                        'Permanently Delete Account'
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText('');
                                    }}
                                    disabled={deletingAccount}
                                    className="px-4 py-2 bg-slate-500 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}