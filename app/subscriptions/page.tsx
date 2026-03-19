'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Music2, Compass, Filter } from 'lucide-react';
import { Video } from '@/types';
import VideoCard from '@/components/VideoCard';

export default function SubscriptionsPage() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchSubscribedVideos();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchSubscribedVideos = async () => {
        setLoading(true);
        try {
            // 1. Get channel IDs the user follows
            const { data: subs } = await supabase
                .from('subscriptions')
                .select('channel_id')
                .eq('subscriber_id', user?.id);

            if (!subs || subs.length === 0) {
                setVideos([]);
                return;
            }

            const channelIds = subs.map(s => s.channel_id);

            // 2. Get latest videos from those channels
            const { data, error } = await supabase
                .from('videos')
                .select('*, profiles(id, username, avatar_url, is_verified, display_name, channel_name)')
                .in('user_id', channelIds)
                .order('created_at', { ascending: false })
                .limit(24);

            if (error) throw error;

            const formatted = (data || []).map(v => ({
                ...v,
                profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
            }));

            setVideos(formatted as any);
        } catch (err) {
            console.error('Error fetching subscriptions:', err);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 p-8 rounded-[32px] bg-white/[0.02] backdrop-blur-3xl border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/5 to-transparent opacity-50" />
                <div className="flex items-center gap-5 relative">
                    <div className="w-14 h-14 rounded-2xl bg-[#FFB800]/10 flex items-center justify-center border border-[#FFB800]/20 shadow-lg group-hover:scale-110 transition-transform duration-700">
                        <Compass size={28} className="text-[#FFB800] drop-shadow-[0_0_10px_#FFB800]" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter m-0 italic font-premium text-gradient">Subscriptions</h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Latest from your circle</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 relative z-10">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-white/10 hover:scale-105 transition-all whitespace-nowrap" title="Show all videos from your subscriptions">
                        All Videos
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all whitespace-nowrap text-zinc-400 hover:text-white" title="Filter by today">
                        Today
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all whitespace-nowrap text-zinc-400 hover:text-white" title="Filter by live now">
                        Live Now
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all whitespace-nowrap text-zinc-400 hover:text-white" title="Continue watching">
                        Continue Watching
                    </button>
                    <button className="p-2 hover:bg-surface-hover rounded-full transition-colors ml-2">
                        <Filter size={20} className="text-muted" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-x-6 gap-y-10">
                    {Array.from({ length: 12 }).map((_, i) => (
                         <div key={i} className="animate-pulse space-y-4">
                             <div className="aspect-video bg-white/5 rounded-xl" />
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
            ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] rounded-[40px] border border-white/5 shadow-inner">
                    <Music2 size={64} className="text-[#FFB800] mb-6 opacity-20" />
                    <p className="text-2xl font-black uppercase tracking-tighter mb-2">Silence is golden, but content is better</p>
                    <p className="text-zinc-500 max-w-xs text-center text-xs font-bold uppercase tracking-widest">Subscribe to creators to populate this vibe feed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-x-6 gap-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {videos.map((video) => (
                        <VideoCard
                            key={video.id}
                            video={{
                                ...video,
                                thumbnail_url: video.thumbnail_url ?? undefined
                            } as any}
                        />
                    ))}
                </div>
            )}

            {!loading && videos.length > 0 && (
                <div className="mt-12 text-center">
                    <p className="text-muted text-sm font-medium uppercase tracking-widest">You&apos;re all caught up!</p>
                </div>
            )}
        </div>
    );
}
