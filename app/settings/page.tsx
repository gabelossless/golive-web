'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    User, Bell, Shield, Eye, Monitor, LogOut, Loader2, Save, CheckCircle2,
    Camera, Globe, Lock, Search, Clock, Heart, Mail
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { getGhostAvatar, compressImage } from '@/lib/image-utils';

const TABS = [
    { label: 'Account', icon: User, id: 'account' },
    { label: 'Notifications', icon: Bell, id: 'notifications' },
    { label: 'Privacy', icon: Shield, id: 'privacy' },
    { label: 'Appearance', icon: Eye, id: 'appearance' },
];

interface ProfileSettings {
    notify_new_subscriber: boolean;
    notify_new_comment: boolean;
    notify_new_tip: boolean;
    notify_trending: boolean;
    notify_weekly_digest: boolean;
    profile_public: boolean;
    show_wallet_address: boolean;
    allow_search_indexing: boolean;
    show_watch_history: boolean;
}

const DEFAULT_SETTINGS: ProfileSettings = {
    notify_new_subscriber: true,
    notify_new_comment: true,
    notify_new_tip: true,
    notify_trending: false,
    notify_weekly_digest: true,
    profile_public: true,
    show_wallet_address: false,
    allow_search_indexing: true,
    show_watch_history: true,
};

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState('account');
    const [theme, setTheme] = useState('dark');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        bio: '',
        avatar_url: '',
    });

    const [settings, setSettings] = useState<ProfileSettings>(DEFAULT_SETTINGS);

    // ── Load profile + settings ──
    useEffect(() => {
        if (!user) return;
        const load = async () => {
            setLoading(true);
            const [profileRes, settingsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('profile_settings').select('*').eq('user_id', user.id).single(),
            ]);

            if (profileRes.data) {
                setFormData({
                    username: profileRes.data.username || '',
                    full_name: profileRes.data.full_name || '',
                    bio: profileRes.data.bio || '',
                    avatar_url: profileRes.data.avatar_url || '',
                });
            }
            if (settingsRes.data) {
                setSettings({
                    notify_new_subscriber: settingsRes.data.notify_new_subscriber ?? true,
                    notify_new_comment: settingsRes.data.notify_new_comment ?? true,
                    notify_new_tip: settingsRes.data.notify_new_tip ?? true,
                    notify_trending: settingsRes.data.notify_trending ?? false,
                    notify_weekly_digest: settingsRes.data.notify_weekly_digest ?? true,
                    profile_public: settingsRes.data.profile_public ?? true,
                    show_wallet_address: settingsRes.data.show_wallet_address ?? false,
                    allow_search_indexing: settingsRes.data.allow_search_indexing ?? true,
                    show_watch_history: settingsRes.data.show_watch_history ?? true,
                });
            }
            setLoading(false);
        };
        load();
    }, [user]);

    // ── Avatar Upload ──
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setAvatarUploading(true);
        setMessage(null);
        try {
            const compressed = await compressImage(file);
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: `${user.id}_avatar.webp`,
                    contentType: 'image/webp',
                    folder: 'avatars',
                }),
            });
            const { url, path } = await uploadRes.json();
            if (!url) throw new Error('Failed to get upload URL');

            await fetch(url, { method: 'PUT', body: compressed, headers: { 'Content-Type': 'image/webp' } });

            const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${path}`;
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            setMessage({ type: 'success', text: 'Profile picture updated!' });
            router.refresh();
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Avatar upload failed: ' + err.message });
        } finally {
            setAvatarUploading(false);
        }
    };

    // ── Save Account ──
    const handleSaveAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ bio: formData.bio, full_name: formData.full_name })
                .eq('id', user.id);
            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            router.refresh();
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Save failed: ' + err.message });
        } finally {
            setSaving(false);
        }
    };

    // ── Save Notifications / Privacy ──
    const handleSaveSettings = async () => {
        if (!user) return;
        setSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase.rpc('upsert_profile_settings', {
                p_user_id: user.id,
                p_notify_new_subscriber: settings.notify_new_subscriber,
                p_notify_new_comment: settings.notify_new_comment,
                p_notify_new_tip: settings.notify_new_tip,
                p_notify_trending: settings.notify_trending,
                p_notify_weekly_digest: settings.notify_weekly_digest,
                p_profile_public: settings.profile_public,
                p_show_wallet_address: settings.show_wallet_address,
                p_allow_search_indexing: settings.allow_search_indexing,
                p_show_watch_history: settings.show_watch_history,
            });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Settings saved!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Save failed: ' + err.message });
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
                <div className="w-full md:w-56 flex-shrink-0">
                    <div className="bg-surface/30 rounded-2xl p-2 border border-border/50 sticky top-24">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setMessage(null); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === tab.id
                                    ? 'bg-surface shadow-sm text-foreground ring-1 ring-border'
                                    : 'text-muted hover:text-foreground hover:bg-surface-hover'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}

                        <div className="mt-4 pt-4 border-t border-border/50 px-2">
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Panel */}
                <div className="flex-1 animate-in fade-in zoom-in-95 duration-200">
                    {/* Status message */}
                    {message && (
                        <div className={`mb-6 p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                            {message.type === 'success' ? <CheckCircle2 size={16} /> : <Shield size={16} />}
                            {message.text}
                        </div>
                    )}

                    {/* ── ACCOUNT TAB ── */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-border/50 pb-4">Account Information</h2>

                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-surface">
                                        <img
                                            src={formData.avatar_url || getGhostAvatar()}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={avatarUploading}
                                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-all disabled:opacity-50 shadow-lg"
                                        title="Change profile picture"
                                    >
                                        {avatarUploading ? <Loader2 size={14} className="animate-spin text-black" /> : <Camera size={14} className="text-black" />}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        aria-label="Upload profile picture"
                                        title="Upload profile picture"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black">{formData.username}</h3>
                                    <p className="text-muted text-sm">{user?.email}</p>
                                    <p className="text-[11px] text-muted mt-1">Click the camera icon to change your photo</p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveAccount} className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted">Display Name</label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="Your display name"
                                            className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
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

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Changes
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ── NOTIFICATIONS TAB ── */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-border/50 pb-4">Notification Preferences</h2>
                            <p className="text-sm text-muted">Choose what events send you a notification.</p>

                            <div className="space-y-3">
                                <NotifRow
                                    icon={User}
                                    label="New Subscriber"
                                    description="When someone subscribes to your channel"
                                    value={settings.notify_new_subscriber}
                                    onChange={(v) => setSettings(s => ({ ...s, notify_new_subscriber: v }))}
                                />
                                <NotifRow
                                    icon={Heart}
                                    label="New Comment"
                                    description="When someone comments on your video"
                                    value={settings.notify_new_comment}
                                    onChange={(v) => setSettings(s => ({ ...s, notify_new_comment: v }))}
                                />
                                <NotifRow
                                    icon={Heart}
                                    label="New Tip Received"
                                    description="When a viewer sends you a crypto tip"
                                    value={settings.notify_new_tip}
                                    onChange={(v) => setSettings(s => ({ ...s, notify_new_tip: v }))}
                                />
                                <NotifRow
                                    icon={Monitor}
                                    label="Trending Alert"
                                    description="When your video enters the Trending feed"
                                    value={settings.notify_trending}
                                    onChange={(v) => setSettings(s => ({ ...s, notify_trending: v }))}
                                />
                                <NotifRow
                                    icon={Mail}
                                    label="Weekly Digest"
                                    description="A summary of your channel's performance each week"
                                    value={settings.notify_weekly_digest}
                                    onChange={(v) => setSettings(s => ({ ...s, notify_weekly_digest: v }))}
                                />
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="btn btn-primary px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Preferences
                            </button>
                        </div>
                    )}

                    {/* ── PRIVACY TAB ── */}
                    {activeTab === 'privacy' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-border/50 pb-4">Privacy & Visibility</h2>
                            <p className="text-sm text-muted">Control what others can see about you.</p>

                            <div className="space-y-3">
                                <NotifRow
                                    icon={Globe}
                                    label="Public Profile"
                                    description="Allow anyone to view your profile and videos"
                                    value={settings.profile_public}
                                    onChange={(v) => setSettings(s => ({ ...s, profile_public: v }))}
                                />
                                <NotifRow
                                    icon={Lock}
                                    label="Show Wallet Address"
                                    description="Display your wallet address on your public profile"
                                    value={settings.show_wallet_address}
                                    onChange={(v) => setSettings(s => ({ ...s, show_wallet_address: v }))}
                                />
                                <NotifRow
                                    icon={Search}
                                    label="Search Indexing"
                                    description="Allow search engines to index your profile"
                                    value={settings.allow_search_indexing}
                                    onChange={(v) => setSettings(s => ({ ...s, allow_search_indexing: v }))}
                                />
                                <NotifRow
                                    icon={Clock}
                                    label="Show Watch History"
                                    description="Display your recently watched videos on your profile"
                                    value={settings.show_watch_history}
                                    onChange={(v) => setSettings(s => ({ ...s, show_watch_history: v }))}
                                />
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="btn btn-primary px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Privacy Settings
                            </button>
                        </div>
                    )}

                    {/* ── APPEARANCE TAB ── */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold border-b border-border/50 pb-4">Appearance</h2>
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-muted">Theme Preference</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {(['light', 'dark', 'system'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTheme(t)}
                                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === t ? 'border-primary bg-surface' : 'border-border/50 hover:border-border'}`}
                                        >
                                            <div className={`w-full h-16 rounded-lg flex items-center justify-center shadow-inner ${t === 'light' ? 'bg-gray-100' : t === 'dark' ? 'bg-[#0e0e10]' : 'bg-gradient-to-br from-gray-100 to-[#0e0e10]'}`}>
                                                {t === 'system' ? <Monitor size={20} className="text-muted" /> : <div className={`w-14 h-10 rounded shadow-sm ${t === 'light' ? 'bg-white' : 'bg-[#18181b]'}`} />}
                                            </div>
                                            <span className="text-sm font-bold capitalize">{t}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Reusable toggle row ──
function NotifRow({ icon: Icon, label, description, value, onChange }: {
    icon: any; label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-surface/30 border border-border/50 rounded-xl hover:bg-surface/50 transition-all">
            <div className="flex items-start gap-3">
                <Icon size={18} className="text-muted mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-xs text-muted">{description}</p>
                </div>
            </div>
            <button
                role="switch"
                aria-checked={value}
                onClick={() => onChange(!value)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${value ? 'bg-primary' : 'bg-surface'} border border-border`}
            >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
        </div>
    );
}
