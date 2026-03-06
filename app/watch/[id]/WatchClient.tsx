'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { applyGrowthBoost } from '@/lib/growth';
import { Video } from '@/types';
import { ThumbsUp, ThumbsDown, Share2, Lock, CheckCircle2 } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import SubscribeButton from '@/components/SubscribeButton';
import VideoPlayer from '@/components/VideoPlayer';
import Link from 'next/link';
import { formatViews } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';

interface WatchClientProps {
    initialVideo: Video;
}

export default function WatchClient({ initialVideo }: WatchClientProps) {
    const { user: currentUser } = useAuth();
    const [video, setVideo] = useState<Video>(initialVideo);
    const [isLiked, setIsLiked] = useState(false);

    const isPremium = (currentUser as any)?.is_premium || false;

    useEffect(() => {
        applyGrowthBoost(video.id);

        const subscription = supabase
            .channel(`video:${video.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'videos',
                filter: `id=eq.${video.id}`,
            }, (payload) => {
                setVideo((prev) => ({ ...prev, ...payload.new }));
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, [video.id]);

    return (
        <div className="flex flex-col xl:flex-row gap-8 p-4 md:p-6 max-w-[1800px] mx-auto">
            {/* Main Video Column */}
            <div className="flex-1 min-w-0 space-y-5">
                {/* Premium VideoPlayer */}
                <VideoPlayer
                    src={video.video_url}
                    poster={video.thumbnail_url ?? undefined}
                    title={video.title}
                />

                {/* Title */}
                <h1 className="text-xl md:text-2xl font-bold leading-tight">
                    {video.title}
                </h1>

                {/* Channel / Actions Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    {/* Channel Info */}
                    <div className="flex items-center gap-4">
                        <Link href={`/profile/${video.profiles?.username}`} className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#9147ff] to-red-600 border border-white/10">
                                {video.profiles?.avatar_url ? (
                                    <img
                                        src={video.profiles.avatar_url}
                                        alt={video.profiles.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                                        {(video.profiles?.username || 'U')[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </Link>
                        <div>
                            <Link
                                href={`/profile/${video.profiles?.username}`}
                                className="font-bold hover:text-[#9147ff] transition-colors flex items-center gap-1"
                            >
                                {video.profiles?.username || 'Unknown'}
                                <CheckCircle2 size={14} className="text-gray-400" />
                            </Link>
                            <p className="text-xs text-gray-400">
                                {formatViews(video.view_count)} views • {new Date(video.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <SubscribeButton channelId={video.profiles?.id || ''} className="ml-4" />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <div className="flex items-center bg-white/10 rounded-full overflow-hidden">
                            <button
                                onClick={() => setIsLiked(!isLiked)}
                                className={`flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors border-r border-white/10 text-sm font-bold ${isLiked ? 'text-[#9147ff]' : ''}`}
                                aria-label="Like"
                            >
                                <ThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} />
                                {formatViews(video.target_likes || 0)}
                            </button>
                            <button className="px-4 py-2 hover:bg-white/10 transition-colors" aria-label="Dislike">
                                <ThumbsDown size={18} />
                            </button>
                        </div>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-sm font-bold"
                            aria-label="Share"
                        >
                            <Share2 size={18} />
                            Share
                        </button>
                        {!isPremium && (
                            <Link
                                href="/settings"
                                className="flex items-center gap-2 px-4 py-2 bg-[#9147ff]/20 hover:bg-[#9147ff]/30 border border-[#9147ff]/40 rounded-full transition-colors text-sm font-bold text-[#9147ff]"
                            >
                                <Lock size={16} />
                                Go Premium
                            </Link>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white/5 rounded-xl p-4 text-sm hover:bg-white/10 transition-colors cursor-pointer">
                    <p className="whitespace-pre-wrap text-gray-300">
                        {video.description?.replace(/\[PRIVATE_VIDEO_FLAG\]/, '').trim() || 'No description provided.'}
                    </p>
                </div>

                {/* Comments */}
                <CommentSection videoId={video.id} />
            </div>

            {/* Right Sidebar */}
            <div className="hidden xl:block w-[360px] flex-shrink-0">
                <div className="bg-white/5 rounded-xl p-4 h-[500px] flex flex-col items-center justify-center text-gray-400 border border-white/10">
                    <p className="font-bold text-lg mb-2">Up Next</p>
                    <p className="text-sm text-center">Recommended videos coming soon.</p>
                </div>
            </div>
        </div>
    );
}
