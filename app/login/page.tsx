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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0e0e10] selection:bg-primary/30">
            {/* Minimal Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[0%] left-[-10%] w-[50%] h-[50%] bg-primary/3 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/3 rounded-full blur-[150px]" />
            </div>

            <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out z-10">
                <div className="auth-card rounded-2xl p-10 sm:p-12 relative overflow-hidden">
                    <div className="text-center mb-10">
                        <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                                <span className="text-white font-black text-xl">GL</span>
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-foreground">GoLive</span>
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Log in to GoLive</h1>
                        <p className="text-muted/80 text-sm font-medium">Continue your streak</p>
                    </div>

                    <div className="space-y-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[13px] p-3.5 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            {successMsg && (
                                <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-[13px] p-3.5 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">{successMsg}</span>
                                </div>
                            )}

                            <div className="auth-input-container">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="auth-input"
                                    placeholder=" "
                                    required
                                />
                                <label htmlFor="email" className="auth-label">Email address</label>
                            </div>

                            <div className="auth-input-container">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="auth-input"
                                    placeholder=" "
                                    required
                                />
                                <label htmlFor="password" className="auth-label">Password</label>
                            </div>

                            <div className="text-left mt-[-4px] mb-2">
                                <Link href="#" className="text-xs text-primary font-bold hover:text-primary-hover hover:underline transition-colors">Trouble logging in?</Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || isGoogleLoading}
                                className="w-full btn btn-primary h-12 rounded-full font-bold text-sm shadow-[0_4px_15px_rgba(145,71,255,0.2)] disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                            >
                                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Logging in...</> : 'Log In'}
                            </button>
                        </form>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-muted/40 uppercase tracking-widest">or</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        {/* Google Login */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading || isLoading}
                            className="w-full google-btn-premium group"
                        >
                            {isGoogleLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" className="mr-1 group-hover:scale-110 transition-transform">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>
                    </div>

                    <p className="mt-8 text-center text-sm text-muted/80 font-medium">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-primary font-bold hover:text-primary-hover hover:underline transition-colors">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

