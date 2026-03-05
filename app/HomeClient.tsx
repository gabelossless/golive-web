'use client';

import React, { useState, useMemo } from 'react';
import VideoCard from '@/components/VideoCard';
import { formatViews, timeAgo } from '@/lib/utils';
import { Flame, Sparkles, Play, Upload, ChevronRight, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { Video } from '@/types';

interface HomeClientProps {
    initialVideos: Video[];
}

const categories = [
    'All', 'FPS', 'RPG', 'Speedruns', 'Indie', 'Strategy', 'MOBA', 'Horror', 'Simulator', 'IRL',
];

export default function HomeClient({ initialVideos }: HomeClientProps) {
    const [activeCategory, setActiveCategory] = useState('All');
    const [videos] = useState<Video[]>(initialVideos);

    const filteredVideos = useMemo(() => {
        if (activeCategory === 'All') return videos;
        return videos.filter(v => v.category === activeCategory);
    }, [activeCategory, videos]);

    const heroVideo = useMemo(() => {
        if (videos.length === 0) return null;
        return [...videos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0))[0];
    }, [videos]);

    return (
        <div className="space-y-8 page-enter">

            {/* ─── Hero Banner ─── */}
            {heroVideo ? (
                <Link
                    href={`/watch/${heroVideo.id}`}
                    className="block group relative rounded-3xl overflow-hidden bg-surface"
                    style={{ aspectRatio: '21/8', minHeight: '220px' }}
                >
                    {/* Background image */}
                    <img
                        src={heroVideo.thumbnail_url || `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80`}
                        alt={heroVideo.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-out"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="flex items-center gap-1.5 bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                                <Flame size={11} />
                                Featured
                            </span>
                        </div>
                        <h2 className="text-display text-2xl md:text-5xl text-white font-bold leading-tight mb-4 max-w-3xl">
                            {heroVideo.title}
                        </h2>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <img
                                    src={heroVideo.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${heroVideo.profiles?.username}&backgroundColor=7c3aed&textColor=ffffff`}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover ring-2 ring-white/20"
                                />
                                <span className="text-white/90 text-sm font-medium">{heroVideo.profiles?.username || 'Anonymous'}</span>
                            </div>
                            <span className="text-white/40 text-sm">{formatViews(heroVideo.view_count || 0)} views</span>
                            <span className="text-white/40 text-sm">{timeAgo(heroVideo.created_at)}</span>
                        </div>
                    </div>

                    {/* Play button center */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-2xl">
                            <Play size={28} className="text-white ml-1.5" fill="white" />
                        </div>
                    </div>
                </Link>
            ) : (
                /* Empty hero CTA */
                <div className="glass-card rounded-3xl overflow-hidden relative" style={{ minHeight: '220px' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-background to-cyan-900/20" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full py-16 text-center px-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-4">
                            <Sparkles size={28} className="text-violet-400" />
                        </div>
                        <h2 className="text-display text-2xl md:text-3xl font-bold text-white mb-2">Be the First Creator</h2>
                        <p className="text-muted text-sm mb-6 max-w-xs">Upload your first video and take center stage.</p>
                        <Link href="/upload" className="btn btn-primary">
                            <Upload size={16} /> Upload Now
                        </Link>
                    </div>
                </div>
            )}

            {/* ─── Category Pills ─── */}
            <nav
                className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 sticky top-[var(--spacing-header)] bg-background/90 backdrop-blur-xl z-30 pt-3 -mx-4 px-4 md:-mx-6 md:px-6"
                aria-label="Filter by category"
            >
                {categories.map((name) => (
                    <button
                        key={name}
                        onClick={() => setActiveCategory(name)}
                        className={`category-pill flex-shrink-0 ${name === activeCategory ? 'active' : ''}`}
                    >
                        {name}
                    </button>
                ))}
            </nav>

            {/* ─── Videos Grid ─── */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-display text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                        {activeCategory === 'All' ? (
                            <><TrendingUp size={22} className="text-violet-400" /> Latest Videos</>
                        ) : (
                            <><Zap size={22} className="text-violet-400" /> {activeCategory}</>
                        )}
                    </h2>
                    <Link
                        href="/trending"
                        className="flex items-center gap-1 text-sm text-muted hover:text-violet-400 transition-colors font-medium"
                    >
                        See all <ChevronRight size={16} />
                    </Link>
                </div>

                {filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                        {filteredVideos.map((video) => (
                            <VideoCard
                                key={video.id}
                                id={video.id}
                                title={video.title}
                                thumbnail={video.thumbnail_url || `https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=800&q=80`}
                                author={video.profiles?.username || 'Anonymous'}
                                authorAvatar={video.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${video.profiles?.username}&backgroundColor=7c3aed&textColor=ffffff`}
                                views={video.view_count || 0}
                                timestamp={video.created_at}
                                isLive={video.is_live}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center glass-card rounded-3xl border-dashed !border-white/8">
                        <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
                            <Upload size={24} className="text-muted" />
                        </div>
                        <p className="text-foreground font-semibold mb-1">No videos in this category</p>
                        <p className="text-muted text-sm mb-6">Be the first to post here</p>
                        <Link href="/upload" className="btn btn-primary btn-sm">
                            Upload Video
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
