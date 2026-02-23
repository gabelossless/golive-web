'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { applyGrowthBoost } from '@/lib/growth';
import { Video } from '@/types';
import { ThumbsUp, ThumbsDown, Share2, Maximize, Minimize, Tv } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import SubscribeButton from '@/components/SubscribeButton';
import Link from 'next/link';
import { formatViews } from '@/lib/utils';

interface WatchClientProps {
    initialVideo: Video;
}

export default function WatchClient({ initialVideo }: WatchClientProps) {
    const [video, setVideo] = useState<Video>(initialVideo);
    const [isTheater, setIsTheater] = useState(false);

    useEffect(() => {
        // Growth boost on mount
        applyGrowthBoost(video.id);

        // Realtime updates for views/likes
        const subscription = supabase
            .channel('public:videos')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'videos',
                filter: `id=eq.${video.id}`
            }, (payload) => {
                setVideo((prev) => ({ ...prev, ...payload.new }));
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, [video.id]);

    return (
        <div className={`transition-all duration-300 ${isTheater ? 'max-w-full px-0' : 'flex flex-col xl:flex-row gap-8'}`}>

            {/* Video Player Container */}
            <div className={`transition-all duration-300 ${isTheater ? 'w-full' : 'flex-1 min-w-0'}`}>
                {/* Desktop Background for Theater Mode */}
                {isTheater && <div className="fixed inset-0 bg-black/90 z-40" onClick={() => setIsTheater(false)} />}

                {/* The Player */}
                <div
                    className={`relative bg-black shadow-2xl overflow-hidden group 
                        ${isTheater
                            ? 'z-50 w-full h-[85vh] rounded-none'
                            : 'w-full aspect-video rounded-2xl'
                        }`}
                >
                    <video
                        src={video.video_url}
                        poster={video.thumbnail_url || undefined}
                        controls
                        className="w-full h-full object-contain"
                    />

                    {/* Theater Toggle (Desktop Only) */}
                    <button
                        onClick={() => setIsTheater(!isTheater)}
                        className="absolute bottom-16 right-6 p-2 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:block hover:bg-white/20"
                        title={isTheater ? "Default View" : "Theater Mode"}
                    >
                        {isTheater ? <Minimize size={20} /> : <Tv size={20} />}
                    </button>
                </div>

                {/* Video Info - Container constraints based on mode */}
                <div className={`mt-5 space-y-4 ${isTheater ? 'max-w-[1280px] mx-auto px-4 relative z-50 text-white' : ''}`}>
                    <h1 className="text-xl md:text-2xl font-black leading-tight tracking-tight mt-4">
                        {video.title}
                    </h1>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border/10 pb-4">
                        {/* Channel Info */}
                        <div className="flex items-center gap-3">
                            <Link href={`/profile/${video.profiles?.username}`} className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-surface">
                                <img src={video.profiles?.avatar_url || 'https://i.pravatar.cc/150'} alt={video.profiles?.username} className="w-full h-full object-cover" />
                            </Link>
                            <div>
                                <Link href={`/profile/${video.profiles?.username}`} className="font-bold text-base flex items-center gap-1.5 hover:text-primary transition-colors">
                                    {video.profiles?.username || 'Unknown'}
                                </Link>
                                <p className="text-xs text-muted font-medium">{formatViews(video.view_count)} views • {new Date(video.created_at).toLocaleDateString()}</p>
                            </div>

                            <SubscribeButton
                                channelId={video.profiles?.id || ''}
                                className="ml-4"
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <div className="flex items-center bg-surface border border-border/50 rounded-full overflow-hidden shadow-sm flex-shrink-0">
                                <button className="flex items-center gap-2 px-4 py-2 hover:bg-surface-hover transition-colors border-r border-border/50 text-sm font-bold">
                                    <ThumbsUp size={18} />
                                    {formatViews(video.target_likes || 0)}
                                </button>
                                <button className="flex items-center px-4 py-2 hover:bg-surface-hover transition-colors">
                                    <ThumbsDown size={18} />
                                </button>
                            </div>
                            <button className="btn btn-secondary rounded-full px-4 py-2 text-sm font-bold flex items-center gap-2 border border-border/50 shadow-sm flex-shrink-0">
                                <Share2 size={18} /> Share
                            </button>
                        </div>
                    </div>

                    {/* Description & Metadata */}
                    <div className="flex flex-col xl:flex-row gap-8">
                        <div className="flex-1">
                            <div className="bg-surface/30 rounded-xl p-4 text-sm whitespace-pre-wrap hover:bg-surface/50 transition-colors cursor-pointer mb-8">
                                <p className="font-bold text-xs text-muted uppercase mb-2">Description</p>
                                {video.description || 'No description provided.'}
                            </div>
                            <CommentSection videoId={video.id} />
                        </div>

                        {/* Sidebar (in standard mode it's outside, in theater it's below) */}
                        {isTheater && (
                            <div className="hidden xl:block w-[350px] flex-shrink-0">
                                <div className="bg-surface/10 border border-border/20 rounded-xl p-6 text-center text-muted">
                                    <p className="text-sm font-bold">Recommended Videos</p>
                                    <p className="text-xs mt-1">Coming in future updates</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar (Standard Mode) */}
            {!isTheater && (
                <div className="hidden xl:block w-[350px] flex-shrink-0">
                    {/* For now keeping mock chat or related videos placeholder */}
                    <div className="bg-surface rounded-xl p-4 h-[600px] flex flex-col items-center justify-center text-muted border border-border">
                        <p className="font-bold">Next Up</p>
                    </div>
                </div>
            )}
        </div>
    );
}
