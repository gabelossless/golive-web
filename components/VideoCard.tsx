'use client';

import React from 'react';
import Link from 'next/link';
import { MoreVertical, Eye, Play } from 'lucide-react';
import { formatViews, timeAgo } from '@/lib/utils';

// Premium Verified Badge (Twitter/IG Style)
export const VerifiedBadge = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-label="Verified account" role="img" className={className}>
        <g>
            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.74 2.746 1.867 3.45-.09.373-.138.763-.138 1.15 0 2.21 1.71 4 3.918 4 .58 0 1.134-.14 1.625-.386C9.406 21.603 10.636 22.5 12 22.5c1.36 0 2.59-.897 3.167-2.136.492.247 1.046.387 1.626.387 2.21 0 3.918-1.79 3.918-4 0-.387-.048-.777-.138-1.15 1.127-.704 1.867-1.99 1.867-3.45zm-11.16 4.08l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z" fill="currentColor" />
        </g>
    </svg>
);

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
        <div className="group cursor-pointer">
            {/* Thumbnail */}
            <Link href={`/watch/${id}`} className="block video-card-thumb mb-3">
                <img
                    src={thumbnail}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Play button on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <Play size={20} className="text-white ml-1" fill="white" />
                    </div>
                </div>

                {/* Status badges */}
                <div className="absolute bottom-2.5 right-2.5 flex gap-1.5">
                    {isLive ? (
                        <span className="live-badge">LIVE</span>
                    ) : (
                        <span className="bg-black/75 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">
                            {duration}
                        </span>
                    )}
                </div>

                {/* Progress bar shimmer on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 w-0 group-hover:w-2/3 transition-all duration-[800ms] ease-out" />
                </div>
            </Link>

            {/* Meta info */}
            <div className="flex gap-3">
                {/* Avatar */}
                <Link href={`/profile/${author}`} className="flex-shrink-0 mt-0.5">
                    <div className={`w-9 h-9 rounded-full overflow-hidden transition-all ${isVerified ? 'avatar-premium' : 'ring-1 ring-border'}`}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-surface">
                            <img
                                src={authorAvatar}
                                alt={author}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </Link>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <Link href={`/watch/${id}`}>
                        <h3 className="text-[14px] font-semibold text-foreground line-clamp-2 leading-snug mb-1 group-hover:text-violet-300 transition-colors">
                            {title}
                        </h3>
                    </Link>
                    <Link href={`/profile/${author}`} className="flex items-center gap-1 text-[13px] text-muted hover:text-muted-2 transition-colors mb-0.5">
                        <span>{author}</span>
                        {isVerified && <VerifiedBadge className="w-3.5 h-3.5 text-[#3b82f6]" />}
                    </Link>
                    <p className="text-[12px] text-muted">
                        {isLive ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                                <Eye size={11} /> {formattedViews} watching
                            </span>
                        ) : (
                            <>{formattedViews} views • {formattedTime}</>
                        )}
                    </p>
                </div>

                {/* More options */}
                <button
                    aria-label="More options"
                    title="More options"
                    className="opacity-0 group-hover:opacity-100 transition-opacity btn btn-ghost btn-icon self-start -mt-1 -mr-2 flex-shrink-0"
                >
                    <MoreVertical size={16} />
                </button>
            </div>
        </div>
    );
}
