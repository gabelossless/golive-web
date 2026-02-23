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
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-sm glass border border-border rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                {/* Glow effects */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

                <div className="relative text-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25 transform rotate-3 hover:rotate-6 transition-transform">
                        <span className="text-white font-black text-2xl">⚡</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Welcome Back</h1>
                    <p className="text-sm text-muted font-medium mt-2">Log in to continue your streak</p>
                </div>

                <div className="space-y-4 relative">
                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading || isLoading}
                        className="w-full bg-white hover:bg-gray-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isGoogleLoading ? (
                            <Loader2 size={20} className="animate-spin text-gray-400" />
                        ) : (
                            <>
                                <Globe size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                <span>Sign in with Google</span>
                            </>
                        )}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-border/50"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-bold text-muted uppercase tracking-wider">Or with email</span>
                        <div className="flex-grow border-t border-border/50"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {successMsg && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-sm p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
                                <span className="font-medium">{successMsg}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="text-xs font-bold uppercase text-muted mb-2 block ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-surface/50 border border-border/50 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted/30"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 ml-1">
                                <label htmlFor="password" className="text-xs font-bold uppercase text-muted">Password</label>
                                <Link href="#" className="text-xs text-primary font-bold hover:underline">Forgot password?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-surface/50 border border-border/50 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted/30"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isGoogleLoading}
                            className="btn btn-primary w-full py-3.5 font-black rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                        >
                            {isLoading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'SIGN IN'}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-sm text-muted relative font-medium">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-primary font-bold hover:underline">Create Account</Link>
                </p>
            </div>
        </div>
    );
}
