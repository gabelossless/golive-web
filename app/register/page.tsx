'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, AlertCircle, Loader2, Globe, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMode, setSuccessMode] = useState(false);
    const [successEmail, setSuccessEmail] = useState('');
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Sign up user via Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username }, // Backend DB Trigger handles inserting this into `profiles`
                },
            });

            if (authError) throw authError;

            // 2. Check for email confirmation requirement or proceed
            if (authData.user && !authData.session) {
                // Email confirmation required
                setSuccessEmail(email);
                setSuccessMode(true);
            } else if (authData.user) {
                // Trigger created profile automatically, just redirect
                router.push('/');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
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
        } catch (err: any) {
            setError(err.message);
            setIsGoogleLoading(false);
        }
    };

    if (successMode) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#0e0e10]">
                <div className="w-full max-w-[440px] auth-card rounded-2xl p-10 sm:p-12 text-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-16 h-16 bg-green-500/10 rounded-[18px] flex items-center justify-center mx-auto mb-6">
                        <Mail size={32} className="text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3 text-white tracking-tight">Check your inbox</h1>
                    <p className="text-muted/80 text-sm mb-8 leading-relaxed">
                        We've sent a magic link to <span className="text-white font-semibold">{successEmail}</span>.
                        Please check your inbox to finish.
                    </p>
                    <Link href="/login" className="w-full btn btn-primary h-12 rounded-full font-bold text-sm flex items-center justify-center shadow-[0_4px_15px_rgba(145,71,255,0.2)] transition-all active:scale-[0.98]">
                        Return to Log In
                    </Link>
                </div>
            </div>
        );
    }

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
                        <h1 className="text-2xl font-black tracking-[0.2em] text-white mb-2 uppercase italic">ESTABLISH_LINK</h1>
                        <p className="text-white/40 text-[10px] font-black tracking-widest uppercase">NEW SECURE ENROLLMENT</p>
                    </div>

                    <div className="space-y-8">
                        <form onSubmit={handleRegister} className="space-y-6">
                            {error && (
                                <div className="bg-primary/5 border border-primary/20 text-primary text-[10px] font-black p-4 rounded-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-2 tracking-widest uppercase">
                                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="auth-input-container !rounded-sm">
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="auth-input !px-4 !py-4 text-xs font-bold tracking-widest uppercase"
                                        placeholder=" "
                                        required
                                        minLength={3}
                                        maxLength={20}
                                    />
                                    <label htmlFor="username" className="auth-label !text-[9px] !font-black !tracking-[0.2em] !uppercase !left-4">CODENAME</label>
                                </div>

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
                                        minLength={8}
                                    />
                                    <label htmlFor="password" className="auth-label !text-[9px] !font-black !tracking-[0.2em] !uppercase !left-4">PASS_KEY</label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || isGoogleLoading}
                                className="w-full btn btn-primary !h-14 !rounded-sm !text-xs !font-black !tracking-[0.2em] shadow-2xl shadow-primary/20 disabled:opacity-30 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? 'INITIALIZING...' : 'CREATE_IDENTITY'}
                            </button>
                        </form>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink-0 mx-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">SECURE_SSO</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        {/* Google SSO */}
                        <button
                            onClick={handleGoogleRegister}
                            disabled={isGoogleLoading || isLoading}
                            className="w-full google-btn-premium !rounded-sm !h-14 !bg-white !text-black !text-[10px] !font-black !tracking-[0.2em] hover:!bg-white/90 active:scale-[0.98]"
                        >
                            {isGoogleLoading ? 'SYNCING...' : 'ENROLL_VIA_GOOGLE'}
                        </button>
                    </div>

                    <p className="mt-12 text-center text-[10px] font-black tracking-widest uppercase text-white/40">
                        ALREADY ENROLLED?{' '}
                        <Link href="/login" className="text-primary hover:text-white transition-colors">AUTHORIZE_ACCESS</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

