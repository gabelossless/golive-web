'use client';

import React, { useState, useMemo } from 'react';
import VideoCard from '@/components/VideoCard';
import { supabase } from '@/lib/supabase';
import { formatViews, timeAgo } from '@/lib/utils';
import { Flame, Sparkles, TrendingUp, Upload, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { Video } from '@/types';

interface HomeClientProps {
    initialVideos: Video[];
}

const categories = [
    { name: 'All', icon: Sparkles },
    { name: 'FPS', icon: null },
    { name: 'RPG', icon: null },
    { name: 'Speedruns', icon: null },
    { name: 'Indie', icon: null },
    { name: 'Strategy', icon: null },
    { name: 'MOBA', icon: null },
    { name: 'Horror', icon: null },
    { name: 'Simulator', icon: null },
    { name: 'IRL', icon: null },
];

export default function HomeClient({ initialVideos }: HomeClientProps) {
    const [activeCategory, setActiveCategory] = useState('All');
    const [videos, setVideos] = useState<Video[]>(initialVideos);

    // Client-side filtering
    const filteredVideos = useMemo(() => {
        if (activeCategory === 'All') return videos;
        return videos.filter(v => v.category === activeCategory);
    }, [activeCategory, videos]);

    // Top trending video (highest views)
    const heroVideo = useMemo(() => {
        if (videos.length === 0) return null;
        // Sort by view_count (number) directly
        return [...videos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0))[0];
    }, [videos]);

    return (
        <div className="space-y-6">
            {/* Hero Banner - Only show when we have videos */}
            {heroVideo && (
                <Link href={`/watch/${heroVideo.id}`} className="block group relative rounded-2xl overflow-hidden bg-surface mb-2" style={{ aspectRatio: '21/7' }}>
                    <img
                        src={heroVideo.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop'}
                        alt={heroVideo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-primary/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <Flame size={10} /> Trending
                            </span>
                        </div>
                        <h2 className="text-xl md:text-3xl font-black text-white leading-tight mb-2 drop-shadow-lg max-w-2xl">
                            {heroVideo.title}
                        </h2>
                        <div className="flex items-center gap-3 text-white/70 text-sm">
                            <img src={heroVideo.profiles?.avatar_url || 'https://i.pravatar.cc/150'} alt="" className="w-6 h-6 rounded-full" />
                            <span className="font-medium text-white/90">{heroVideo.profiles?.username || 'Unknown'}</span>
                            <span>·</span>
                            <span>{formatViews(heroVideo.view_count || 0)} views</span>
                            <span>·</span>
                            <span>{timeAgo(heroVideo.created_at)}</span>
                        </div>
                    </div>
                </Link>
            )}

            {/* Category Chips */}
            <nav
                className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1 sticky top-[var(--spacing-header)] bg-background/95 backdrop-blur-md z-10 pt-2 border-b border-white/5"
                aria-label="Video categories"
            >
                {categories.map(({ name, icon: Icon }) => (
                    <button
                        key={name}
                        onClick={() => setActiveCategory(name)}
                        className={`chip whitespace-nowrap flex items-center gap-1.5 transition-all duration-300 ${name === activeCategory
                            ? 'chip-active shadow-[0_0_15px_rgba(145,71,255,0.4)] ring-1 ring-primary/50'
                            : 'hover:bg-surface-hover hover:ring-1 hover:ring-white/10'
                            }`}
                    >
                        {Icon && <Icon size={14} />}
                        {name}
                    </button>
                ))}
            </nav>

            {/* Section Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    {activeCategory === 'All' ? (
                        <><Sparkles size={18} className="text-primary drop-shadow-[0_0_8px_rgba(145,71,255,0.6)]" /> Recommended</>
                    ) : (
                        <><Gamepad2 size={18} className="text-primary drop-shadow-[0_0_8px_rgba(145,71,255,0.6)]" /> {activeCategory}</>
                    )}
                </h2>
                <Link href="/trending" className="text-xs text-primary font-bold hover:text-primary-hover hover:drop-shadow-[0_0_5px_rgba(145,71,255,0.5)] transition-all flex items-center gap-1">
                    <TrendingUp size={14} /> See Trending
                </Link>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {filteredVideos.length > 0 ? (
                    filteredVideos.map((video) => (
                        <VideoCard
                            key={video.id}
                            id={video.id}
                            title={video.title}
                            thumbnail={video.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop'}
                            author={video.profiles?.username || 'Unknown'}
                            authorAvatar={video.profiles?.avatar_url || 'https://i.pravatar.cc/150'}
                            views={video.view_count || 0}
                            timestamp={video.created_at}
                            isLive={video.is_live}
                        />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center space-y-5">
                        <div className="w-24 h-24 mx-auto rounded-full glass border border-white/5 flex items-center justify-center shadow-[0_0_30px_rgba(145,71,255,0.15)]">
                            <Upload size={40} className="text-primary opacity-80" />
                        </div>
                        <p className="text-muted font-medium text-lg">No videos found yet.</p>
                        <Link href="/upload" className="btn btn-premium px-8 py-3 rounded-full text-sm font-black inline-flex items-center gap-2">
                            <Upload size={18} /> Be the first to upload!
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

