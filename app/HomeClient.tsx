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
        <div className="space-y-12">
            {/* Cinematic Hero Showcase */}
            {heroVideo && (
                <Link href={`/watch/${heroVideo.id}`} className="block group relative rounded-sm overflow-hidden bg-surface mb-6 border border-white/5" style={{ aspectRatio: '21/8' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
                    <img
                        src={heroVideo.thumbnail_url || `https://source.unsplash.com/random/1600x900?gaming&sig=${heroVideo.id}`}
                        alt={heroVideo.title}
                        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-in-out"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-12 md:p-16 z-20">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-sm uppercase tracking-[0.2em] flex items-center gap-2">
                                <Flame size={12} strokeWidth={3} /> FEATURED PREMIERE
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-7xl font-black text-white leading-[0.9] mb-6 max-w-4xl tracking-tighter uppercase italic">
                            {heroVideo.title}
                        </h2>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={heroVideo.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${heroVideo.profiles?.username || 'user'}&backgroundColor=E50914`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-white font-black text-xs tracking-widest uppercase">{heroVideo.profiles?.username || 'ANONYMOUS'}</span>
                            </div>
                            <div className="h-4 w-px bg-white/20" />
                            <div className="flex items-center gap-6 text-[10px] font-bold tracking-widest text-white/60 uppercase">
                                <span>{formatViews(heroVideo.view_count || 0)} VIEWS</span>
                                <span>{timeAgo(heroVideo.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </Link>
            )}

            {/* Premium Category Navigation */}
            <nav
                className="flex gap-4 overflow-x-auto no-scrollbar pb-6 sticky top-[var(--spacing-header)] bg-[#050505]/95 backdrop-blur-3xl z-30 pt-4 border-b border-white/5"
                aria-label="Filter videos"
            >
                {categories.map(({ name, icon: Icon }) => (
                    <button
                        key={name}
                        onClick={() => setActiveCategory(name)}
                        className={`text-[10px] font-black tracking-[0.2em] uppercase transition-all px-4 py-2 border rounded-sm ${name === activeCategory
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                    >
                        {name}
                    </button>
                ))}
            </nav>

            {/* Video Showcase Grid */}
            <div className="space-y-8">
                <div className="flex items-end justify-between border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">
                        {activeCategory === 'All' ? 'LATEST BREACHES' : activeCategory}
                    </h2>
                    <Link href="/trending" className="text-[10px] font-black tracking-widest text-primary hover:text-white transition-colors uppercase">
                        BROWSE ALL TRENDING →
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                    {filteredVideos.length > 0 ? (
                        filteredVideos.map((video) => (
                            <VideoCard
                                key={video.id}
                                id={video.id}
                                title={video.title}
                                thumbnail={video.thumbnail_url || `https://source.unsplash.com/random/800x450?gaming&sig=${video.id}`}
                                author={video.profiles?.username || 'ANONYMOUS'}
                                authorAvatar={video.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${video.profiles?.username || 'user'}&backgroundColor=E50914`}
                                views={video.view_count || 0}
                                timestamp={video.created_at}
                                isLive={video.is_live}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-sm">
                            <Upload size={32} className="mx-auto text-primary/40 mb-4" />
                            <p className="text-white/40 font-black tracking-widest text-xs uppercase italic">NO INTEL FOUND IN THIS CATEGORY</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

