'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, Video, Mail, Lock } from 'lucide-react';

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
        <div className="auth-screen">
            {/* Purple + red gradient blobs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(145,71,255,0.25), transparent 70%)', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,38,38,0.18), transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '0 16px' }}>
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                }}>
                    {/* Header */}
                    <div style={{ padding: '36px 32px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none' }}>
                            <div style={{ position: 'relative' }}>
                                <Video size={30} style={{ color: '#dc2626' }} fill="currentColor" />
                                <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', background: '#9147ff', borderRadius: '50%' }} />
                            </div>
                            <span style={{ fontSize: '22px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
                                Go<span style={{ color: '#9147ff' }}>Live</span>
                            </span>
                        </Link>
                        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: '0 0 4px' }}>Welcome back</h1>
                        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Sign in to your account</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} style={{ padding: '28px 32px 32px' }}>
                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '18px' }}>
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '6px' }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    style={{
                                        width: '100%', paddingLeft: '38px', paddingRight: '14px', paddingTop: '11px', paddingBottom: '11px',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#9147ff'; e.target.style.boxShadow = '0 0 0 3px rgba(145,71,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '500', color: '#d1d5db' }}>Password</label>
                                <Link href="/forgot-password" style={{ fontSize: '12px', color: '#9147ff', textDecoration: 'none' }}>Forgot password?</Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%', paddingLeft: '38px', paddingRight: '42px', paddingTop: '11px', paddingBottom: '11px',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#9147ff'; e.target.style.boxShadow = '0 0 0 3px rgba(145,71,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    aria-label="Toggle password"
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                                >
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '14px',
                                background: loading ? 'rgba(145,71,255,0.4)' : 'linear-gradient(135deg, #9147ff, #7c3aed)',
                                color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: loading ? 'none' : '0 4px 20px rgba(145,71,255,0.35)',
                            }}
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '16px' }}>
                            New to GoLive?{' '}
                            <Link href="/register" style={{ color: '#9147ff', fontWeight: '500', textDecoration: 'none' }}>Create account →</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
