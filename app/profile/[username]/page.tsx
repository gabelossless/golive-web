'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Edit, Search, Video as VideoIcon, Bell } from 'lucide-react';
import CommunityTab from '@/components/CommunityTab';
import VideoCard from '@/components/VideoCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import SubscribeButton from '@/components/SubscribeButton';
import { motion } from 'motion/react';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

export default function ProfilePage() {
    const { username } = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();

    // State
    const [profile, setProfile] = useState<any | null>(null);
    const [videos, setVideos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Videos');
    const [isSubscribed, setIsSubscribed] = useState(false); // Local state for bell UI

    // Derived State
    const isOwner = currentUser?.id === profile?.id;
    const decodedUsername = typeof username === 'string' ? decodeURIComponent(username) : '';

    const tabs = ['Home', 'Videos', 'Shorts', 'Live', 'Playlists', 'Community', 'About'];

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
                        .select('*, profiles(username, avatar_url, is_verified)')
                        .eq('user_id', profileData.id)
                        .order('created_at', { ascending: false });

                    if (!videosError && videosData) {
                        const mappedVideos = videosData.map((v: any) => ({
                            id: v.id,
                            title: v.title,
                            thumbnail_url: v.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop',
                            author: (Array.isArray(v.profiles) ? v.profiles[0] : v.profiles)?.username || 'Unknown',
                            authorAvatar: (Array.isArray(v.profiles) ? v.profiles[0] : v.profiles)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(Array.isArray(v.profiles) ? v.profiles[0] : v.profiles)?.username}`,
                            view_count: v.view_count || 0,
                            created_at: v.created_at,
                            is_verified: (Array.isArray(v.profiles) ? v.profiles[0] : v.profiles)?.is_verified,
                        }));
                        setVideos(mappedVideos);
                    }
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [decodedUsername]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] text-[#FFB800]">
                <div className="animate-spin w-10 h-10 border-4 border-current border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <VideoIcon size={64} className="text-gray-500" />
                <h1 className="text-2xl font-bold m-0">Channel not found</h1>
                <p className="text-gray-400 m-0">The channel you are looking for does not exist.</p>
                <Link href="/" className="px-6 py-2.5 bg-[#FFB800] text-black rounded-full font-bold no-underline mt-2 hover:bg-[#FFB800]/90 transition-colors">Return Home</Link>
            </div>
        );
    }

    const displayName = profile.username;
    const handle = profile.username.toLowerCase().replace(/\s/g, '');
    const avatar = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;

    return (
        <div className="flex flex-col min-h-full">
            {/* Banner */}
            <div className="h-48 md:h-64 bg-gradient-to-r from-[#FFB800] to-orange-700 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-30">
                    <img
                        src={`https://picsum.photos/seed/${profile.username}/1920/400`}
                        alt="Banner"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                </div>
            </div>

            {/* Profile Info */}
            <div className="px-4 md:px-16 lg:px-24 py-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="relative shrink-0">
                        <img
                            src={avatar}
                            alt={displayName}
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#0a0a0a] shadow-xl bg-[#161616]"
                            referrerPolicy="no-referrer"
                        />
                        {/* Example Live Badge logic, could hook up real tracking later */}
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 m-0">
                            {displayName}
                            {profile.is_verified && <CheckCircle2 size={24} className="text-gray-400" />}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-gray-400 text-sm md:text-base">
                            <span className="font-semibold text-white">@{handle}</span>
                            <span>•</span>
                            <span>{profile.follower_count?.toLocaleString() || '0'} subscribers</span>
                            <span>•</span>
                            <span>{videos.length} videos</span>
                        </div>
                        <p className="text-gray-300 text-sm max-w-2xl line-clamp-2 m-0">
                            {profile.bio || "Welcome to my official channel! Subscribe for more content."}
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                            {isOwner ? (
                                <>
                                    <button onClick={() => router.push('/studio')} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition-colors text-white">
                                        Customize Channel
                                    </button>
                                    <button onClick={() => router.push('/studio')} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition-colors text-white">
                                        Manage Videos
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div onClick={() => setIsSubscribed(!isSubscribed)}>
                                        <SubscribeButton channelId={profile.id} />
                                    </div>
                                    {isSubscribed && (
                                        <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                            <Bell size={20} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-8 border-b border-white/10 flex items-center gap-8 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "pb-3 text-sm font-bold uppercase tracking-wider transition-all relative border-none bg-transparent cursor-pointer whitespace-nowrap",
                                activeTab === tab ? "text-white" : "text-gray-400 hover:text-white"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFB800]"
                                />
                            )}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button className="pb-3 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer">
                        <Search size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="py-8">
                    {activeTab === 'Videos' || activeTab === 'Home' ? (
                        videos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                                {videos.map((video) => (
                                    <VideoCard key={video.id} video={video as any} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-16 bg-white/5 rounded-2xl border border-white/10">
                                <VideoIcon size={48} className="text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold m-0">This channel has no videos.</p>
                                {isOwner && (
                                    <Link href="/upload" className="inline-block mt-4 text-[#FFB800] no-underline font-bold hover:underline">
                                        Upload your first video
                                    </Link>
                                )}
                            </div>
                        )
                    ) : activeTab === 'Community' ? (
                        <CommunityTab />
                    ) : (
                        <div className="text-center p-16 text-gray-500">
                            This content is not available yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
