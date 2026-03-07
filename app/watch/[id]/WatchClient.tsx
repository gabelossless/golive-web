'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { applyGrowthBoost } from '@/lib/growth';
import { Video } from '@/types';
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, Bell, CheckCircle2, X, MessageSquare } from 'lucide-react';
import SubscribeButton from '@/components/SubscribeButton';
import VideoPlayer from '@/components/VideoPlayer';
import CommentSection from '@/components/CommentSection';
import VideoCard from '@/components/VideoCard';
import Link from 'next/link';
import { formatViews } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

interface WatchClientProps {
    initialVideo: Video;
}

export default function WatchClient({ initialVideo }: WatchClientProps) {
    const { user: currentUser } = useAuth();
    const [video, setVideo] = useState<Video>(initialVideo);
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(initialVideo.target_likes || 0);
    const [isLiking, setIsLiking] = useState(false);

    const [recommendations, setRecommendations] = useState<Video[]>([]);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if (currentUser && video.id) {
            checkLikeStatus();
        }
    }, [currentUser, video.id]);

    const checkLikeStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('likes')
                .select('*')
                .eq('user_id', currentUser?.id)
                .eq('video_id', video.id)
                .single();
            if (!error && data) setIsLiked(true);
        } catch (err) {
            console.error('Error checking like status:', err);
        }
    };

    useEffect(() => {
        applyGrowthBoost(video.id);

        const fetchRecs = async () => {
            const { data } = await supabase
                .from('videos')
                .select('*, profiles(id, username, avatar_url, is_verified)')
                .neq('id', video.id)
                .limit(4);
            if (data) {
                const mapped = data.map(v => ({
                    ...v,
                    profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
                }));
                // Safe filter
                setRecommendations(mapped.filter((v: any) => !(v.description || '').includes('[PRIVATE_VIDEO_FLAG]')) as any);
            }
        };
        fetchRecs();

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

    const handleLike = async () => {
        if (!currentUser) return;
        if (isLiking) return;

        setIsLiking(true);
        const nextLikedState = !isLiked;

        // Optimistic UI
        setIsLiked(nextLikedState);
        setLikes(prev => nextLikedState ? prev + 1 : prev - 1);

        try {
            if (nextLikedState) {
                await supabase.from('likes').insert({ user_id: currentUser.id, video_id: video.id });
                // We could increment a counter on the video table here if we wanted to be super accurate,
                // but for now we'll rely on the target_likes injection system for the showcase.
            } else {
                await supabase.from('likes').delete().eq('user_id', currentUser.id).eq('video_id', video.id);
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            // Rollback on error
            setIsLiked(!nextLikedState);
            setLikes(prev => !nextLikedState ? prev + 1 : prev - 1);
        } finally {
            setIsLiking(false);
        }
    };

    const author = video.profiles?.username || 'Unknown';
    const avatar = video.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`;

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden w-full">
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide">
                <div className="max-w-[1280px] mx-auto space-y-4">
                    {/* Video Player */}
                    <VideoPlayer
                        src={video.video_url}
                        poster={video.thumbnail_url ?? undefined}
                        title={video.title}
                    />

                    <div className="space-y-4">
                        <h1 className="text-xl font-bold leading-tight md:text-2xl">
                            {video.title}
                        </h1>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Link href={`/profile/${author}`} className="flex-shrink-0">
                                    <img
                                        src={avatar}
                                        alt={author}
                                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                                        referrerPolicy="no-referrer"
                                    />
                                </Link>
                                <div className="flex flex-col min-w-0">
                                    <Link href={`/profile/${author}`} className="font-bold flex items-center gap-1 hover:text-[#FFB800] transition-colors">
                                        {author}
                                        {(video.profiles as any)?.is_verified && <CheckCircle2 size={14} className="text-[#FFB800]" />}
                                    </Link>
                                    <span className="text-xs text-gray-400">
                                        {formatViews(video.view_count)} views
                                    </span>
                                </div>
                                <div className="ml-4 flex gap-2 items-center">
                                    <SubscribeButton channelId={video.profiles?.id || ''} />
                                    {isSubscribed && (
                                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#FFB800]">
                                            <Bell size={20} fill="currentColor" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 pb-2 md:pb-0">
                                <div className="flex items-center bg-white/5 rounded-full overflow-hidden border border-white/5 shrink-0">
                                    <button
                                        onClick={handleLike}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors border-r border-[rgba(255,255,255,0.05)]",
                                            isLiked && "text-[#FFB800]"
                                        )}
                                    >
                                        <ThumbsUp size={18} fill={isLiked ? "currentColor" : "none"} />
                                        <span className="text-sm font-bold">{formatViews(likes)}</span>
                                    </button>
                                    <button className="px-4 py-2 hover:bg-white/10 transition-colors">
                                        <ThumbsDown size={18} />
                                    </button>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5 shrink-0">
                                    <Share2 size={18} />
                                    <span className="text-sm font-bold">Share</span>
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors hidden sm:flex border border-white/5 shrink-0">
                                    <Download size={18} />
                                    <span className="text-sm font-bold">Save</span>
                                </button>
                                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5 shrink-0">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-4 text-sm hover:bg-white/10 transition-colors border border-white/5 mt-4">
                            <div className="flex gap-3 font-black uppercase tracking-tighter mb-1 text-xs text-gray-400">
                                <span>{formatViews(video.view_count)} views</span>
                                <span>{new Date(video.created_at).toLocaleDateString()}</span>
                                <span className="text-[#FFB800]">#VIBESTREAM</span>
                            </div>
                            <p className="whitespace-pre-wrap text-gray-300 font-medium">
                                {video.description?.replace(/\[PRIVATE_VIDEO_FLAG\]/, '').trim() || 'No description provided.'}
                            </p>
                        </div>
                    </div>

                    <hr className="border-white/10 my-4" />

                    {/* Mobile Chat Toggle (Only for Live) */}
                    {video.is_live && (
                        <button
                            onClick={() => setShowMobileChat(true)}
                            className="lg:hidden w-full p-4 bg-white/5 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <MessageSquare size={18} className="text-[#FFB800]" />
                                <span className="font-bold">Live Chat</span>
                                <span className="text-xs text-gray-400">Tap to view</span>
                            </div>
                            <MoreHorizontal size={18} className="rotate-90 text-gray-400" />
                        </button>
                    )}

                    {/* Comments Section (Only for Non-Live) */}
                    {!video.is_live && (
                        <div className="mt-4">
                            <CommentSection videoId={video.id} />
                        </div>
                    )}

                    {/* Recommendations */}
                    <div className="space-y-4 mt-8">
                        <h3 className="font-bold text-lg">Recommended</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recommendations.map(v => (
                                <VideoCard key={v.id} video={v as any} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Twitch-style Chat Sidebar (Desktop - Only for Live) */}
            {video.is_live && (
                <div className="hidden lg:flex w-[400px] border-l border-white/10 bg-[#0a0a0a] flex-col h-full shrink-0">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between font-bold text-sm">
                        Stream Chat
                        <span className="flex items-center gap-1 text-xs text-red-500"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end">
                        <div className="text-center text-gray-500 text-sm py-8 font-medium">
                            Welcome to the chat room!
                        </div>
                    </div>
                    <div className="p-4 border-t border-white/10 bg-[#0f0f0f]">
                        <input
                            type="text"
                            placeholder="Send a message"
                            disabled
                            className="w-full bg-[#161616] border border-white/10 focus:border-[#FFB800]/50 rounded-xl px-4 py-2.5 outline-none text-sm transition-colors"
                        />
                    </div>
                </div>
            )}

            {/* Mobile Chat Drawer */}
            <AnimatePresence>
                {showMobileChat && video.is_live && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="lg:hidden fixed inset-0 z-[60] bg-black flex flex-col"
                    >
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <span className="font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Chat
                            </span>
                            <button
                                onClick={() => setShowMobileChat(false)}
                                className="p-2 hover:bg-white/10 rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end">
                            <div className="text-center text-gray-500 text-sm py-8 font-medium">
                                Welcome to the chat room!
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10 bg-[#0f0f0f]">
                            <input
                                type="text"
                                placeholder="Send a message"
                                disabled
                                className="w-full bg-[#161616] border border-white/10 focus:border-[#FFB800]/50 rounded-xl px-4 py-2.5 outline-none text-sm transition-colors"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
