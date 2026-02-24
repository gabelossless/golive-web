'use client';

import React from 'react';
import Link from 'next/link';
import { MoreVertical, CheckCircle, Eye } from 'lucide-react';
import { formatViews, timeAgo } from '@/lib/utils';

interface VideoCardProps {
    id: string;
    title: string;
    thumbnail: string;
    author: string;
    authorAvatar: string;
    views: string | number;
    timestamp: string;
    duration?: string;
    isLive?: boolean;
    isVerified?: boolean;
}

export default function VideoCard({
    id,
    title,
    thumbnail,
    author,
    authorAvatar,
    views,
    timestamp,
    duration = '10:42',
    isLive = false,
    isVerified = false,
}: VideoCardProps) {
    const formattedViews = formatViews(views);
    const formattedTime = timestamp.includes('ago') ? timestamp : timeAgo(timestamp);

    return (
        <div className="group cursor-pointer animate-in fade-in slide-in-from-bottom-3 duration-700">
            {/* Thumbnail */}
            <Link href={`/watch/${id}`} className="block relative rounded-2xl overflow-hidden bg-surface group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] group-hover:-translate-y-1.5 transition-all duration-500 ring-1 ring-white/5 group-hover:ring-white/20" style={{ aspectRatio: '16/9' }}>
                <img
                    src={thumbnail}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)]"
                />
                {/* Duration / LIVE badge */}
                <div className="absolute bottom-2 right-2">
                    {isLive ? (
                        <span className="live-badge">
                            <span className="live-dot" />
                            LIVE
                        </span>
                    ) : (
                        <span className="bg-black/85 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md tracking-wide">
                            {duration}
                        </span>
                    )}
                </div>
                {/* Hover overlay with play hint */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Progress bar shimmer on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-transparent group-hover:bg-white/10 transition-colors">
                    <div className="h-full bg-primary w-0 group-hover:w-1/3 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(145,71,255,0.6)]" />
                </div>
            </Link>

            {/* Meta */}
            <div className="flex gap-3 mt-3 px-0.5">
                <Link href={`/profile/${author}`} className="flex-shrink-0">
                    <img
                        src={authorAvatar}
                        alt={author}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/30 transition-all duration-300"
                    />
                </Link>

                <div className="flex-1 min-w-0 relative pr-6">
                    <Link href={`/watch/${id}`}>
                        <h3 className="text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
                            {title}
                        </h3>
                    </Link>
                    <Link href={`/profile/${author}`} className="block mt-1">
                        <p className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1">
                            {author}
                            {isVerified && <CheckCircle size={12} className="text-primary" fill="currentColor" />}
                        </p>
                    </Link>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                        {isLive ? (
                            <span className="text-destructive font-bold flex items-center gap-1"><Eye size={12} /> {formattedViews} watching</span>
                        ) : (
                            <>{formattedViews} views · {formattedTime}</>
                        )}
                    </p>

                    {/* More Options */}
                    <button aria-label="More options" className="absolute -right-1 top-0 p-1 opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-all rounded-full hover:bg-surface">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
