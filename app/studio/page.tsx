'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Camera, Save, User as UserIcon, Mail, Lock, Bell, Shield, Globe } from 'lucide-react';
import Link from 'next/link';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

export default function StudioPage() {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState("Profile");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [socialLinks, setSocialLinks] = useState<any>({});

    const bannerPreview = bannerUrl || `https://picsum.photos/seed/${displayName}/1920/400`;

    const tabs = [
        { id: "Profile", icon: UserIcon },
        { id: "Account", icon: Mail },
        { id: "Privacy", icon: Shield },
        { id: "Notifications", icon: Bell },
    ];

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.username || '');
            setBio(profile.bio || '');
            setBannerUrl((profile as any).banner_url || '');
            setSocialLinks((profile as any).social_links || {});
            setLoading(false);
        } else if (user) {
            setLoading(false);
        }
    }, [user, profile]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: displayName,
                    bio: bio,
                    banner_url: bannerUrl,
                    social_links: socialLinks,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            alert('Profile updated successfully!');
        } catch (err: any) {
            console.error('Error saving profile:', err);
            alert('Error saving profile: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            const formData = new FormData();
            const filename = `banner_${user.id}_${Date.now()}.${file.name.split('.').pop()}`;

            // Re-use upload API or implement direct to R2/Supabase
            // For now, let's assume we use the /api/upload we built
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, contentType: file.type, folder: `banners/${user.id}` }),
            });
            const { url, path } = await res.json();

            await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });

            const baseUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');
            setBannerUrl(`${baseUrl}/${path}`);
        } catch (err) {
            console.error('Banner upload failed:', err);
        }
    };

    if (!user && !loading) {
        return (
            <div className="flex justify-center p-16 text-gray-400">
                Please log in to view your settings.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] text-[#FFB800]">
                <div className="animate-spin w-10 h-10 border-4 border-current border-t-transparent rounded-full" />
            </div>
        );
    }

    const sidebarDisplayName = profile?.username || user?.email?.split('@')[0] || 'User';
    const sidebarHandle = sidebarDisplayName.toLowerCase().replace(/\s/g, '');
    const avatar = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}&backgroundColor=FFB800`;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 flex-1 w-full">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 space-y-2 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium border-none cursor-pointer",
                                activeTab === tab.id
                                    ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20 font-black uppercase tracking-widest text-xs"
                                    : "bg-transparent text-gray-400 hover:bg-white/5 hover:text-white font-bold uppercase tracking-widest text-xs"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.id}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-[#1a1a1a] rounded-2xl border border-white/5 p-6 md:p-8">
                    {activeTab === "Profile" && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight mb-1 text-white m-0">Profile Information</h2>
                                <p className="text-sm text-gray-500 font-medium m-0">Update your channel details and public presence.</p>
                            </div>

                            {/* Avatar & Banner */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-3">Profile Picture</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group cursor-pointer" title="Change Profile Picture">
                                            <img
                                                src={avatar}
                                                alt={`${sidebarDisplayName}'s Avatar`}
                                                className="w-24 h-24 rounded-full object-cover border-2 border-white/10 group-hover:opacity-50 transition-opacity bg-black"
                                                referrerPolicy="no-referrer"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera size={24} className="text-white" aria-hidden="true" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <button
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-white border-none cursor-pointer"
                                                aria-label="Change Profile Picture"
                                            >
                                                Change Picture
                                            </button>
                                            <p className="text-xs text-gray-500 m-0">Recommended: 800x800px. Max 2MB.</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-3">Channel Banner</label>
                                    <div className="relative h-32 rounded-xl overflow-hidden bg-white/5 group cursor-pointer border border-white/10" onClick={() => (document.getElementById('banner-input') as HTMLInputElement)?.click()} title="Change Channel Banner">
                                        <input type="file" id="banner-input" className="hidden" accept="image/*" onChange={handleBannerUpload} aria-label="Upload Channel Banner" />
                                        <img
                                            src={bannerPreview}
                                            alt={`${sidebarDisplayName}'s Channel Banner`}
                                            className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={32} className="text-white" aria-hidden="true" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#FFB800] transition-colors"
                                        title="Display Name"
                                        placeholder="Your channel name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Bio / Description</label>
                                    <textarea
                                        rows={4}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#FFB800] transition-colors resize-none"
                                        placeholder="Tell your viewers about your channel..."
                                        title="Bio"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Website / Link</label>
                                    <input
                                        type="text"
                                        value={socialLinks.website || ''}
                                        onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#FFB800] transition-colors"
                                        placeholder="https://yourwebsite.com"
                                        title="Website URL"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex justify-end gap-3 mt-8">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-[#FFB800] hover:bg-[#FFB800]/90 text-black rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-[#FFB800]/20 active:scale-95 border-none cursor-pointer disabled:opacity-50"
                                >
                                    <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "Account" && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight mb-1 text-white m-0">Account Settings</h2>
                                <p className="text-sm text-gray-500 font-medium m-0">Manage your email, password, and connected accounts.</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        defaultValue={user?.email || ""}
                                        disabled
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-gray-400 focus:outline-none focus:border-[#FFB800] transition-colors cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">To change your email address, please contact support.</p>
                                </div>
                                <button className="text-[#FFB800] text-xs font-black uppercase tracking-widest hover:underline border-none bg-transparent cursor-pointer p-0">Change Password</button>
                            </div>
                        </div>
                    )}

                    {(activeTab === "Privacy" || activeTab === "Notifications") && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                            <Globe size={48} className="opacity-20" />
                            <p className="font-medium text-sm">More settings coming soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
