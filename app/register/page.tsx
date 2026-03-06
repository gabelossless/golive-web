'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2, Video, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successEmail, setSuccessEmail] = useState('');
    const router = useRouter();

    const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const pwColors = ['', '#ef4444', '#f59e0b', '#10b981'];
    const pwLabels = ['', 'Too short', 'Good', 'Strong'];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase.auth.signUp({
                email, password,
                options: { data: { username } },
            });
            if (err) { setError(err.message); return; }
            if (data?.user) {
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    username,
                    email,
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                });
                setSuccessEmail(email);
                setSuccess(true);
            }
        } catch (e: any) {
            setError(e.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-screen">
                <div style={{ textAlign: 'center', maxWidth: '360px', padding: '0 24px' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle2 size={36} style={{ color: '#10b981' }} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Check your email!</h2>
                    <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>We sent a confirmation link to:</p>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#9147ff', marginBottom: '28px' }}>{successEmail}</p>
                    <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #9147ff, #7c3aed)', color: '#fff', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
                        Back to Sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-screen" style={{ overflowY: 'auto', paddingTop: '24px', paddingBottom: '24px' }}>
            {/* Blobs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(145,71,255,0.25), transparent 70%)', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,38,38,0.18), transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '0 16px' }}>
                <div style={{
                    background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                    overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
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
                        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: '0 0 4px' }}>Create your account</h1>
                        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Free to join. Start creating today.</p>
                    </div>

                    <form onSubmit={handleRegister} style={{ padding: '28px 32px 32px' }}>
                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '18px' }}>
                                {error}
                            </div>
                        )}

                        {/* Username */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '6px' }}>Username</label>
                            <div style={{ position: 'relative' }}>
                                <User size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                <input
                                    type="text" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+"
                                    value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="your_username"
                                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '14px', paddingTop: '11px', paddingBottom: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => { e.target.style.borderColor = '#9147ff'; e.target.style.boxShadow = '0 0 0 3px rgba(145,71,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Letters, numbers, and underscores only</p>
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '6px' }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                <input
                                    type="email" required autoComplete="email"
                                    value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '14px', paddingTop: '11px', paddingBottom: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => { e.target.style.borderColor = '#9147ff'; e.target.style.boxShadow = '0 0 0 3px rgba(145,71,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#d1d5db', marginBottom: '6px' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                <input
                                    type={showPw ? 'text' : 'password'} required minLength={6} autoComplete="new-password"
                                    value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '42px', paddingTop: '11px', paddingBottom: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    onFocus={e => { e.target.style.borderColor = '#9147ff'; e.target.style.boxShadow = '0 0 0 3px rgba(145,71,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} aria-label="Toggle password visibility"
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                    <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} style={{ height: '4px', flex: 1, borderRadius: '2px', background: pwStrength >= i ? pwColors[pwStrength] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || pwStrength < 1}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '14px',
                                background: loading ? 'rgba(145,71,255,0.4)' : 'linear-gradient(135deg, #9147ff, #7c3aed)',
                                color: '#fff', border: 'none', cursor: (loading || pwStrength < 1) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: loading ? 'none' : '0 4px 20px rgba(145,71,255,0.35)',
                                opacity: pwStrength < 1 ? 0.5 : 1,
                            }}
                        >
                            {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', marginTop: '12px' }}>
                            By creating an account you agree to our <Link href="/terms" style={{ color: '#9147ff', textDecoration: 'none' }}>Terms</Link>
                        </p>
                        <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '12px' }}>
                            Already have an account?{' '}
                            <Link href="/login" style={{ color: '#9147ff', fontWeight: '500', textDecoration: 'none' }}>Sign in →</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
