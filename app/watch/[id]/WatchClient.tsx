'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { applyGrowthBoost } from '@/lib/growth';
import { Video } from '@/types';
import { ThumbsUp, ThumbsDown, Share2, Maximize, Minimize, Tv, Settings, Lock } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import SubscribeButton from '@/components/SubscribeButton';
import Link from 'next/link';
import { formatViews } from '@/lib/utils';
import { VerifiedBadge } from '@/components/VideoCard';
import { useAuth } from '@/components/AuthProvider';

interface WatchClientProps {
    initialVideo: Video;
}

export default function WatchClient({ initialVideo }: WatchClientProps) {
    const { user: currentUser } = useAuth();
    const [video, setVideo] = useState<Video>(initialVideo);
    const [isTheater, setIsTheater] = useState(false);
    const [quality, setQuality] = useState('720p');
    const [showQualityMenu, setShowQualityMenu] = useState(false);

    // Mock premium check
    const isPremium = (currentUser as any)?.is_premium || false;

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

                    {/* Custom Player Controls Overlays */}
                    <div className="absolute top-4 right-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {/* Quality Selector */}
                        <div className="relative">
                            <button
                                aria-label="Quality Settings"
                                title="Quality Settings"
                                onClick={() => setShowQualityMenu(!showQualityMenu)}
                                className="flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase border border-white/10"
                            >
                                <Settings size={14} className={showQualityMenu ? 'animate-spin' : ''} />
                                {quality}
                            </button>

                            {showQualityMenu && (
                                <div className="absolute top-10 right-0 bg-black/95 border border-white/10 rounded-xl p-2 w-48 shadow-2xl glass-effect z-20">
                                    <p className="text-[10px] text-white/40 font-black tracking-widest p-2 uppercase">Video Quality</p>
                                    <button
                                        onClick={() => { setQuality('1080p'); setShowQualityMenu(false); }}
                                        disabled={!isPremium}
                                        className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${!isPremium ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary/20 hover:text-primary'} ${quality === '1080p' ? 'text-primary' : 'text-white'}`}
                                    >
                                        1080p (HD)
                                        {!isPremium && <Lock size={12} className="text-primary" />}
                                    </button>
                                    <button
                                        onClick={() => { setQuality('720p'); setShowQualityMenu(false); }}
                                        className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all hover:bg-white/5 ${quality === '720p' ? 'text-primary' : 'text-white'}`}
                                    >
                                        720p
                                    </button>
                                    {!isPremium && (
                                        <Link href="/settings" className="block mt-2 p-2 bg-primary/10 border border-primary/20 rounded-lg text-[10px] text-primary font-black text-center tracking-tighter hover:bg-primary/20 transition-all">
                                            UNLOCK 1080P FOR $5/MO
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Theater Toggle (Desktop Only) */}
                    <button
                        onClick={() => setIsTheater(!isTheater)}
                        className="absolute bottom-6 right-6 p-2 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:block hover:bg-white/20 z-10"
                        title={isTheater ? "Default View" : "Theater Mode"}
                    >
                        {isTheater ? <Minimize size={20} /> : <Tv size={20} />}
                    </button>
                </div>

                {/* Video Info - Container constraints based on mode */}
                <div className={`mt-5 space-y-4 ${isTheater ? 'max-w-[1280px] mx-auto px-4 relative z-50 text-white' : ''}`}>
                    <h1 className="text-xl md:text-2xl font-black leading-tight tracking-tight mt-4 uppercase italic">
                        {video.title}
                    </h1>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-border/10 pb-4">
                        {/* Channel Info */}
                        <div className="flex items-center gap-3">
                            <Link href={`/profile/${video.profiles?.username}`} className={`w-12 h-12 rounded-full p-[2px] overflow-hidden flex-shrink-0 transition-all ${video.profiles?.is_verified ? 'bg-gradient-to-tr from-blue-500 via-primary to-purple-500 shadow-[0_0_15px_rgba(229,9,20,0.3)]' : 'bg-surface'}`}>
                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-background bg-surface">
                                    <img src={video.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.profiles?.username}`} alt={video.profiles?.username} className="w-full h-full object-cover" />
                                </div>
                            </Link>
                            <div>
                                <Link href={`/profile/${video.profiles?.username}`} className="font-black text-lg flex items-center gap-2 hover:text-primary transition-colors tracking-tight uppercase italic">
                                    {video.profiles?.username || 'Unknown'}
                                    {video.profiles?.is_verified && <VerifiedBadge className="w-5 h-5 text-[#1D9BF0]" />}
                                </Link>
                                <p className="text-[10px] text-muted font-black tracking-[0.1em] uppercase">{formatViews(video.view_count)} views • {new Date(video.created_at).toLocaleDateString()}</p>
                            </div>

                            <SubscribeButton
                                channelId={video.profiles?.id || ''}
                                className="ml-4"
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <div className="flex items-center bg-surface border border-border/50 rounded-full overflow-hidden shadow-sm flex-shrink-0">
                                <button title="Like" aria-label="Like" className="flex items-center gap-2 px-4 py-2 hover:bg-surface-hover transition-colors border-r border-border/50 text-sm font-bold">
                                    <ThumbsUp size={18} />
                                    {formatViews(video.target_likes || 0)}
                                </button>
                                <button title="Dislike" aria-label="Dislike" className="flex items-center px-4 py-2 hover:bg-surface-hover transition-colors">
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
