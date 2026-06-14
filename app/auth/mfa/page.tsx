'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

export default function MFAPage() {
    const [factors, setFactors] = useState<any[]>([]);
    const [selectedFactorId, setSelectedFactorId] = useState<string>('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        checkMFAStatus();
    }, []);

    const checkMFAStatus = async () => {
        try {
            // Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/auth/login');
                return;
            }

            // Check AAL level
            const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            
            // If already at AAL2, redirect to dashboard
            if (aalData?.currentLevel === 'aal2') {
                router.replace('/dashboard');
                return;
            }

            // Get MFA factors
            const { data: factorsData, error } = await supabase.auth.mfa.listFactors();
            
            if (error) throw error;
            
            const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];
            setFactors(verifiedFactors);
            
            if (verifiedFactors.length === 0) {
                setError('No verified MFA factors found. Please enable MFA in settings.');
                setTimeout(() => {
                    router.replace('/dashboard/settings');
                }, 3000);
            } else {
                setSelectedFactorId(verifiedFactors[0].id);
            }
        } catch (error) {
            console.error('MFA check error:', error);
            setError('Failed to load MFA verification');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!code || code.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }
        
        setVerifying(true);
        setError('');
        
        try {
            // Challenge the factor
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: selectedFactorId
            });
            
            if (challengeError) throw challengeError;
            
            // Verify the challenge
            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: selectedFactorId,
                challengeId: challengeData.id,
                code: code
            });
            
            if (verifyError) throw verifyError;
            
            // Redirect to dashboard on success
            router.replace('/dashboard');
        } catch (error: any) {
            console.error('MFA verification error:', error);
            setError(error.message || 'Invalid verification code. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="mt-4 text-white/80">Loading MFA verification...</p>
                </div>
            </div>
        );
    }

    if (error && !factors.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">MFA Not Configured</h2>
                    <p className="text-slate-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.replace('/dashboard/settings')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Go to Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Two-Factor Authentication</h1>
                        <p className="text-slate-500 text-sm mt-1">Enter the code from your authenticator app</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-center text-2xl font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="000000"
                                maxLength={6}
                                autoFocus
                                disabled={verifying}
                            />
                            <p className="text-xs text-slate-400 mt-2">
                                Enter the 6-digit code from Google Authenticator, Authy, or Microsoft Authenticator
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={verifying || !code}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {verifying ? 'Verifying...' : 'Verify and Continue'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                            <Smartphone className="h-3 w-3" />
                            <span>Using authenticator app TOTP verification</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 mt-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Your account is protected with MFA</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}