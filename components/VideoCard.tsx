'use client';

import React from 'react';
import Link from 'next/link';
import { MoreVertical, Eye } from 'lucide-react';
import { formatViews, timeAgo } from '@/lib/utils';

// Verified badge (YouTube/Twitter style)
export const VerifiedBadge = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-label="Verified" className={`verified-icon ${className}`} fill="currentColor">
        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.74 2.746 1.867 3.45-.09.373-.138.763-.138 1.15 0 2.21 1.71 4 3.918 4 .58 0 1.134-.14 1.625-.386C9.406 21.603 10.636 22.5 12 22.5c1.36 0 2.59-.897 3.167-2.136.492.247 1.046.387 1.626.387 2.21 0 3.918-1.79 3.918-4 0-.387-.048-.777-.138-1.15 1.127-.704 1.867-1.99 1.867-3.45zm-11.16 4.08l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z" />
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
    id, title, thumbnail, author, authorAvatar,
    views, timestamp, duration = '10:42', isLive = false, isVerified = false,
}: VideoCardProps) {
    const formattedViews = formatViews(views);
    const formattedTime = timestamp?.includes('ago') ? timestamp : timeAgo(timestamp);

    return (
        <div className="video-card group">
            {/* Thumbnail */}
            <Link href={`/watch/${id}`} className="block">
                <div className="video-thumbnail">
                    <img
                        src={thumbnail}
                        alt={title}
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&q=60`;
                        }}
                    />
                    {isLive ? (
                        <span className="video-live-badge">
                            <span className="video-live-dot" />
                            LIVE
                        </span>
                    ) : (
                        <span className="video-duration">{duration}</span>
                    )}
                    {isLive && (
                        <span className="video-views-live">
                            <Eye size={10} style={{ display: 'inline', marginRight: 3 }} />
                            {formattedViews}
                        </span>
                    )}
                </div>
            </Link>

            {/* Meta */}
            <div className="video-meta">
                <Link href={`/profile/${author}`} className="video-avatar flex-shrink-0">
                    <img
                        src={authorAvatar}
                        alt={author}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${author}&backgroundColor=9147ff&textColor=ffffff`;
                        }}
                    />
                </Link>
                <div className="video-info">
                    <Link href={`/watch/${id}`}>
                        <h3 className="video-title">{title}</h3>
                    </Link>
                    <Link href={`/profile/${author}`} className="video-author">
                        {author}
                        {isVerified && <VerifiedBadge />}
                    </Link>
                    {!isLive && (
                        <p className="video-stats">
                            {formattedViews} views &bull; {formattedTime}
                        </p>
                    )}
                </div>
                <button
                    aria-label="More options"
                    className="icon-btn opacity-0 group-hover:opacity-100 -mt-1 -mr-2 self-start flex-shrink-0"
                    style={{ width: 32, height: 32 }}
                >
                    <MoreVertical size={16} />
                </button>
            </div>
        </div>
    );
}
