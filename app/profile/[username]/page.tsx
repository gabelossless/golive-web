'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { LayoutGrid, CheckCircle, Edit, Settings, Share2, Loader2, User as UserIcon } from 'lucide-react';
import CommunityTab from '@/components/CommunityTab';
import VideoCard from '@/components/VideoCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Profile, Video } from '@/types';

export default function ProfilePage() {
    const { username } = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();

    // State
    const [profile, setProfile] = useState<Profile | null>(null);
    const [videos, setVideos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Videos');

    // Derived State
    const isOwner = currentUser?.id === profile?.id;
    const decodedUsername = typeof username === 'string' ? decodeURIComponent(username) : '';

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!decodedUsername) return;
            setIsLoading(true);

            try {
                // 1. Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', decodedUsername)
                    .single();

                if (profileError) {
                    // Ignore "Row not found" error, just set profile to null
                    if (profileError.code === 'PGRST116') {
                        setProfile(null);
                        return;
                    }
                    throw profileError;
                }
                setProfile(profileData);

                // 2. Fetch Videos
                if (profileData) {
                    const { data: videosData, error: videosError } = await supabase
                        .from('videos')
                        .select('*, profiles(username, avatar_url)')
                        .eq('user_id', profileData.id)
                        .order('created_at', { ascending: false });

                    if (!videosError && videosData) {
                        const mappedVideos = videosData.map((v: any) => ({
                            id: v.id,
                            title: v.title,
                            thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop',
                            author: v.profiles?.username || 'Unknown',
                            authorAvatar: v.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.profiles?.username}`,
                            views: (v.view_count || 0) + ' views',
                            timestamp: new Date(v.created_at).toLocaleDateString(),
                            duration: '10:00', // Placeholder as DB doesn't have duration yet
                            isVerified: false,
                        }));
                        setVideos(mappedVideos as any);
                    }
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                // If profile not found, likely 404
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [decodedUsername]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] text-primary">
                <Loader2 size={40} className="animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <UserIcon size={64} className="text-muted" />
                <h1 className="text-2xl font-bold">User not found</h1>
                <p className="text-muted">The profile you are looking for does not exist.</p>
                <Link href="/" className="btn btn-primary px-6 py-2 rounded-full font-bold">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="-mt-6 -mx-4 md:-mx-6">
            {/* Banner */}
            <div className="h-44 md:h-64 w-full relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-background to-accent/20" />
                {/* Fallback pattern if no banner_url (which doesn't exist in schema yet) */}
                <div
                    className="absolute inset-0 opacity-40 group-hover:scale-105 transition-transform duration-[20s] linear"
                    style={{
                        backgroundImage: 'url(https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?q=80&w=2670&auto=format&fit=crop)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />

                {isOwner && (
                    <button onClick={() => router.push('/settings')} className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-bold py-2 px-4 rounded-full border border-white/10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit size={14} /> Edit Profile
                    </button>
                )}
            </div>

            <div className="max-w-[1700px] mx-auto px-4 md:px-6">
                {/* Profile header */}
                <div className="relative -mt-12 md:-mt-16 flex flex-col md:flex-row md:items-end gap-5 pb-8 border-b border-border/60">
                    <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-3xl bg-surface border-4 border-background overflow-hidden shadow-2xl relative group">
                            <img
                                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                                alt={profile.username}
                                className="w-full h-full object-cover"
                            />
                            {isOwner && (
                                <button onClick={() => router.push('/settings')} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none outline-none">
                                    <Edit size={24} className="text-white" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter flex items-center gap-2">
                                {profile.full_name || profile.username}
                                {/* Todo: Add verification check */}
                                {false && <CheckCircle size={22} className="text-primary" />}
                            </h1>
                            {isOwner && (
                                <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/20">YOU</span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted font-bold">
                            <span>@{profile.username}</span>
                            <span>{videos.length} <span className="font-medium opacity-60">videos</span></span>
                            {/* Todo: Real subscriber count */}
                            <span>0 <span className="font-medium opacity-60">subscribers</span></span>
                        </div>
                        <p className="text-sm text-foreground/80 mt-2 max-w-2xl leading-relaxed whitespace-pre-wrap">
                            {profile.bio || "No bio yet."}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 md:mb-1">
                        {isOwner ? (
                            <>
                                <button onClick={() => router.push('/settings')} className="btn btn-primary px-6 py-2.5 font-black text-sm rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-all">
                                    EDIT PROFILE
                                </button>
                                <button onClick={() => router.push('/settings')} className="bg-surface hover:bg-surface-hover border border-border/50 rounded-full p-3 transition-all">
                                    <Settings size={20} className="text-foreground" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-primary px-10 py-2.5 font-black text-sm rounded-full shadow-lg shadow-primary/25">
                                    SUBSCRIBE
                                </button>
                                <button className="bg-surface hover:bg-surface-hover border border-border/50 rounded-full p-3 transition-all">
                                    <Share2 size={20} className="text-foreground" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 bg-surface/20 p-1 rounded-2xl mt-6 border border-border/40 overflow-x-auto">
                    {['Videos', 'Live', 'Community', 'About'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none px-6 md:px-8 py-2.5 text-sm font-black rounded-xl transition-all whitespace-nowrap ${tab === activeTab
                                ? 'bg-surface text-foreground shadow-sm ring-1 ring-white/10'
                                : 'text-muted hover:text-foreground'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Section */}
                <div className="py-10 space-y-12">
                    {activeTab === 'Community' ? (
                        <CommunityTab />
                    ) : activeTab === 'Videos' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black flex items-center gap-3">
                                    <LayoutGrid size={24} className="text-primary" />
                                    Videos
                                </h2>
                            </div>
                            {videos.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                                    {videos.map((video) => (
                                        <VideoCard key={video.id} {...video} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-surface/30 rounded-3xl border border-dashed border-border">
                                    <p className="text-muted font-bold">No videos yet.</p>
                                    {isOwner && (
                                        <Link href="/upload" className="text-primary hover:underline text-sm font-bold mt-2 inline-block">
                                            Upload your first video
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-muted">Coming soon...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
