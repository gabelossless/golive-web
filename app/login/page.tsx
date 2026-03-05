'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setIsLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            setError(authError.message);
            setIsLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-cyan-600/8 blur-[100px] rounded-full" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/50">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
                            <Sparkles size={26} className="text-white" strokeWidth={2} />
                        </div>
                        <h1 className="text-display text-2xl font-bold text-foreground mb-1">Welcome back</h1>
                        <p className="text-muted text-sm">Sign in to your GoLive account</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-muted-2">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="input pl-11"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium text-muted-2">Password</label>
                                <button type="button" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="input pl-11 pr-12"
                                />
                                <button
                                    type="button"
                                    aria-label="Toggle password visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="btn btn-primary w-full btn-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                            ) : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-xs text-muted font-medium">New here?</span>
                        <div className="flex-1 border-t border-border" />
                    </div>

                    {/* Register link */}
                    <Link href="/register" className="btn btn-secondary w-full justify-center">
                        Create an account
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted mt-6">
                    By signing in, you agree to our{' '}
                    <span className="text-violet-400 cursor-pointer hover:underline">Terms</span>
                    {' & '}
                    <span className="text-violet-400 cursor-pointer hover:underline">Privacy Policy</span>
                </p>
            </div>
        </div>
    );
}
