'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Loader2, Play } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Supabase populates the session automatically from the URL hash
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Not authenticated/invalid token
                // We'll let the user know if they try to reset
            }
        };
        checkSession();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
        } else {
            // Success, redirect to login
            router.push('/login?message=Password updated successfully');
        }
        setLoading(false);
    };

    return (
        <div className="auth-screen relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
            {/* Ambient amber glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,184,0,0.15), transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,184,0,0.1), transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative w-full max-w-[400px] px-4 z-10">
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="pt-8 px-8 pb-6 border-b border-white/5">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6 no-underline">
                            <div className="w-8 h-8 rounded-full bg-[#FFB800] flex items-center justify-center relative">
                                <Play size={16} className="text-black ml-0.5 fill-current" />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tight">
                                Vibe<span className="text-[#FFB800]">Stream</span>
                            </span>
                        </Link>
                        <h1 className="text-2xl font-bold text-white mb-1">Set New Password</h1>
                        <p className="text-sm text-gray-400">Secure your account with a strong new password.</p>
                    </div>

                    <form onSubmit={handleUpdate} className="p-8">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-5 font-medium">
                                {error}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                            <div className="relative group">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                            <div className="relative group">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password || !confirmPassword}
                            className="w-full py-3 rounded-xl font-bold text-sm bg-[#FFB800] text-black hover:bg-[#e6a600] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? 'Updating...' : 'Set Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
