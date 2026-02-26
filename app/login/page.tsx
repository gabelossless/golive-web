'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader2, Globe, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            router.push('/');
        } catch (err: any) {
            if (err.message.includes('Email not confirmed')) {
                setError('Please check your email to confirm your account.');
            } else {
                setError(err.message || 'Invalid login credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
            // Redirect happens automatically
        } catch (err: any) {
            setError(err.message);
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] selection:bg-primary/30">
            <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out z-10">
                <div className="auth-card rounded-sm p-12 border border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.9)]">
                    <div className="text-center mb-12">
                        <Link href="/" className="inline-block mb-10 group">
                            <span className="text-3xl font-black tracking-tighter text-white uppercase italic">
                                Go<span className="text-primary">Live</span>
                            </span>
                        </Link>
                        <h1 className="text-2xl font-black tracking-[0.2em] text-white mb-2 uppercase italic">BREACH PROTOCOL</h1>
                        <p className="text-white/40 text-[10px] font-black tracking-widest uppercase">SECURE ACCESS REQUIRED</p>
                    </div>

                    <div className="space-y-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-primary/5 border border-primary/20 text-primary text-[10px] font-black p-4 rounded-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-2 tracking-widest uppercase">
                                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="auth-input-container !rounded-sm">
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="auth-input !px-4 !py-4 text-xs font-bold tracking-widest uppercase"
                                        placeholder=" "
                                        required
                                    />
                                    <label htmlFor="email" className="auth-label !text-[9px] !font-black !tracking-[0.2em] !uppercase !left-4">EMAIL_INTEL</label>
                                </div>

                                <div className="auth-input-container !rounded-sm">
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="auth-input !px-4 !py-4 text-xs font-bold tracking-widest uppercase"
                                        placeholder=" "
                                        required
                                    />
                                    <label htmlFor="password" className="auth-label !text-[9px] !font-black !tracking-[0.2em] !uppercase !left-4">PASS_KEY</label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || isGoogleLoading}
                                className="w-full btn btn-primary !h-14 !rounded-sm !text-xs !font-black !tracking-[0.2em] shadow-2xl shadow-primary/20 disabled:opacity-30 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? 'INITIALIZING...' : 'AUTHORIZE ACCESS'}
                            </button>
                        </form>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink-0 mx-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">SECURE_SSO</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        {/* Google SSO */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading || isLoading}
                            className="w-full google-btn-premium !rounded-sm !h-14 !bg-white !text-black !text-[10px] !font-black !tracking-[0.2em] hover:!bg-white/90 active:scale-[0.98]"
                        >
                            {isGoogleLoading ? 'SYNCING...' : 'LOGIN_VIA_GOOGLE'}
                        </button>
                    </div>

                    <p className="mt-12 text-center text-[10px] font-black tracking-widest uppercase text-white/40">
                        NEW RECRUIT?{' '}
                        <Link href="/register" className="text-primary hover:text-white transition-colors">ESTABLISH_LINK</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

