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
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Join GoLive today</h1>
                        <p className="text-muted/80 text-sm font-medium">Join the next generation of gaming content.</p>
                    </div>

                    <div className="space-y-6">
                        <form onSubmit={handleRegister} className="space-y-4">
                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[13px] p-3.5 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            <div className="auth-input-container">
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="auth-input"
                                    placeholder=" "
                                    required
                                    minLength={3}
                                    maxLength={20}
                                />
                                <label htmlFor="username" className="auth-label">Username</label>
                            </div>

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
                                    minLength={8}
                                />
                                <label htmlFor="password" className="auth-label">Password</label>
                            </div>
                            <p className="text-[11px] text-muted/60 mt-2 pl-1 leading-snug">
                                By signing up, you agree to our Terms of Service and Privacy Policy. Minimum 8 characters required.
                            </p>

                            <button
                                type="submit"
                                disabled={isLoading || isGoogleLoading}
                                className="w-full btn btn-primary h-12 rounded-full font-bold text-sm shadow-[0_4px_15px_rgba(145,71,255,0.2)] disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                            >
                                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Sign Up'}
                            </button>
                        </form>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-muted/40 uppercase tracking-widest">or</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        {/* Google Login */}
                        <button
                            onClick={handleGoogleRegister}
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
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary font-bold hover:text-primary-hover hover:underline transition-colors">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

