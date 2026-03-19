'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Mail, Play, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="auth-screen relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
                <div className="relative w-full max-w-[400px] px-4 z-10">
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
                        <p className="text-sm text-gray-400 mb-8">
                            We've sent a password reset link to <span className="text-[#FFB800]">{email}</span>.
                        </p>
                        <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors">
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors mb-6">
                            <ArrowLeft size={16} />
                            Back
                        </Link>
                        <br />
                        <Link href="/" className="inline-flex items-center gap-2 mb-6 no-underline">
                            <div className="w-8 h-8 rounded-full bg-[#FFB800] flex items-center justify-center relative">
                                <Play size={16} className="text-black ml-0.5 fill-current" />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tight">
                                Vibe<span className="text-[#FFB800]">Stream</span>
                            </span>
                        </Link>
                        <h1 className="text-2xl font-bold text-white mb-1">Reset Password</h1>
                        <p className="text-sm text-gray-400">Enter your email and we'll send you a link to reset your password.</p>
                    </div>

                    <form onSubmit={handleReset} className="p-8">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-5 font-medium">
                                {error}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <div className="relative group">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl font-bold text-sm bg-[#FFB800] text-black hover:bg-[#e6a600] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? 'Sending link...' : 'Send Reset Link'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
