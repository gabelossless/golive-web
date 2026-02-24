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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a] selection:bg-primary/30">
            {/* Minimal Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
                <div className="auth-card rounded-[2rem] p-10 relative overflow-hidden">
                    <div className="text-center mb-10">
                        <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                                <span className="text-white font-black text-xl">GL</span>
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-foreground">GoLive</span>
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Sign in</h1>
                        <p className="text-muted/60 text-sm font-medium">Stream, watch, and engage with the world.</p>
                    </div>

                    <div className="space-y-6">
                        {/* Google Login */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading || isLoading}
                            className="w-full google-btn-premium h-12 rounded-full font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {isGoogleLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-muted/40 uppercase tracking-widest">or email</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[13px] p-3.5 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            <div>
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full auth-input h-12 rounded-2xl px-5 text-sm font-medium focus:outline-none placeholder:text-muted/30 text-white"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full auth-input h-12 rounded-2xl px-5 text-sm font-medium focus:outline-none placeholder:text-muted/30 text-white"
                                    required
                                />
                                <div className="text-right">
                                    <Link href="#" className="text-xs text-primary/80 font-semibold hover:text-primary transition-colors">Forgot password?</Link>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || isGoogleLoading}
                                className="w-full btn btn-primary h-12 rounded-full font-bold text-sm shadow-xl shadow-primary/10 disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Sign In'}
                            </button>
                        </form>
                    </div>

                    <p className="mt-10 text-center text-sm text-muted/50 font-medium">
                        New to GoLive?{' '}
                        <Link href="/register" className="text-white font-bold hover:text-primary transition-colors">Create account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

