'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2, Play, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
            <div className="auth-screen relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
                <div className="text-center max-w-[360px] px-6">
                    <div className="w-[72px] h-[72px] rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={36} className="text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Check your email!</h2>
                    <p className="text-sm text-gray-400 mb-1">We sent a confirmation link to:</p>
                    <p className="text-[15px] font-bold text-[#FFB800] mb-7">{successEmail}</p>
                    <Link href="/login" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#FFB800] text-black font-bold text-sm tracking-wide hover:bg-[#e6a600] transition-colors">
                        Back to Sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-screen relative min-h-screen flex items-center justify-center overflow-x-hidden overflow-y-auto bg-[#0a0a0a] py-8">
            {/* Ambient amber glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
                <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,184,0,0.15), transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,184,0,0.1), transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative w-full max-w-[400px] px-4 z-10 m-auto">
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
                        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
                        <p className="text-sm text-gray-400">Free to join. Start creating today.</p>
                    </div>

                    <form onSubmit={handleRegister} className="p-8">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm mb-5 font-bold">
                                {error}
                            </div>
                        )}

                        {/* Username */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <div className="relative group">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" />
                                <input
                                    type="text" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+"
                                    value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="your_username"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all"
                                />
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1.5 font-medium">Letters, numbers, and underscores only</p>
                        </div>

                        {/* Email */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <div className="relative group">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" />
                                <input
                                    type="email" required autoComplete="email"
                                    value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <div className="relative group">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" />
                                <input
                                    type={showPw ? 'text' : 'password'} required minLength={6} autoComplete="new-password"
                                    value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div className="flex items-center gap-2 mt-2.5">
                                    <div className="flex gap-1 flex-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: pwStrength >= i ? pwColors[pwStrength] : 'rgba(255,255,255,0.1)' }} />
                                        ))}
                                    </div>
                                    <span className="text-[11px] font-bold" style={{ color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || pwStrength < 1}
                            className="w-full py-3 rounded-xl font-bold text-sm bg-[#FFB800] text-black hover:bg-[#e6a600] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>

                        <p className="text-center text-[11px] text-gray-500 mt-4 font-medium">
                            By creating an account you agree to our <Link href="/terms" className="text-[#FFB800] hover:underline">Terms</Link>
                        </p>
                        <p className="text-center text-sm text-gray-400 mt-4 font-medium">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#FFB800] hover:underline">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
