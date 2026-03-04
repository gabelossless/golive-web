'use client';

import React from 'react';
import Link from 'next/link';
import { MoreVertical, Eye } from 'lucide-react';
import { formatViews, timeAgo } from '@/lib/utils';

// Premium Verified Badge (Twitter/IG Style)
export const VerifiedBadge = ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-label="Verified account" role="img" className={className} data-testid="icon-verified">
        <g>
            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.74 2.746 1.867 3.45-.09.373-.138.763-.138 1.15 0 2.21 1.71 4 3.918 4 .58 0 1.134-.14 1.625-.386C9.406 21.603 10.636 22.5 12 22.5c1.36 0 2.59-.897 3.167-2.136.492.247 1.046.387 1.626.387 2.21 0 3.918-1.79 3.918-4 0-.387-.048-.777-.138-1.15 1.127-.704 1.867-1.99 1.867-3.45zm-11.16 4.08l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z" fill="currentColor"></path>
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
        <div className="group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Thumbnail Showcase */}
            <Link href={`/watch/${id}`} className="block relative rounded-sm overflow-hidden bg-card group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] group-hover:-translate-y-1 transition-all duration-500 border border-white/5 group-hover:border-primary/50" style={{ aspectRatio: '16/9' }}>
                <img
                    src={thumbnail}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[1.2s] ease-[cubic-bezier(0.4,0,0.2,1)]"
                />
                {/* Status Badges */}
                <div className="absolute bottom-2 right-2 flex gap-2">
                    {isLive ? (
                        <span className="live-badge !rounded-sm tracking-widest px-2 font-black">
                            LIVE
                        </span>
                    ) : (
                        <span className="bg-black/90 text-white text-[9px] font-black px-1.5 py-1 rounded-sm tracking-[0.1em] border border-white/10 uppercase">
                            {duration}
                        </span>
                    )}
                </div>
                {/* Cinematic Hover Progress Shimmer */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-full bg-primary w-0 group-hover:w-full transition-all duration-[1s] ease-in-out shadow-[0_0_12px_rgba(229,9,20,0.8)]" />
                </div>
            </Link>

            {/* Meta Data */}
            <div className="mt-4 px-1">
                <div className="flex gap-4">
                    <Link href={`/profile/${author}`} className="flex-shrink-0 relative">
                        <div className={`w-9 h-9 rounded-full overflow-hidden transition-colors ${isVerified
                                ? 'p-[2px] bg-gradient-to-tr from-blue-500 via-primary to-purple-500 group-hover:from-blue-400 group-hover:to-purple-400 shadow-[0_0_10px_rgba(229,9,20,0.3)]'
                                : 'border border-white/10 group-hover:border-primary/50'
                            }`}>
                            <div className="w-full h-full rounded-full overflow-hidden border border-black bg-surface">
                                <img
                                    src={authorAvatar}
                                    alt={author}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                        <Link href={`/watch/${id}`}>
                            <h3 className="text-[13px] font-black text-white line-clamp-2 leading-[1.2] uppercase tracking-tighter group-hover:text-primary transition-colors italic">
                                {title}
                            </h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-2">
                            <Link href={`/profile/${author}`}>
                                <p className="text-[10px] font-bold text-white/50 hover:text-white transition-colors tracking-widest uppercase flex items-center gap-1.5">
                                    {author}
                                    {isVerified && <VerifiedBadge className="w-3.5 h-3.5 text-[#1D9BF0]" />}
                                </p>
                            </Link>
                        </div>
                        <p className="text-[10px] font-bold text-white/30 mt-1 uppercase tracking-widest">
                            {isLive ? (
                                <span className="text-primary flex items-center gap-1.5"><Eye size={10} strokeWidth={3} /> {formattedViews} WATCHING</span>
                            ) : (
                                <>{formattedViews} VIEWS • {formattedTime}</>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
