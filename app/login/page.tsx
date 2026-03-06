'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, Video, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: '#0f0f0f' }}>
            {/* Animated gradient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #9147ff, transparent)' }} />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #dc2626, transparent)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #9147ff, #dc2626)' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-md px-4"
            >
                <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60"
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>

                    {/* Header */}
                    <div className="px-8 pt-10 pb-6 text-center border-b border-white/5">
                        <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
                            <div className="relative">
                                <Video className="text-red-600 group-hover:scale-110 transition-transform" size={32} fill="currentColor" />
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#9147ff] rounded-full animate-pulse" />
                            </div>
                            <span className="text-2xl font-bold tracking-tighter">
                                Go<span className="text-[#9147ff]">Live</span>
                            </span>
                        </Link>
                        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
                        <p className="text-gray-400 text-sm">Sign in to your account</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="px-8 py-8 space-y-5">
                        {error && (
                            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="email">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 border"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#9147ff'; e.target.style.boxShadow = '0 0 0 3px rgba(145,71,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-gray-300" htmlFor="password">Password</label>
                                <Link href="/forgot-password" className="text-xs text-[#9147ff] hover:text-purple-300 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    id="password"
                                    type={showPw ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-11 py-3 rounded-xl text-sm outline-none transition-all duration-200 border"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#9147ff'; e.target.style.boxShadow = '0 0 0 3px rgba(145,71,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    aria-label="Toggle password"
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                            style={{
                                background: loading ? 'rgba(145,71,255,0.4)' : 'linear-gradient(135deg, #9147ff, #7c3aed)',
                                color: '#fff',
                                boxShadow: loading ? 'none' : '0 4px 20px rgba(145,71,255,0.35)',
                            }}
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>

                        <p className="text-center text-sm text-gray-400 pt-2">
                            New to GoLive?{' '}
                            <Link href="/register" className="text-[#9147ff] hover:text-purple-300 font-medium transition-colors">
                                Create an account →
                            </Link>
                        </p>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
