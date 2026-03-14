'use client';

import Link from 'next/link';
import { CheckCircle2, MoreVertical, Play, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { formatViews, timeAgo, formatDuration } from '@/lib/utils';

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
    };
}

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80';
const FALLBACK_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

export default function VideoCard({ video }: VideoCardProps) {
    const username = video.profiles?.username || 'Unknown';
    const author = video.profiles?.channel_name || video.profiles?.display_name || video.profiles?.username || 'Unknown';
    const avatar = video.profiles?.avatar_url || FALLBACK_AVATAR;
    const thumb = video.thumbnail_url || FALLBACK_THUMB;
    const views = Math.max(video.view_count || 0, video.target_views || 0);
    const timeStr = timeAgo(video.created_at || new Date().toISOString());
    const isLive = video.is_live;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-3 group cursor-pointer"
        >
            <Link href={`/watch/${video.id}`} className="relative aspect-video rounded-xl overflow-hidden bg-white/5">
                <img
                    src={thumb}
                    alt={video.title || "Video"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                />
                {video.duration && !isLive && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {formatDuration(video.duration)}
                    </div>
                )}
                {isLive && (
                    <div className="absolute top-2 left-2 live-badge flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                        Live
                    </div>
                )}
                {video.hype_count && video.hype_count > 0 && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-lg flex items-center gap-1 z-10">
                        <Flame size={10} fill="currentColor" />
                        Hyped
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="text-xs font-bold text-white uppercase tracking-widest">Watch Now</div>
                </div>
            </Link>

            <div className="flex gap-3">
                <Link href={`/profile/${username}`} className="flex-shrink-0">
                    <div className="relative">
                        <img
                            src={avatar}
                            alt={author}
                            className="w-9 h-9 rounded-full object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                        />
                        {isLive && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFB800] rounded-full border-2 border-[#0a0a0a]" />
                        )}
                    </div>
                </Link>
                <div className="flex flex-col flex-1 min-w-0">
                    <Link href={`/watch/${video.id}`}>
                        <h3 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-[#FFB800] transition-colors">
                            {video.title || 'Untitled'}
                        </h3>
                    </Link>
                    <div className="flex flex-col mt-1">
                        <Link
                            href={`/profile/${username}`}
                            className="text-xs text-gray-400 hover:text-[#FFB800] flex items-center gap-1 transition-colors font-medium"
                        >
                            {author}
                            {(video.profiles?.is_verified || video.profiles?.subscription_tier === 'premium') && (
                                <CheckCircle2 size={12} className="text-[#FFB800]" fill="currentColor" />
                            )}
                        </Link>
                        <div className="text-[11px] text-gray-500 mt-1 font-bold uppercase tracking-wider">
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
