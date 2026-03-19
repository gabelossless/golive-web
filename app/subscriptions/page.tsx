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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center">
                        <Compass className="text-primary" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Your Subscriptions</h1>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-full text-sm font-bold shadow-lg shadow-foreground/10 hover:opacity-90 transition-opacity whitespace-nowrap" title="Show all videos from your subscriptions">
                        All Videos
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover rounded-full text-sm font-medium border border-border transition-colors whitespace-nowrap" title="Filter by today">
                        Today
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover rounded-full text-sm font-medium border border-border transition-colors whitespace-nowrap" title="Filter by live now">
                        Live Now
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover rounded-full text-sm font-medium border border-border transition-colors whitespace-nowrap" title="Continue watching">
                        Continue Watching
                    </button>
                    <button className="p-2 hover:bg-surface-hover rounded-full transition-colors ml-2">
                        <Filter size={20} className="text-muted" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20 text-[#FFB800]">
                    <Loader2 size={40} className="animate-spin" />
                </div>
            ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-surface/30 rounded-[40px] border border-border/50">
                    <Music2 size={64} className="text-muted mb-4 opacity-20" />
                    <p className="text-xl font-bold mb-2">No videos yet</p>
                    <p className="text-muted max-w-xs text-center">Subscribe to your favorite creators to see their latest uploads here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
