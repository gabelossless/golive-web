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
                    <Link href={`/profile/${author}`} className="flex-shrink-0">
                        <div className="w-9 h-9 rounded-sm overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
                            <img
                                src={authorAvatar}
                                alt={author}
                                className="w-full h-full object-cover"
                            />
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
                                    {isVerified && <CheckCircle size={10} className="text-primary fill-primary/10" strokeWidth={3} />}
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
