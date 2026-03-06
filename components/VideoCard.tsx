'use client';

import Link from 'next/link';
import { CheckCircle2, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

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
        } | null;
        duration?: string;
        is_live?: boolean;
    };
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
}

function formatViews(n?: number): string {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=480&q=80';
const FALLBACK_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

export default function VideoCard({ video }: VideoCardProps) {
    const author = video.profiles?.username || 'Unknown';
    const avatar = video.profiles?.avatar_url || FALLBACK_AVATAR;
    const thumb = video.thumbnail_url || FALLBACK_THUMB;
    const views = Math.max(video.view_count || 0, video.target_views || 0);
    const timeStr = timeAgo(video.created_at);
    const isLive = video.is_live;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 group cursor-pointer"
        >
            {/* Thumbnail */}
            <Link href={`/watch/${video.id}`} className="relative aspect-video rounded-xl overflow-hidden bg-white/5 block">
                <img
                    src={thumb}
                    alt={video.title || 'Video'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_THUMB; }}
                />
                {/* Duration badge */}
                {video.duration && !isLive && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                        {video.duration}
                    </div>
                )}
                {/* Live badge */}
                {isLive && (
                    <div className="absolute top-2 left-2 live-badge">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />
                        Live
                    </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-xs font-medium text-white/90">Watch now</span>
                </div>
            </Link>

            {/* Info row */}
            <div className="flex gap-3">
                {/* Avatar */}
                <Link href={`/profile/${author}`} className="flex-shrink-0">
                    <div className="relative">
                        <img
                            src={avatar}
                            alt={author}
                            className="w-9 h-9 rounded-full object-cover border border-white/10"
                            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_AVATAR; }}
                        />
                        {isLive && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#9147ff] rounded-full border-2 border-[#0f0f0f]" />
                        )}
                    </div>
                </Link>

                {/* Text */}
                <div className="flex flex-col flex-1 min-w-0">
                    <Link href={`/watch/${video.id}`}>
                        <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-[#9147ff] transition-colors text-white">
                            {video.title || 'Untitled'}
                        </h3>
                    </Link>
                    <div className="flex flex-col mt-1">
                        <Link
                            href={`/profile/${author}`}
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors w-fit"
                        >
                            {author}
                            <CheckCircle2 size={11} className="text-gray-500" />
                        </Link>
                        <div className="text-xs text-gray-400 mt-0.5">
                            {views > 0 ? `${formatViews(views)} views` : ''}{timeStr && views > 0 ? ' • ' : ''}{timeStr}
                        </div>
                    </div>
                </div>

                {/* Menu button */}
                <button
                    className="h-fit p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-full flex-shrink-0"
                    aria-label="More options"
                >
                    <MoreVertical size={16} />
                </button>
            </div>
        </motion.div>
    );
}
