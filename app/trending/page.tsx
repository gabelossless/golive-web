'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatViews, timeAgo } from '@/lib/utils';
import { Flame, TrendingUp, Trophy, Loader2, Eye, Clock } from 'lucide-react';

interface TrendingVideo {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    video_url: string;
    view_count: number;
    target_views: number;
    created_at: string;
    profiles: {
        username: string;
        avatar_url: string;
    };
}

export default function TrendingPage() {
    const [videos, setVideos] = useState<TrendingVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

    useEffect(() => {
        fetchTrending();
    }, [timeRange]);

    const fetchTrending = async () => {
        setLoading(true);
        try {
            // Calculate date range
            const now = new Date();
            let sinceDate = new Date();
            if (timeRange === 'today') sinceDate.setHours(sinceDate.getHours() - 24);
            else if (timeRange === 'week') sinceDate.setDate(sinceDate.getDate() - 7);
            else sinceDate.setDate(sinceDate.getDate() - 30);

            const { data, error } = await supabase
                .from('videos')
                .select(`
                    id,
                    title,
                    description,
                    thumbnail_url,
                    video_url,
                    view_count,
                    target_views,
                    created_at,
                    profiles(username, avatar_url)
                `)
                .gte('created_at', sinceDate.toISOString())
                .order('view_count', { ascending: false })
                .limit(20);

            if (error) throw error;
            // Supabase join can return profiles as array — normalize to object
            const normalized = (data || []).map((v: any) => ({
                ...v,
                profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
            }));
            setVideos(normalized);
        } catch (err) {
            console.error('Error fetching trending:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-gray-300';
        if (rank === 3) return 'text-orange-400';
        return 'text-muted/30';
    };

    const getRankBg = (rank: number) => {
        if (rank === 1) return 'from-yellow-500/10 to-transparent border-yellow-500/20';
        if (rank === 2) return 'from-gray-400/10 to-transparent border-gray-400/20';
        if (rank === 3) return 'from-orange-500/10 to-transparent border-orange-500/20';
        return 'from-transparent to-transparent border-transparent';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Flame size={28} className="text-white" fill="white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Trending</h1>
                        <p className="text-muted text-sm font-medium">Videos gaining momentum right now</p>
                    </div>
                </div>

                {/* Time Range Tabs */}
                <div className="flex items-center bg-surface rounded-xl p-1 border border-border/50">
                    {(['today', 'week', 'month'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${timeRange === range
                                ? 'bg-primary text-white shadow-md shadow-primary/30'
                                : 'text-muted hover:text-foreground'
                                }`}
                        >
                            {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Trending List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : videos.length === 0 ? (
                <div className="text-center py-20 text-muted">
                    <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No trending videos for this period yet.</p>
                    <p className="text-sm mt-1">Upload a video to start the trend!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {videos.map((video, index) => {
                        const rank = index + 1;
                        const views = Math.max(video.view_count || 0, video.target_views || 0);

                        return (
                            <Link
                                key={video.id}
                                href={`/watch/${video.id}`}
                                className={`group flex gap-4 md:gap-5 items-center p-3 md:p-4 rounded-xl border transition-all duration-300 hover:bg-surface-hover bg-gradient-to-r ${getRankBg(rank)}`}
                            >
                                {/* Rank */}
                                <div className="flex flex-col items-center justify-center w-10 md:w-12 gap-0.5 flex-shrink-0">
                                    {rank <= 3 && <Trophy size={14} className={getRankColor(rank)} fill="currentColor" />}
                                    <span className={`text-xl md:text-2xl font-black ${getRankColor(rank)} group-hover:text-primary transition-colors`}>
                                        {rank}
                                    </span>
                                </div>

                                {/* Thumbnail */}
                                <div className="w-[140px] md:w-[200px] aspect-video relative rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                                    <img
                                        src={video.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop'}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 py-1">
                                    <h3 className="text-sm md:text-base font-bold leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                                        {video.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-1">
                                        <img
                                            src={video.profiles?.avatar_url || 'https://i.pravatar.cc/150'}
                                            alt=""
                                            className="w-5 h-5 rounded-full"
                                        />
                                        <span className="text-xs text-muted font-medium">{video.profiles?.username || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted">
                                        <span className="flex items-center gap-1"><Eye size={12} /> {formatViews(views)} views</span>
                                        <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(video.created_at)}</span>
                                    </div>
                                </div>

                                {/* Trend indicator */}
                                <div className="hidden md:flex items-center text-primary gap-1 flex-shrink-0">
                                    <TrendingUp size={16} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
