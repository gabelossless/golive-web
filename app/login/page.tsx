'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, Play, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);
        setError(null);
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); setLoading(false); }
        else { router.push('/'); router.refresh(); }
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
                    {/* Header */}
                    <div className="pt-10 px-8 pb-6 text-center border-b border-white/5">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6 no-underline">
                            <div className="w-8 h-8 rounded-full bg-[#FFB800] flex items-center justify-center relative">
                                <Play size={16} className="text-black ml-0.5 fill-current" />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tight">
                                Vibe<span className="text-[#FFB800]">Stream</span>
                            </span>
                        </Link>
                        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
                        <p className="text-sm text-gray-400">Sign in to your account to continue</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="p-8">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-5 font-medium">
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <div className="relative group">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" />
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@email.com"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-300">Password</label>
                                <Link href="/forgot-password" className="text-xs text-[#FFB800] hover:underline">Forgot password?</Link>
                            </div>
                            <div className="relative group">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl font-bold text-sm bg-[#FFB800] text-black hover:bg-[#e6a600] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>

                        <p className="text-center text-sm text-gray-400 mt-6 font-medium">
                            New to VibeStream?{' '}
                            <Link href="/register" className="text-[#FFB800] hover:underline">Create account</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
