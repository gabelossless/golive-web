'use client';

import React, { useState, useMemo } from 'react';
import VideoCard from '@/components/VideoCard';
import { formatViews, timeAgo } from '@/lib/utils';
import { Upload } from 'lucide-react';
import Link from 'next/link';
import { Video } from '@/types';

interface HomeClientProps { initialVideos: Video[]; }

const categories = [
    'All', 'Gaming', 'Music', 'Live', 'FPS', 'RPG', 'Indie',
    'Tech', 'IRL', 'Sports', 'Podcasts', 'Animation',
];

export default function HomeClient({ initialVideos }: HomeClientProps) {
    const [activeCategory, setActiveCategory] = useState('All');
    const [videos] = useState<Video[]>(initialVideos);

    const filteredVideos = useMemo(() => {
        if (activeCategory === 'All') return videos;
        return videos.filter(v =>
            v.category?.toLowerCase() === activeCategory.toLowerCase() ||
            (activeCategory === 'Live' && v.is_live)
        );
    }, [activeCategory, videos]);

    return (
        <div>
            {/* ── Category chip bar (YouTube-style) ── */}
            <div className="chip-bar" style={{ marginBottom: 8 }}>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`chip ${cat === activeCategory ? 'active' : ''}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* ── Video grid ── */}
            {filteredVideos.length > 0 ? (
                <div className="video-grid">
                    {filteredVideos.map((video) => {
                        const p = Array.isArray(video.profiles) ? video.profiles[0] : video.profiles;
                        return (
                            <VideoCard
                                key={video.id}
                                id={video.id}
                                title={video.title}
                                thumbnail={video.thumbnail_url || `https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=640&q=60`}
                                author={p?.username || 'Anonymous'}
                                authorAvatar={p?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p?.username}&backgroundColor=9147ff&textColor=ffffff`}
                                views={video.view_count || 0}
                                timestamp={video.created_at}
                                isLive={video.is_live}
                            />
                        );
                    })}
                </div>
            ) : (
                /* Empty state */
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: 400, gap: 16, textAlign: 'center',
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Upload size={32} color="var(--color-muted)" />
                    </div>
                    <div>
                        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                            {activeCategory === 'All' ? 'No videos yet' : `No ${activeCategory} videos yet`}
                        </p>
                        <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 20 }}>
                            Be the first to upload content
                        </p>
                        <Link href="/upload" className="btn btn-primary">
                            Upload video
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
