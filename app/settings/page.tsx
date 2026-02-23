'use client';

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Eye, Moon, Monitor, LogOut, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [theme, setTheme] = useState('dark');

    // Form State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        bio: '',
        avatar_url: '',
    });

    const sections = [
        { label: 'Account', icon: User, id: 'account' },
        { label: 'Notifications', icon: Bell, id: 'notifications' },
        { label: 'Privacy', icon: Shield, id: 'privacy' },
        { label: 'Appearance', icon: Eye, id: 'appearance' },
    ];

    const [activeSection, setActiveSection] = useState('account');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        username: data.username || '',
                        full_name: data.full_name || '',
                        bio: data.bio || '',
                        avatar_url: data.avatar_url || '',
                    });
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    bio: formData.bio,
                    // username is typically restricted in updates for consistency, but we'll allow it if table policies permit
                })
                .eq('id', user.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            router.refresh(); // Refresh to show new data on other pages
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to update profile: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] text-primary">
                <Loader2 size={32} className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-4">
            <h1 className="text-3xl font-black mb-8">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-surface/30 rounded-2xl p-2 border border-border/50">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeSection === section.id
                                    ? 'bg-surface shadow-sm text-foreground ring-1 ring-border'
                                    : 'text-muted hover:text-foreground hover:bg-surface-hover'
                                    }`}
                            >
                                <section.icon size={18} />
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                    {activeSection === 'account' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-border/50 pb-4">Account Information</h2>

                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-surface relative group cursor-pointer">
                                    <img
                                        src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Future: Avatar Upload */}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white">CHANGE</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black">{formData.full_name || formData.username}</h3>
                                    <p className="text-muted text-sm">{user?.email}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4 pt-4">
                                {message && (
                                    <div className={`p-3 rounded-lg text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
                                        }`}>
                                        {message.type === 'success' ? <CheckCircle2 size={16} /> : <Shield size={16} />}
                                        {message.text}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted">Display Name</label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            placeholder="Public Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted">Handle (Username)</label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            disabled
                                            className="w-full bg-surface/50 border border-border rounded-lg px-4 py-2 text-sm text-muted cursor-not-allowed"
                                        />
                                        <p className="text-[10px] text-muted">Username cannot be changed.</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Bio</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 h-24 resize-none"
                                        placeholder="Tell the community about yourself..."
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn btn-primary px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ... other sections unchanged ... */}
                    {activeSection === 'appearance' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-border/50 pb-4">Appearance</h2>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-muted">Theme Preference</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'light' ? 'border-primary bg-surface' : 'border-border/50 hover:border-border'}`}
                                    >
                                        <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center shadow-inner">
                                            <div className="w-16 h-12 bg-white rounded shadow-sm" />
                                        </div>
                                        <span className="text-sm font-bold">Light</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'dark' ? 'border-primary bg-surface' : 'border-border/50 hover:border-border'}`}
                                    >
                                        <div className="w-full h-20 bg-[#0e0e10] rounded-lg flex items-center justify-center shadow-inner">
                                            <div className="w-16 h-12 bg-[#18181b] rounded shadow-sm" />
                                        </div>
                                        <span className="text-sm font-bold">Dark</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme('system')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'system' ? 'border-primary bg-surface' : 'border-border/50 hover:border-border'}`}
                                    >
                                        <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-[#0e0e10] rounded-lg flex items-center justify-center shadow-inner">
                                            <Monitor size={24} className="text-muted" />
                                        </div>
                                        <span className="text-sm font-bold">System</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for others */}
                    {(activeSection === 'notifications' || activeSection === 'privacy') && (
                        <div className="flex flex-col items-center justify-center h-64 text-muted space-y-4">
                            <Shield size={48} className="opacity-20" />
                            <p className="font-bold">This section is coming soon.</p>
                        </div>
                    )}

                    <div className="pt-8 border-t border-border/50">
                        <button
                            onClick={() => signOut()}
                            className="text-destructive font-black text-sm flex items-center gap-2 hover:underline"
                        >
                            <LogOut size={16} /> Sign out of account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
