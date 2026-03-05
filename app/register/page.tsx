'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Sparkles, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMode, setSuccessMode] = useState(false);
    const [successEmail, setSuccessEmail] = useState('');
    const router = useRouter();

    const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const strengthColors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-emerald-400'];
    const strengthLabels = ['', 'Too short', 'Good', 'Strong'];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { username } },
            });

            if (authError) throw authError;

            if (authData.user && !authData.session) {
                setSuccessEmail(email);
                setSuccessMode(true);
            } else if (authData.user) {
                router.push('/');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (successMode) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-600/8 blur-[120px] rounded-full" />
                </div>
                <div className="relative w-full max-w-md">
                    <div className="glass-card rounded-3xl p-10 text-center shadow-2xl shadow-black/50">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                            <CheckCircle2 size={32} className="text-emerald-400" />
                        </div>
                        <h2 className="text-display text-2xl font-bold mb-2">Check your email</h2>
                        <p className="text-muted text-sm mb-2">
                            We sent a confirmation link to:
                        </p>
                        <p className="text-violet-400 font-semibold mb-6">{successEmail}</p>
                        <p className="text-muted text-xs mb-6">Click the link in the email to activate your account. Check your spam folder if you don't see it.</p>
                        <Link href="/login" className="btn btn-primary w-full justify-center">
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-cyan-600/8 blur-[100px] rounded-full" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/50">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
                            <Sparkles size={26} className="text-white" strokeWidth={2} />
                        </div>
                        <h1 className="text-display text-2xl font-bold text-foreground mb-1">Join GoLive</h1>
                        <p className="text-muted text-sm">Start creating and streaming today</p>
                    </div>

                    {/* Perks */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {['Free to join', '720p uploads', 'Live streams'].map((perk) => (
                            <div key={perk} className="flex items-center gap-1.5 text-[11px] text-muted-2 bg-surface-2 rounded-lg p-2">
                                <Check size={11} className="text-emerald-400 flex-shrink-0" strokeWidth={3} />
                                <span>{perk}</span>
                            </div>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label htmlFor="username" className="text-sm font-medium text-muted-2">Username</label>
                            <div className="relative">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="yourcoolhandle"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    required
                                    minLength={3}
                                    className="input pl-11"
                                />
                            </div>
                        </div>

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
                            <label htmlFor="password" className="text-sm font-medium text-muted-2">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="input pl-11 pr-12"
                                />
                                <button
                                    type="button"
                                    aria-label="Toggle password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {/* Strength meter */}
                            {password.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-border'}`} />
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-muted">{strengthLabels[passwordStrength]}</p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email || !password || !username}
                            className="btn btn-primary w-full btn-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                            ) : (
                                <>Create Account <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-xs text-muted font-medium">Already have an account?</span>
                        <div className="flex-1 border-t border-border" />
                    </div>

                    <Link href="/login" className="btn btn-secondary w-full justify-center">
                        Sign In Instead
                    </Link>
                </div>

                <p className="text-center text-xs text-muted mt-6">
                    By creating an account, you agree to our{' '}
                    <span className="text-violet-400 cursor-pointer hover:underline">Terms</span>
                    {' & '}
                    <span className="text-violet-400 cursor-pointer hover:underline">Privacy Policy</span>
                </p>
            </div>
        </div>
    );
}
