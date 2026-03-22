'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, MoreVertical, Play, Flame, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { formatViews, timeAgo, formatDuration } from '@/lib/utils';
import { getDecentralizedUrl } from '@/lib/cdn';
import { getGhostAvatar } from '@/lib/image-utils';

export interface VideoCardProps {
    video: {
        id: string;
        title?: string;
        thumbnail_url?: string;
        view_count?: number;
        created_at?: string;
        target_views?: number;
        profiles?: { 
            username?: string; 
            avatar_url?: string; 
            is_verified?: boolean;
            subscription_tier?: string;
            display_name?: string;
            channel_name?: string;
        } | null;
        duration?: string;
        is_live?: boolean;
        hype_count?: number;
        video_url?: string;
    };
}

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80';
const FALLBACK_AVATAR = getGhostAvatar();

const normalizeUrl = (url: string | undefined | null, fallback: string) => {
    if (!url) return fallback;
    if (url.startsWith('http') || url.startsWith('/') || url.startsWith('blob:')) return url;
    return `/${url}`;
};

export default function VideoCard({ video }: VideoCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [previewActive, setPreviewActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const username = video.profiles?.username || 'Unknown';
    const author = video.profiles?.channel_name || video.profiles?.display_name || video.profiles?.username || 'Unknown';
    const avatar = normalizeUrl(video.profiles?.avatar_url, FALLBACK_AVATAR);
    const thumb = normalizeUrl(video.thumbnail_url, FALLBACK_THUMB);
    const views = Math.max(video.view_count || 0, video.target_views || 0);
    const timeStr = timeAgo(video.created_at || new Date().toISOString());
    const isLive = video.is_live;

    const cardRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: true, margin: "200px" });

    useEffect(() => {
        if (isHovered) {
            timeoutRef.current = setTimeout(() => {
                setPreviewActive(true);
            }, 600); // Wait 600ms before starting preview
        } else {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setPreviewActive(false);
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isHovered]);

    useEffect(() => {
        if (previewActive && videoRef.current) {
            videoRef.current.play().catch(() => {});
        }
    }, [previewActive]);

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col gap-4 group cursor-pointer overflow-visible bg-transparent relative"
        >
            {/* Ambient Shadow Glow on Hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        className="absolute -inset-8 bg-[#FFB800]/10 blur-[100px] rounded-full pointer-events-none z-[-1]"
                    />
                )}
            </AnimatePresence>

            <Link href={`/watch/${video.id}`} className="relative aspect-video rounded-[24px] overflow-hidden bg-white/5 border border-white/5 shadow-2xl group-hover:border-[#FFB800]/40 transition-all duration-500 ring-0 group-hover:ring-4 group-hover:ring-[#FFB800]/5">
                <AnimatePresence>
                    {!previewActive ? (
                        <motion.div
                            key="thumb"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative w-full h-full"
                        >
                            <Image
                                src={getDecentralizedUrl(thumb)}
                                alt={video.title || "Video"}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                priority={false}
                            />
                        </motion.div>
                    ) : (
                        <motion.video
                            key="video"
                            ref={videoRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={getDecentralizedUrl(video.video_url)}
                            className="w-full h-full object-cover rounded-xl"
                            muted
                            loop
                            playsInline
                        />
                    )}
                </AnimatePresence>
                {video.duration && !isLive && (
                    <div className="absolute bottom-3 right-3 glass px-2 py-1 rounded-xl text-[10px] font-black tracking-widest border border-white/5">
                        {formatDuration(video.duration)}
                    </div>
                )}
                    <div className="absolute top-3 left-3 live-badge flex items-center gap-2 border border-black/20 shadow-[0_4px_10px_rgba(255,184,0,0.4)]">
                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                        Live
                    </div>
                {video.hype_count && video.hype_count > 0 && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-[#FFB800] to-orange-500 text-black px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-lg flex items-center gap-1 z-10">
                        <Flame size={10} fill="currentColor" />
                        Hyped
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                    <div className="text-xs font-black text-white uppercase tracking-[0.3em] bg-[#FFB800] text-black px-4 py-1.5 rounded-full shadow-[0_10px_20px_rgba(255,184,0,0.4)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        Watch Now
                    </div>
                </div>
            </Link>

            <div className="flex gap-3">
                <Link href={`/profile/${username}`} className="flex-shrink-0">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10">
                        <Image
                            src={avatar}
                            alt={author}
                            fill
                            className="object-cover"
                        />
                        {isLive && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFB800] rounded-full border-2 border-[#0a0a0a] z-10" />
                        )}
                    </div>
                </Link>
                <div className="flex flex-col flex-1 min-w-0">
                    <Link href={`/watch/${video.id}`}>
                        <h3 className="text-base font-black line-clamp-2 leading-[1.1] text-white group-hover:text-[#FFB800] transition-colors tracking-tight font-premium uppercase italic">
                            {video.title || 'Untitled'}
                        </h3>
                    </Link>
                    <div className="flex flex-col mt-2">
                        <Link
                            href={`/profile/${username}`}
                            className="text-xs text-zinc-400 hover:text-white flex items-center gap-2 transition-colors font-black uppercase tracking-widest opacity-80"
                        >
                            {author}
                            {(video.profiles?.is_verified || video.profiles?.subscription_tier === 'premium') && (
                                <CheckCircle2 size={12} className="text-[#FFB800] fill-current" />
                            )}
                        </Link>
                        <div className="text-[10px] text-zinc-600 font-bold mt-2 uppercase tracking-tighter">
                            {formatViews(views)} views • {timeStr}
                        </div>
                    </div>
                </div>
                <button aria-label="More" className="h-fit p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-full text-gray-400">
                    <MoreVertical size={18} />
                </button>
            </div>
        </motion.div>
    );
}
