'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { applyGrowthBoost } from '@/lib/growth';
import { Video } from '@/types';
import {
    ThumbsUp, ThumbsDown, Share2, MessageSquare, MoreHorizontal,
    Flame, CheckCircle2, X, Bell, Download, Play
} from 'lucide-react';
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

function formatCount(n?: number): string {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

export default function WatchClient({ video: initialVideo, recommendations: initialRecommendations }: { video: Video; recommendations: Video[] }) {
    const { user: currentUser } = useAuth();
    const [video, setVideo] = useState<Video>(initialVideo);
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(initialVideo.target_likes || 0);
    const [isLiking, setIsLiking] = useState(false);
    const [hypes, setHypes] = useState(initialVideo.hype_count || 0);
    const [isHyping, setIsHyping] = useState(false);
    const [showHypeAnimation, setShowHypeAnimation] = useState(false);

    const [recommendations, setRecommendations] = useState<Video[]>(initialRecommendations || []);
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
                .maybeSingle();
            if (!error && data) setIsLiked(true);
        } catch (err) {
            console.error('Error checking like status:', err);
        }
    };

    useEffect(() => {
        // 1. Growth Boost (Bot Seeding)
        applyGrowthBoost(video.id);

        // 2. Real View Increment (Atomic)
        const incrementViews = async () => {
            try {
                // We add a small delay to avoid incrementing on accidental clicks/page refreshes before content loads
                await new Promise(res => setTimeout(res, 2000));
                await supabase.rpc('increment_view_count', { video_id: video.id });
            } catch (err) {
                console.error('View increment failed:', err);
            }
        };
        incrementViews();

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
        const prevLiked = isLiked;
        
        // Optimistic UI
        setIsLiked(!prevLiked);
        setLikes(prev => prevLiked ? prev - 1 : prev + 1);

        try {
            const { data, error } = await supabase.rpc('toggle_like', { 
                target_video_id: video.id, 
                target_user_id: currentUser.id 
            });
            
            if (error) throw error;
            
            // Sync with actual result if needed
            if (data && typeof data.liked === 'boolean') {
                setIsLiked(data.liked);
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            // Rollback on error
            setIsLiked(prevLiked);
            setLikes(prev => prevLiked ? prev + 1 : prev - 1);
        } finally {
            setIsLiking(false);
        }
    };

    const handleHype = async () => {
        if (!currentUser) return;
        setIsHyping(true);
        setShowHypeAnimation(true);

        // Optimistic UI
        setHypes(prev => prev + 1);

        try {
            const { error } = await supabase.rpc('increment_hype_count', { video_id: video.id });
            if (error) throw error;
            
            // Clean up animation
            setTimeout(() => setShowHypeAnimation(false), 2000);
        } catch (err) {
            console.error('Error hyping:', err);
            setHypes(prev => prev - 1);
            setShowHypeAnimation(false);
        } finally {
            setIsHyping(false);
        }
    };

    const username = video.profiles?.username || 'Unknown';
    const author = video.profiles?.channel_name || video.profiles?.display_name || video.profiles?.username || 'Unknown';
    const avatar = video.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden w-full bg-[#0a0a0a]">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide">
                <div className="max-w-[1280px] mx-auto space-y-4 pb-20">
                    <div className="flex justify-center bg-black/20 rounded-3xl overflow-hidden shadow-2xl">
                        <VideoPlayer
                            src={video.video_url}
                            poster={video.thumbnail_url ?? undefined}
                            title={video.title}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-xl font-black leading-tight md:text-2xl tracking-tighter">
                                {video.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-widest">
                                <span>{formatViews(video.view_count)} views</span>
                                <span>{new Date(video.created_at).toLocaleDateString()}</span>
                                <span className="text-[#FFB800]">#VIBESTREAM</span>
                            </div>
                        </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4 border-y border-white/5">
                                <div className="flex items-center gap-4">
                                    <Link href={`/profile/${username}`} className="flex-shrink-0 relative">
                                        <img
                                            src={avatar}
                                            alt={author}
                                            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-white/5 shadow-lg shadow-black/50"
                                            referrerPolicy="no-referrer"
                                        />
                                        {video.is_live && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#FFB800] rounded-full border-2 border-[#0a0a0a]" />}
                                    </Link>
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <Link href={`/profile/${username}`} className="font-black text-sm md:text-base flex items-center gap-1 hover:text-[#FFB800] transition-colors tracking-tight truncate">
                                            {author}
                                            {(video.profiles?.is_verified || video.profiles?.subscription_tier === 'premium') && (
                                                <CheckCircle2 size={14} className="text-[#FFB800] shrink-0" fill="currentColor" />
                                            )}
                                        </Link>
                                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest truncate">
                                            {formatCount(video.profiles?.follower_count || 0)} subscribers
                                        </span>
                                    </div>
                                    <div className="ml-auto md:ml-4">
                                        <SubscribeButton channelId={video.profiles?.id || ''} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
                                    <div className="flex items-center bg-white/5 rounded-full overflow-hidden border border-white/10 shrink-0 shadow-lg">
                                        <button
                                            onClick={handleLike}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-3 md:px-5 md:py-2.5 hover:bg-white/10 transition-colors border-r border-white/5 font-black uppercase tracking-widest text-[10px]",
                                                isLiked ? "text-[#FFB800]" : "text-gray-400"
                                            )}
                                            title="Like"
                                        >
                                            <ThumbsUp size={18} fill={isLiked ? "currentColor" : "none"} />
                                            <span className="min-w-[2ch]">{formatViews(video.likes_count || likes)}</span>
                                        </button>
                                        <button 
                                            className="px-6 py-3 md:px-5 md:py-2.5 hover:bg-white/10 transition-colors text-gray-500 active:bg-white/10" 
                                            title="Dislike" 
                                            aria-label="Dislike"
                                        >
                                            <ThumbsDown size={18} />
                                        </button>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.92 }}
                                        onClick={handleHype}
                                        disabled={isHyping}
                                        className="relative flex items-center gap-2 px-7 py-3 md:px-6 md:py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] bg-gradient-to-r from-[#FFB800] to-orange-500 text-black shadow-lg shadow-[#FFB800]/20 disabled:opacity-50 shrink-0 active:opacity-90"
                                    >
                                        <Flame size={18} fill="currentColor" className={isHyping ? "animate-bounce" : ""} />
                                        {formatViews(hypes)} Hype
                                        <AnimatePresence>
                                            {showHypeAnimation && (
                                                <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -25 }} exit={{ opacity: 0 }} className="absolute -top-6 -right-2 text-2xl pointer-events-none">
                                                    ✨
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>

                                    <button 
                                        onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }} 
                                        className="flex items-center gap-2 px-6 py-3 md:px-5 md:py-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5 font-black uppercase tracking-widest text-[10px] shrink-0 shadow-lg" 
                                        title="Share video" 
                                        aria-label="Share video"
                                    >
                                        <Share2 size={18} />
                                        Share
                                    </button>
                                    
                                    <button 
                                        className="p-3 md:p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5 shrink-0 shadow-lg" 
                                        title="More options" 
                                        aria-label="More options"
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                            </div>

                        <div className="bg-[#121212] rounded-3xl p-6 text-sm hover:bg-white/[0.03] transition-colors border border-white/5">
                            <p className="whitespace-pre-wrap text-gray-400 font-medium leading-relaxed">
                                {video.description?.replace(/\[PRIVATE_VIDEO_FLAG\]/, '').trim() || 'No description provided.'}
                            </p>
                        </div>
                    </div>

                    <hr className="border-white/5 my-8" />

                    {/* Mobile Chat Toggle (Only for Live) */}
                    {video.is_live && (
                        <button
                            onClick={() => setShowMobileChat(true)}
                            className="lg:hidden w-full p-5 bg-white/5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors border border-white/5 mb-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#FFB800]/10 flex items-center justify-center">
                                    <MessageSquare size={18} className="text-[#FFB800]" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-xs">Live Chat</span>
                            </div>
                            <MoreHorizontal size={18} className="rotate-90 text-gray-500" />
                        </button>
                    )}

                    {/* Comments or Recommendations */}
                    <div className="grid grid-cols-1 gap-12">
                        {!video.is_live && (
                            <div className="space-y-6">
                                <h3 className="font-black font-display text-xl uppercase tracking-tighter">Comments</h3>
                                {video.allow_comments !== false ? (
                                    <CommentSection videoId={video.id} />
                                ) : (
                                    <div className="p-12 bg-white/5 border border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-4 text-center">
                                        <MessageSquare size={48} className="text-gray-700" />
                                        <p className="font-black text-gray-500 uppercase tracking-widest text-xs">Comments disabled</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-6">
                            <h3 className="font-black font-display text-xl uppercase tracking-tighter">Recommended</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recommendations.map(v => (
                                    <VideoCard key={v.id} video={v as any} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Side Sidebar (Live Chat) */}
            {video.is_live && (
                <div className="hidden lg:flex w-[400px] border-l border-white/5 bg-[#0a0a0a] flex-col h-full shrink-0">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between font-black uppercase tracking-[0.2em] text-[10px]">
                        Stream Chat
                        <span className="flex items-center gap-1.5 text-[#FFB800]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />
                            LIVE
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-end">
                        <div className="text-center text-gray-600 text-xs font-bold uppercase tracking-widest py-10 opacity-50">
                            Welcome to the vibe.
                        </div>
                    </div>
                    <div className="p-6 border-t border-white/5 bg-[#0a0a0a]">
                        <input
                            type="text"
                            placeholder="Send a message"
                            disabled
                            className="w-full bg-[#121212] border border-white/5 focus:border-[#FFB800]/50 rounded-2xl px-5 py-4 outline-none text-sm transition-all font-bold placeholder:text-gray-600"
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
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="lg:hidden fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col pt-safe"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <span className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse" /> Live Chat
                            </span>
                            <button onClick={() => setShowMobileChat(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-end">
                            <div className="text-center text-gray-600 text-xs font-bold uppercase tracking-widest py-10 opacity-50">
                                Welcome to the vibe.
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/5">
                            <input
                                type="text"
                                placeholder="Send a message"
                                disabled
                                className="w-full bg-[#121212] border border-white/5 focus:border-[#FFB800]/50 rounded-2xl px-5 py-4 outline-none text-sm transition-all font-bold"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
