'use client';

import Link from 'next/link';
import { MoreVertical, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCardProps {
    video: {
        id: string;
        title: string;
        thumbnail_url?: string | null;
        view_count?: number;
        created_at?: string;
        boosted?: boolean;
        profiles?: { username: string; avatar_url?: string | null } | null;
    };
}

function formatViews(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${minutes} min ago`;
}

export default function VideoCard({ video }: VideoCardProps) {
    const username = video.profiles?.username || 'creator';
    const avatar = video.profiles?.avatar_url;
    const views = formatViews(video.view_count || 0);
    const uploadedAt = video.created_at ? timeAgo(video.created_at) : '';
    const thumbnail = video.thumbnail_url || `https://picsum.photos/seed/${video.id}/800/450`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-3 group cursor-pointer"
        >
            <Link href={`/watch/${video.id}`} className="relative aspect-video rounded-xl overflow-hidden bg-white/5 block">
                <img
                    src={thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {video.boosted && (
                    <div className="absolute top-2 left-2 live-badge flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Featured
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="text-xs font-medium text-white/90">Click to watch</div>
                </div>
            </Link>

            <div className="flex gap-3">
                <Link href={`/profile/${username}`} className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#9147ff] to-red-600 overflow-hidden border border-white/10">
                        {avatar ? (
                            <img src={avatar} alt={username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                                {username[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                </Link>
                <div className="flex flex-col flex-1 min-w-0">
                    <Link href={`/watch/${video.id}`}>
                        <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-[#9147ff] transition-colors">
                            {video.title}
                        </h3>
                    </Link>
                    <div className="flex flex-col mt-1">
                        <Link href={`/profile/${username}`} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                            {username}
                            <CheckCircle2 size={11} className="text-gray-500" />
                        </Link>
                        <div className="text-xs text-gray-400 mt-0.5">
                            {views} views • {uploadedAt}
                        </div>
                    </div>
                </div>
                <button className="h-fit p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-full" aria-label="More options">
                    <MoreVertical size={18} />
                </button>
            </div>
        </motion.div>
    );
}
