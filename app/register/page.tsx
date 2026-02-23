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
            // 1. Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username },
                },
            });

            if (authError) throw authError;

            // 2. Check for email confirmation requirement
            if (authData.user && !authData.session) {
                // Email confirmation required
                setSuccessEmail(email);
                setSuccessMode(true);
            } else if (authData.user) {
                // 3. Create Profile (if session exists immediately)
                const { error: profileError } = await supabase.from('profiles').insert([
                    {
                        id: authData.user.id,
                        username,
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                    },
                ]);
                if (profileError) {
                    console.error('Profile creation failed', profileError);
                    // Non-blocking error, user is still authed
                }
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
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="w-full max-w-sm glass border border-border rounded-2xl p-8 text-center animate-in fade-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail size={40} className="text-green-500" />
                    </div>
                    <h1 className="text-2xl font-black mb-2">Check your email</h1>
                    <p className="text-muted text-sm mb-6 max-w-xs mx-auto">
                        We sent a confirmation link to <span className="font-bold text-foreground">{successEmail}</span>.
                        <br />Click it to activate your account.
                    </p>
                    <Link href="/login" className="btn btn-primary w-full py-3 rounded-xl font-bold shadow-lg shadow-primary/20">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-sm glass border border-border rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

                <div className="relative text-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25 transform -rotate-3 hover:-rotate-6 transition-transform">
                        <span className="text-white font-black text-2xl">🚀</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Join GoLive</h1>
                    <p className="text-sm text-muted font-medium mt-2">Start your streaming journey today</p>
                </div>

                <div className="space-y-4 relative">
                    <button
                        onClick={handleGoogleRegister}
                        disabled={isGoogleLoading || isLoading}
                        className="w-full bg-white hover:bg-gray-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isGoogleLoading ? (
                            <Loader2 size={20} className="animate-spin text-gray-400" />
                        ) : (
                            <>
                                <Globe size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                <span>Sign up with Google</span>
                            </>
                        )}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-border/50"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-bold text-muted uppercase tracking-wider">Or with email</span>
                        <div className="flex-grow border-t border-border/50"></div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="text-xs font-bold uppercase text-muted mb-2 block ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-surface/50 border border-border/50 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted/30"
                                    required
                                    minLength={3}
                                    maxLength={20}
                                />
                            </div>
                        </div>

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
                            <label htmlFor="password" className="text-xs font-bold uppercase text-muted mb-2 block ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-surface/50 border border-border/50 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted/30"
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isGoogleLoading}
                            className="btn btn-primary w-full py-3.5 font-black rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                        >
                            {isLoading ? <><Loader2 size={18} className="animate-spin" /> Create App Account</> : 'CREATE ACCOUNT'}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-sm text-muted relative font-medium">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
