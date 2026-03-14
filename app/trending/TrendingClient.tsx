'use client';

import React, { useState, useEffect } from 'react';
import VideoCard from '@/components/VideoCard';
import { supabase } from '@/lib/supabase';
import { rankVideos } from '@/lib/vibe-rank';
import { motion } from 'motion/react';
import { Flame, Activity, Disc, Trophy, Sparkles } from 'lucide-react';

export default function TrendingClient() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTrending() {
            const { data, error } = await supabase
                .from('videos')
                .select(`
                    id, 
                    title, 
                    thumbnail_url, 
                    view_count, 
                    target_views, 
                    created_at, 
                    is_live, 
                    duration, 
                    category, 
                    description, 
                    width, 
                    height,
                    hype_count,
                    profiles (
                        id, 
                        username, 
                        avatar_url,
                        is_verified
                    )
                `)
                .order('created_at', { ascending: false });

            if (!error && data) {
                const normalized = data.map((v: any) => ({
                    ...v,
                    profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
                }));
                
                // Filter and rank
                const pubVideos = normalized.filter(v => !(v.description || '').includes('[PRIVATE_VIDEO_FLAG]'));
                const ranked = rankVideos(pubVideos);
                
                // For Trending, we emphasize recent growth + high hype
                setVideos(ranked);
            }
            setLoading(false);
        }
        fetchTrending();
    }, []);

    return (
        <div className="flex flex-col gap-10 p-6 md:p-12 max-w-[1400px] mx-auto w-full">
            {/* Trending Header */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 py-12 border-b border-white/5 bg-gradient-to-b from-[#FFB800]/5 to-transparent rounded-[48px] px-12">
                <div className="w-24 h-24 rounded-full bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] border-2 border-[#FFB800]/20 shadow-2xl shadow-[#FFB800]/20">
                    <Flame size={48} className="fill-[#FFB800]" />
                </div>
                <div className="text-center md:text-left space-y-2">
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter m-0">Trending</h1>
                    <p className="text-gray-400 font-medium text-lg max-w-xl">The hottest videos on VibeStream right now. Powered by community hype and viral velocity.</p>
                </div>
            </div>

            {/* Content Tabs (Internal Page) */}
            <div className="flex items-center gap-4 border-b border-white/5 pb-6 overflow-x-auto scrollbar-hide">
                <TabItem icon={Activity} label="Now" active />
                <TabItem icon={Disc} label="Music" />
                <TabItem icon={Sparkles} label="Shorts" />
                <TabItem icon={Trophy} label="Gaming" />
            </div>

            {/* Video Grid */}
            <div className="space-y-8">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="animate-pulse space-y-4">
                                <div className="aspect-video bg-white/5 rounded-3xl" />
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-white/5 rounded w-3/4" />
                                        <div className="h-3 bg-white/5 rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                        {videos.map((video, index) => (
                            <motion.div
                                key={video.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <VideoCard video={video} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-32 text-center opacity-30 space-y-4">
                        <Flame size={64} className="mx-auto" />
                        <p className="font-black uppercase tracking-widest text-sm">Nothing is trending yet. Check back soon!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function TabItem({ icon: Icon, label, active = false }: any) {
    return (
        <button className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
            active 
                ? 'bg-white text-black shadow-xl' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
        }`}>
            <Icon size={14} />
            {label}
        </button>
    );
}
