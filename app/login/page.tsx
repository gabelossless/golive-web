'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);
        setError(null);
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); setLoading(false); }
        else { router.push('/'); router.refresh(); }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-background)', padding: 16,
        }}>
            <div className="auth-card">
                {/* Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: '#9147ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 14,
                    }}>
                        <Sparkles size={22} color="white" strokeWidth={2} />
                    </div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Sign in to GoLive</h1>
                    <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>Watch, upload, and connect with creators</p>
                </div>

                {error && (
                    <div className="alert-error" style={{ marginBottom: 16 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <label style={{ fontSize: 14, fontWeight: 500 }}>Password</label>
                            <button type="button" style={{ fontSize: 13, color: '#9147ff', background: 'none', border: 'none', cursor: 'pointer' }}>
                                Forgot password?
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                type={showPw ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="form-input"
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                aria-label="Toggle password"
                                onClick={() => setShowPw(!showPw)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="btn btn-primary"
                        style={{ width: '100%', height: 44, fontSize: 15, fontWeight: 600, borderRadius: 8, marginTop: 4, opacity: (loading || !email || !password) ? 0.6 : 1, cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign in'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                    <div className="divider" style={{ flex: 1 }} />
                    <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>New to GoLive?</span>
                    <div className="divider" style={{ flex: 1 }} />
                </div>

                <Link href="/register" className="btn btn-outline" style={{ width: '100%', height: 44, fontSize: 15, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Create account
                </Link>
            </div>
        </div>
    );
}
