'use client';

import Link from 'next/link';
import { CheckCircle2, MoreVertical } from 'lucide-react';

export interface VideoCardProps {
    video: {
        id: string;
        title?: string;
        thumbnail_url?: string;
        view_count?: number;
        created_at?: string;
        target_views?: number;
        profiles?: { username?: string; avatar_url?: string } | null;
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
        <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
            className="video-card-root"
        >
            {/* Thumbnail */}
            <Link href={`/watch/${video.id}`} style={{ position: 'relative', display: 'block', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', textDecoration: 'none' }}>
                <img
                    src={thumb}
                    alt={video.title || 'Video'}
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_THUMB; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', display: 'block' }}
                    className="vid-thumb"
                />
                {video.duration && !isLive && (
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.82)', padding: '2px 5px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                        {video.duration}
                    </div>
                )}
                {isLive && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                        LIVE
                    </div>
                )}
            </Link>

            {/* Info row */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <Link href={`/profile/${author}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={avatar}
                            alt={author}
                            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_AVATAR; }}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', display: 'block' }}
                        />
                        {isLive && (
                            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', background: '#9147ff', borderRadius: '50%', border: '2px solid #0f0f0f' }} />
                        )}
                    </div>
                </Link>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <Link href={`/watch/${video.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{
                            fontSize: '14px', fontWeight: 600, color: '#fff',
                            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                            lineHeight: 1.4, margin: 0,
                        }}>
                            {video.title || 'Untitled'}
                        </h3>
                    </Link>
                    <Link href={`/profile/${author}`} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px', textDecoration: 'none', width: 'fit-content' }}>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{author}</span>
                        <CheckCircle2 size={11} style={{ color: '#6b7280' }} />
                    </Link>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                        {views > 0 ? `${formatViews(views)} views` : ''}{views > 0 && timeStr ? ' • ' : ''}{timeStr}
                    </div>
                </div>

                <button
                    aria-label="More options"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#9ca3af', borderRadius: '50%', flexShrink: 0, opacity: 0, transition: 'opacity 0.15s', alignSelf: 'flex-start' }}
                    className="vid-menu-btn"
                >
                    <MoreVertical size={16} />
                </button>
            </div>

            <style>{`
        .video-card-root:hover .vid-thumb { transform: scale(1.05); }
        .video-card-root:hover .vid-menu-btn { opacity: 1 !important; }
        .video-card-root:hover h3 { color: #9147ff !important; }
      `}</style>
        </div>
    );
}
