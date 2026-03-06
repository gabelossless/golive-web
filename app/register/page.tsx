'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2, Video, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successEmail, setSuccessEmail] = useState('');
    const router = useRouter();

    const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const pwColors = ['', '#ef4444', '#f59e0b', '#10b981'];
    const pwLabels = ['', 'Too short', 'Good', 'Strong'];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase.auth.signUp({
                email, password,
                options: { data: { username } },
            });
            if (err) { setError(err.message); return; }
            if (data?.user) {
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    username,
                    email,
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                });
                setSuccessEmail(email);
                setSuccess(true);
            }
        } catch (e: any) {
            setError(e.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f0f' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-sm px-6"
                >
                    <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Check your email!</h2>
                    <p className="text-gray-400 text-sm mb-1">We sent a confirmation link to:</p>
                    <p className="text-[#9147ff] font-semibold mb-6">{successEmail}</p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'linear-gradient(135deg, #9147ff, #7c3aed)', color: '#fff' }}
                    >
                        Back to Sign in
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto py-12" style={{ background: '#0f0f0f' }}>
            {/* Animated gradient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #9147ff, transparent)' }} />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #dc2626, transparent)' }} />
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
                        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
                        <p className="text-gray-400 text-sm">Free to join. Start creating today.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleRegister} className="px-8 py-8 space-y-5">
                        {error && (
                            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="username">Username</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    minLength={3}
                                    maxLength={20}
                                    pattern="[a-zA-Z0-9_]+"
                                    value={username}
                                    onChange={e => setUsername(e.target.value.toLowerCase())}
                                    placeholder="your_username"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 border"
                                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    onFocus={e => { e.target.style.borderColor = '#9147ff'; e.target.style.boxShadow = '0 0 0 3px rgba(145,71,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Letters, numbers, and underscores only</p>
                        </div>

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
                                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    onFocus={e => { e.target.style.borderColor = '#9147ff'; e.target.style.boxShadow = '0 0 0 3px rgba(145,71,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="password">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    id="password"
                                    type={showPw ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-11 py-3 rounded-xl text-sm outline-none transition-all duration-200 border"
                                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    onFocus={e => { e.target.style.borderColor = '#9147ff'; e.target.style.boxShadow = '0 0 0 3px rgba(145,71,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {/* Strength bar */}
                            {password.length > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex gap-1 flex-1">
                                        {[1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className="h-1 flex-1 rounded-full transition-all duration-300"
                                                style={{ background: pwStrength >= i ? pwColors[pwStrength] : 'rgba(255,255,255,0.1)' }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs font-medium" style={{ color: pwColors[pwStrength] }}>
                                        {pwLabels[pwStrength]}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || pwStrength < 1}
                            className="w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                            style={{
                                background: loading ? 'rgba(145,71,255,0.4)' : 'linear-gradient(135deg, #9147ff, #7c3aed)',
                                color: '#fff',
                                boxShadow: loading ? 'none' : '0 4px 20px rgba(145,71,255,0.35)',
                                opacity: pwStrength < 1 ? 0.5 : 1,
                            }}
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>

                        <p className="text-center text-xs text-gray-500 pt-1">
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="text-[#9147ff] hover:underline">Terms of Service</Link>
                        </p>

                        <p className="text-center text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#9147ff] hover:text-purple-300 font-medium transition-colors">
                                Sign in →
                            </Link>
                        </p>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
