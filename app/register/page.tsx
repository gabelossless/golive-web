'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
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
            if (err) throw err;
            if (data.user && !data.session) { setSuccessEmail(email); setSuccess(true); }
            else if (data.user) { router.push('/'); }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)', padding: 16 }}>
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Check your email</h2>
                    <p style={{ color: 'var(--color-muted)', marginBottom: 6 }}>We sent a confirmation to:</p>
                    <p style={{ color: '#9147ff', fontWeight: 600, marginBottom: 20 }}>{successEmail}</p>
                    <Link href="/login" className="btn btn-primary" style={{ width: '100%', height: 44, borderRadius: 8, justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
                        Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)', padding: 16 }}>
            <div className="auth-card">
                {/* Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#9147ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                        <Sparkles size={22} color="white" strokeWidth={2} />
                    </div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Create your account</h1>
                    <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>Free to join. Start creating today.</p>
                </div>

                {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            required
                            minLength={3}
                            className="form-input"
                        />
                        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>Letters, numbers, and underscores only</p>
                    </div>
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
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                type={showPw ? 'text' : 'password'}
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="form-input"
                                style={{ paddingRight: 44 }}
                            />
                            <button type="button" aria-label="Toggle password" onClick={() => setShowPw(!showPw)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {password.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} style={{
                                            flex: 1, height: 3, borderRadius: 2,
                                            background: i <= pwStrength ? pwColors[pwStrength] : 'var(--color-surface-2)',
                                            transition: 'background 0.2s',
                                        }} />
                                    ))}
                                </div>
                                <p style={{ fontSize: 12, color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password || !username}
                        className="btn btn-primary"
                        style={{ width: '100%', height: 44, fontSize: 15, fontWeight: 600, borderRadius: 8, marginTop: 4, opacity: (loading || !email || !password || !username) ? 0.6 : 1, cursor: (loading || !email || !password || !username) ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? <><Loader2 size={18} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} />Creating account...</> : 'Create account'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>
                        By creating an account, you agree to our{' '}
                        <span style={{ color: '#9147ff', cursor: 'pointer' }}>Terms of Service</span>
                    </p>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                    <div className="divider" style={{ flex: 1 }} />
                    <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Already have an account?</span>
                    <div className="divider" style={{ flex: 1 }} />
                </div>
                <Link href="/login" className="btn btn-outline" style={{ width: '100%', height: 44, fontSize: 15, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Sign in instead
                </Link>
            </div>
        </div>
    );
}
