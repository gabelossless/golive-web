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
import ShareModal from '@/components/ShareModal';
import Link from 'next/link';
import { useCallback } from 'react';
import { formatViews } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import TipButton from '@/components/TipButton';
import { getAnalyticsSessionId } from '@/lib/analytics-session';

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
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

        const fetchRecs = async () => {
            try {
                // Extract category and tags from current video description
                const rawDesc = video.description || '';
                const catMatch = rawDesc.match(/Category:\s*([^\n]+)/);
                const currentCategory = catMatch ? catMatch[1].trim() : null;
                
                let queryBuilder = supabase
                    .from('videos')
                    .select('*, profiles(id, username, avatar_url, is_verified, wallet_address)')
                    .neq('id', video.id);

                if (currentCategory) {
                    // Try to find same category first
                    queryBuilder = queryBuilder.ilike('description', `%Category: ${currentCategory}%`);
                }

                const { data, error } = await queryBuilder.limit(6);
                
                let results = data || [];
                
                // If we don't have enough, fill with others
                if (results.length < 6) {
                    const { data: fallbackData } = await supabase
                        .from('videos')
                        .select('*, profiles(id, username, avatar_url, is_verified, wallet_address, solana_wallet_address)')
                        .neq('id', video.id)
                        .not('id', 'in', `(${results.map(r => r.id).join(',') || '00000000-0000-0000-0000-000000000000'})`)
                        .order('view_count', { ascending: false })
                        .limit(6 - results.length);
                    
                    if (fallbackData) results = [...results, ...fallbackData];
                }

                if (results) {
                    const mapped = results.map(v => ({
                        ...v,
                        profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
                    }));
                    // Safe filter
                    setRecommendations(mapped.filter((v: any) => !(v.description || '').includes('[PRIVATE_VIDEO_FLAG]')) as any);
                }
            } catch (err) {
                console.error('Error fetching recs:', err);
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
                target_video_id: video.id
            });
            
            if (error) throw error;
            
            // Sync with actual result if needed
            if (data && typeof data.liked === 'boolean') {
                setIsLiked(data.liked);
            }
            if (data?.status === 'buffered') {
                // Optionally handle buffered state (e.g., toast or silent success)
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
            const { data, error } = await supabase.rpc('increment_hype_count', { video_id: video.id });
            if (error) throw error;
            
            if (data?.status === 'buffered') {
                // Vibe Guard buffered this hype (Shadow)
            }
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

    // Parse description, category, and tags
    const rawDesc = video.description?.replace(/\[PRIVATE_VIDEO_FLAG\]/, '').trim() || 'No description provided.';
    let displayDesc = rawDesc;
    const catMatch = rawDesc.match(/Category:\s*([^\n]+)/);
    const tagsMatch = rawDesc.match(/Tags:\s*([^\n]+)/);
    const category = catMatch ? catMatch[1].trim() : null;
    let tagsList: string[] = [];

    if (tagsMatch || catMatch) {
         // Clean description from appending metadata
         displayDesc = rawDesc.split(/Category:/)[0].trim();
         if (tagsMatch) {
             tagsList = tagsMatch[1].split(' ').filter(t => t.startsWith('#'));
         }
    }

    const handleActiveWatch = useCallback(async () => {
        try {
            const sessionId = getAnalyticsSessionId();
            const response = await fetch('/api/video/track-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId: video.id,
                    sessionId: sessionId
                })
            });
        } catch (err) {
            console.error('View increment failed:', err);
        }
    }, [video.id]);

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden w-full bg-[#0a0a0a]">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-2 lg:p-8 scrollbar-hide">
                <div className="max-w-[1400px] mx-auto space-y-8 pb-32">
                    <div className="flex justify-center bg-black/40 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <VideoPlayer
                            src={video.video_url}
                            poster={video.thumbnail_url ?? undefined}
                            title={video.title}
                            onActiveWatch={handleActiveWatch}
                            isLive={video.is_live}
                            creator={{
                                username: video.profiles?.username || 'Creator',
                                wallet_address: video.profiles?.wallet_address,
                                solana_wallet_address: video.profiles?.solana_wallet_address
                            }}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-4">
                            <h1 className="text-3xl font-black leading-tight md:text-4xl tracking-tighter italic font-premium text-gradient">
                                {video.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] italic">
                                <span>{formatViews(video.view_count)} views</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                <span>{new Date(video.created_at).toLocaleDateString()}</span>
                                <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[#FFB800]">#VIBESTREAM</span>
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

                                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
                                    <div className="flex items-center bg-white/[0.03] rounded-2xl overflow-hidden border border-white/5 shrink-0 shadow-xl self-stretch">
                                        <button
                                            onClick={handleLike}
                                            className={cn(
                                                "flex items-center gap-3 px-6 py-3 hover:bg-white/[0.05] transition-all border-r border-white/5 font-black uppercase tracking-widest text-[10px]",
                                                isLiked ? "text-[#FFB800] bg-[#FFB800]/5" : "text-zinc-400"
                                            )}
                                            title="Like"
                                        >
                                            <motion.div
                                                animate={isLiked ? { scale: [1, 1.4, 1], rotate: [0, -15, 0] } : {}}
                                                transition={{ duration: 0.45, ease: "easeOut" }}
                                            >
                                                <ThumbsUp size={18} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "drop-shadow-[0_0_8px_#FFB800]" : ""} />
                                            </motion.div>
                                            <span className="min-w-[2ch]">{formatViews(video.likes_count || likes)}</span>
                                        </button>
                                        <button 
                                            className="px-6 py-3 hover:bg-white/[0.05] transition-all text-zinc-500 active:bg-white/10" 
                                            title="Dislike" 
                                            aria-label="Dislike"
                                        >
                                            <ThumbsDown size={18} />
                                        </button>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleHype}
                                        disabled={isHyping}
                                        className="relative flex items-center gap-3 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-gradient-to-br from-[#FFB800] to-orange-600 text-black shadow-xl shadow-[#FFB800]/10 disabled:opacity-50 shrink-0 hover:scale-105 transition-all self-stretch group"
                                    >
                                        <Flame size={18} fill="currentColor" className={cn("transition-transform group-hover:scale-125", isHyping ? "animate-push-pulse" : "")} />
                                        {formatViews(hypes)} Hype
                                        <AnimatePresence>
                                            {showHypeAnimation && (
                                                <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -40 }} exit={{ opacity: 0 }} className="absolute -top-10 left-1/2 -translate-x-1/2 text-3xl pointer-events-none">
                                                    ✨
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>

                                    <div className="h-full flex items-stretch">
                                        <TipButton 
                                            creator={{
                                                username: video.profiles?.username || 'Creator',
                                                wallet_address: video.profiles?.wallet_address,
                                                solana_wallet_address: video.profiles?.solana_wallet_address
                                            }}
                                        />
                                    </div>

                                    <button 
                                        onClick={() => setIsShareModalOpen(true)} 
                                        className="flex items-center gap-3 px-8 py-3 bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl transition-all border border-white/5 font-black uppercase tracking-widest text-[10px] shrink-0 shadow-xl self-stretch" 
                                        title="Share video" 
                                        aria-label="Share video"
                                    >
                                        <Share2 size={18} className="text-zinc-500" />
                                        Share
                                    </button>
                                    
                                    <button 
                                        className="px-4 bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl transition-all border border-white/5 shrink-0 shadow-xl self-stretch text-zinc-500 hover:text-white" 
                                        title="More options" 
                                        aria-label="More options"
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                            </div>

                        <div className="glass-deep rounded-[32px] p-8 text-sm hover:bg-white/[0.04] transition-all duration-500 border border-white/5 flex flex-col items-start cursor-pointer group/desc relative overflow-hidden" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FFB800]/20 to-transparent opacity-0 group-hover/desc:opacity-100 transition-opacity" />
                            <p className={cn(
                                "whitespace-pre-wrap text-zinc-400 font-medium leading-relaxed transition-all",
                                !isDescriptionExpanded && "line-clamp-2 md:line-clamp-3"
                            )}>
                                {displayDesc}
                            </p>
                            
                            <AnimatePresence>
                                {isDescriptionExpanded && (tagsList.length > 0 || category) && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-6 flex flex-col gap-3 w-full"
                                    >
                                        {category && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</span>
                                                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-black text-gray-300 border border-white/10">{category}</span>
                                            </div>
                                        )}
                                        {tagsList.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                {tagsList.map(tag => (
                                                    <span key={tag} className="text-[#FFB800] font-black tracking-widest text-[10px] uppercase bg-[#FFB800]/10 px-2.5 py-1 rounded-md border border-[#FFB800]/20 hover:bg-[#FFB800]/20 transition-colors">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button className="mt-4 text-xs font-black uppercase tracking-widest text-[#FFB800] hover:text-orange-500 transition-colors bg-transparent border-none p-0">
                                {isDescriptionExpanded ? 'Show less' : 'Show more'}
                            </button>
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

            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} video={video} />
        </div>
    );
}
