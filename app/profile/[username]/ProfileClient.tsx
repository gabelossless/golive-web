'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Search, Video as VideoIcon, Film, Settings2, Play, LayoutDashboard } from 'lucide-react';
import CommunityTab from '@/components/CommunityTab';
import VideoCard from '@/components/VideoCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import SubscribeButton from '@/components/SubscribeButton';
import { motion } from 'motion/react';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

function formatCount(n?: number): string {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

export default function ProfileClient() {
    const { username } = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<any | null>(null);
    const [allVideos, setAllVideos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Videos');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [themeColor, setThemeColor] = useState('#FFB800');

    const isOwner = currentUser?.id === profile?.id;
    const decodedUsername = typeof username === 'string' ? decodeURIComponent(username) : '';

    const tabs = ['Videos', 'Shorts', 'Live', 'Community', 'About'];

    // Split videos into full videos and shorts
    const longVideos = allVideos.filter(v => !v.is_short);
    const shortVideos = allVideos.filter(v => v.is_short);

    const filteredVideos = (activeTab === 'Shorts' ? shortVideos : longVideos).filter(v =>
        !searchQuery || (v.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        async function fetchProfileData() {
            if (!decodedUsername) return;
            setIsLoading(true);
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', decodedUsername)
                    .single();

                if (profileError) {
                    setProfile(null);
                    return;
                }
                setProfile(profileData);
                if (profileData.channel_color) {
                    setThemeColor(profileData.channel_color);
                }

                if (profileData) {
                    const { data: videosData } = await supabase
                        .from('videos')
                        .select('id, title, thumbnail_url, view_count, created_at, duration, is_live, is_short, profiles(username, avatar_url, is_verified)')
                        .eq('user_id', profileData.id)
                        .order('created_at', { ascending: false })
                        .limit(100);

                    if (videosData) {
                        // No mock fallbacks: if thumbnail is null, it's null
                        const mapped = videosData.map((v: any) => {
                            const prof = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
                            return {
                                ...v,
                                profiles: prof,
                            };
                        });
                        setAllVideos(mapped);
                    }
                }
            } catch (err) {
                console.error('Profile fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfileData();
    }, [decodedUsername]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin w-10 h-10 border-4 border-[#FFB800] border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center px-4">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl">👤</div>
                <h1 className="text-2xl font-black">Channel not found</h1>
                <p className="text-gray-400">The channel @{decodedUsername} doesn't exist.</p>
                <Link href="/" className="px-6 py-2.5 bg-[#FFB800] text-black rounded-full font-bold text-sm hover:bg-[#FFB800]/90 transition-colors">
                    Back to Home
                </Link>
            </div>
        );
    }

    const avatar = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
    const hasBanner = !!profile.banner_url;

    return (
        <div className="flex flex-col min-h-full">
            {/* ── Banner ─────────────────────────────────────────────────── */}
            <div className="h-40 md:h-56 relative overflow-hidden shrink-0">
                {hasBanner ? (
                    <img src={profile.banner_url} alt="Channel banner" className="w-full h-full object-cover" />
                ) : (
                    // Gradient placeholder — no external random images
                    <div
                        className="w-full h-full"
                        style={{
                            background: `linear-gradient(135deg, hsl(${profile.username.charCodeAt(0) * 5 % 360}, 60%, 20%), hsl(${(profile.username.charCodeAt(0) * 5 + 120) % 360}, 60%, 10%))`
                        }}
                    />
                )}
                {/* Subtle bottom fade to page bg */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            </div>

            {/* ── Profile Info ───────────────────────────────────────────── */}
            <div className="px-4 md:px-10 lg:px-16">
                <div className="flex flex-col md:flex-row items-start gap-5 -mt-10 md:-mt-14">
                    {/* Avatar */}
                    <div className="relative shrink-0 z-10">
                        <img
                            src={avatar}
                            alt={profile.username}
                            className="w-24 h-24 md:w-36 md:h-36 rounded-full object-cover border-4 border-[#0a0a0a] shadow-xl bg-[#161616]"
                            referrerPolicy="no-referrer"
                        />
                        {profile.is_live && (
                            <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-[#FFB800] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-lg border border-black/20">
                                <span className="w-1 h-1 bg-black rounded-full animate-pulse" />LIVE
                            </div>
                        )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0 pt-2 md:pt-10">
                        <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                                    {profile.display_name || profile.channel_name || profile.username}
                                    {(profile.is_verified || profile.subscription_tier === 'premium') && (
                                        <CheckCircle2 size={24} className="flex-shrink-0" style={{ color: profile.channel_color || themeColor }} />
                                    )}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-400">
                                    <span className="font-semibold text-gray-300">@{profile.username.toLowerCase()}</span>
                                    <span>·</span>
                                    <span>{formatCount(profile.follower_count)} subscribers</span>
                                    <span>·</span>
                                    <span>{longVideos.length} video{longVideos.length !== 1 ? 's' : ''}</span>
                                    {shortVideos.length > 0 && (
                                        <>
                                            <span>·</span>
                                            <span>{shortVideos.length} short{shortVideos.length !== 1 ? 's' : ''}</span>
                                        </>
                                    )}
                                </div>
                                {profile.bio && (
                                    <p className="text-gray-400 text-sm mt-2 max-w-xl line-clamp-2 leading-relaxed">{profile.bio}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {isOwner ? (
                                    <>
                                        <button onClick={() => router.push('/studio/dashboard')}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition-colors"
                                            title="Open Creator Dashboard">
                                            <LayoutDashboard size={15} /> Dashboard
                                        </button>
                                        <button onClick={() => router.push('/studio/settings')}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition-colors"
                                            title="Channel Settings">
                                            <Settings2 size={15} /> Settings
                                        </button>
                                    </>
                                ) : (
                                    <SubscribeButton channelId={profile.id} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ──────────────────────────────────────────────── */}
                <div className="mt-8 flex items-center gap-1 border-b border-white/10 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'relative pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap border-none bg-transparent cursor-pointer',
                                activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                            )}
                            style={{ color: activeTab === tab ? (profile.channel_color || themeColor) : undefined }}
                        >
                            {tab}
                            {tab === 'Shorts' && shortVideos.length > 0 && (
                                <span 
                                    className="ml-1.5 text-[10px] font-black px-1 py-0 rounded"
                                    style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                                >
                                    {shortVideos.length}
                                </span>
                            )}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                    style={{ backgroundColor: profile.channel_color || themeColor }}
                                />
                            )}
                        </button>
                    ))}
                    <div className="flex-1" />
                    {/* Search within channel */}
                    {showSearch ? (
                        <div className="flex items-center gap-2 pb-2">
                            <input
                                autoFocus
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search this channel..."
                                className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FFB800] w-48"
                                aria-label="Search channel videos"
                                title="Search channel videos"
                            />
                            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                                className="text-xs text-gray-500 hover:text-white pb-1 border-none bg-transparent cursor-pointer">✕</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowSearch(true)}
                            className="pb-3 px-2 text-gray-500 hover:text-white border-none bg-transparent cursor-pointer"
                            aria-label="Search this channel" title="Search this channel">
                            <Search size={18} />
                        </button>
                    )}
                </div>

                {/* ── Content ───────────────────────────────────────────── */}
                <div className="py-8">
                    {(activeTab === 'Videos' || activeTab === 'Shorts') ? (
                        filteredVideos.length > 0 ? (
                            activeTab === 'Shorts' ? (
                                // Shorts grid — taller portrait cards
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                    {filteredVideos.map((video, i) => (
                                        <motion.div key={video.id}
                                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}>
                                            <Link href={`/shorts?id=${video.id}`} className="block group">
                                                <div className="aspect-[9/16] rounded-xl overflow-hidden bg-white/5 relative">
                                                    {video.thumbnail_url ? (
                                                        <img src={video.thumbnail_url} alt={video.title || 'Short'}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Play size={28} className="text-white" />
                                                    </div>
                                                </div>
                                                <p className="mt-2 text-xs font-semibold line-clamp-2 text-gray-300 group-hover:text-white transition-colors">{video.title}</p>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                // Standard video grid
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                                    {filteredVideos.map((video, i) => (
                                        <motion.div key={video.id}
                                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}>
                                            <VideoCard video={{
                                                ...video,
                                                thumbnail_url: video.thumbnail_url ?? undefined
                                            } as any} />
                                        </motion.div>
                                    ))}
                                </div>
                            )
                        ) : (
                            // Premium empty state
                            <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                                <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                    {activeTab === 'Shorts' ? <Film size={32} className="text-gray-600" /> : <VideoIcon size={32} className="text-gray-600" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black">
                                        {searchQuery
                                            ? `No results for "${searchQuery}"`
                                            : activeTab === 'Shorts'
                                                ? 'No Shorts yet'
                                                : 'No videos yet'
                                        }
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {isOwner
                                            ? activeTab === 'Shorts'
                                                ? 'Use the AI Studio to generate your first Short from an existing video.'
                                                : 'Upload your first video to start growing your channel.'
                                            : `${profile.username} hasn't posted any ${activeTab === 'Shorts' ? 'Shorts' : 'videos'} yet.`
                                        }
                                    </p>
                                </div>
                                {isOwner && (
                                    <div className="flex gap-3">
                                        {activeTab === 'Shorts' ? (
                                            <Link href="/studio/ai-studio"
                                                className="px-5 py-2.5 bg-[#FFB800] text-black font-bold rounded-full text-sm hover:bg-[#FFB800]/90 transition-colors">
                                                ✨ Open AI Studio
                                            </Link>
                                        ) : (
                                            <Link href="/upload"
                                                className="px-5 py-2.5 bg-[#FFB800] text-black font-bold rounded-full text-sm hover:bg-[#FFB800]/90 transition-colors">
                                                Upload Video
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    ) : activeTab === 'Community' ? (
                        <CommunityTab />
                    ) : activeTab === 'About' ? (
                        <div className="space-y-8">
                            {/* Bento Grid Header */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="md:col-span-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#FFB800]/20 transition-colors" />
                                    <h2 className="font-black text-2xl mb-4 flex items-center gap-3">
                                        <div className="w-1 h-8 rounded-full" style={{ backgroundColor: themeColor }} />
                                        Channel Story
                                    </h2>
                                    {profile.bio ? (
                                        <p className="text-gray-300 text-base leading-relaxed max-w-xl">{profile.bio}</p>
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">This creator hasn't shared their story yet.</p>
                                    )}
                                </div>

                                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Member Since</p>
                                    <p className="text-4xl font-black tracking-tighter">
                                        {profile.created_at ? new Date(profile.created_at).getFullYear() : '2024'}
                                    </p>
                                    <div className="mt-4 flex gap-1 justify-center">
                                       {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />)}
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Stats Bento */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Subscribers', value: formatCount(profile.follower_count), icon: '👥' },
                                    { label: 'Total Content', value: longVideos.length + shortVideos.length, icon: '🎬' },
                                    { label: 'Viral Shorts', value: shortVideos.length, icon: '⚡' },
                                    { label: 'Ecosystem Vibe', value: 'High', icon: '✨' }
                                ].map((stat, i) => (
                                    <motion.div 
                                        key={i}
                                        whileHover={{ y: -5 }}
                                        className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative group overflow-hidden"
                                    >
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-2xl mb-2">{stat.icon}</div>
                                        <p className="text-2xl font-black">{stat.value}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-gray-600">
                            <p className="text-sm">This section is coming soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
