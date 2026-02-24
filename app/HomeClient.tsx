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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 backdrop-blur-sm bg-gradient-to-t from-[#0a0a0a]/90 to-transparent border-t border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-primary hover:bg-primary-hover shadow-[0_0_15px_rgba(145,71,255,0.5)] transition-colors text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 cursor-default">
                                <Flame size={12} className="animate-pulse" /> Trending Now
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-2xl max-w-3xl tracking-tight">
                            {heroVideo.title}
                        </h2>
                        <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                <img src={heroVideo.profiles?.avatar_url || 'https://i.pravatar.cc/150'} alt="" className="w-5 h-5 rounded-full" />
                                <span className="text-white font-bold">{heroVideo.profiles?.username || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-4 border-l border-white/20 pl-4">
                                <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-primary" /> {formatViews(heroVideo.view_count || 0)} views</span>
                                <span className="w-1 h-1 rounded-full bg-white/40" />
                                <span>{timeAgo(heroVideo.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </Link>
            )}

            {/* Category Chips */}
            <nav
                className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1 sticky top-[var(--spacing-header)] bg-[#0a0a0a]/90 backdrop-blur-xl z-20 pt-4 border-b border-white/5 shadow-2xl shadow-black/50"
                aria-label="Video categories"
            >
                {categories.map(({ name, icon: Icon }) => (
                    <button
                        key={name}
                        onClick={() => setActiveCategory(name)}
                        className={`chip whitespace-nowrap flex items-center gap-2 transition-all duration-300 px-5 py-2 rounded-full text-sm font-bold ${name === activeCategory
                            ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)] scale-105'
                            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 hover:border-white/10'
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

