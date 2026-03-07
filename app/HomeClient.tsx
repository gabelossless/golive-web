'use client';

import React, { useState, useEffect } from 'react';
import VideoCard from '@/components/VideoCard';
import CategoryBar from '@/components/CategoryBar';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function HomeClient() {
    const [videos, setVideos] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVideos() {
            const { data, error } = await supabase
                .from('videos')
                .select('id, title, thumbnail_url, view_count, target_views, created_at, is_live, duration, category, description, profiles(username, avatar_url)')
                .order('created_at', { ascending: false });

            if (!error && data) {
                const normalized = data.map((v: any) => ({
                    ...v,
                    profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
                }));
                // Filter out private videos safely
                const pubVideos = normalized.filter(v => !(v.description || '').includes('[PRIVATE_VIDEO_FLAG]'));
                setVideos(pubVideos);
                setFiltered(pubVideos);
            }
            setLoading(false);
        }
        fetchVideos();
    }, []);

    const handleCategory = (cat: string) => {
        if (cat === 'All') { setFiltered(videos); return; }
        if (cat === 'Live') { setFiltered(videos.filter(v => v.is_live)); return; }
        setFiltered(videos.filter(v => (v.category || '').toLowerCase() === cat.toLowerCase()));
    };

    const featuredVideo = filtered[0]; // Just use latest for now, real app might curate this

    return (
        <div className="flex flex-col min-h-full">
            <CategoryBar />

            <div className="p-2 sm:p-4 md:p-6 lg:p-8 space-y-12">
                {/* Featured Hero Section */}
                {!loading && featuredVideo && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden group cursor-pointer hidden md:block"
                    >
                        <Link href={`/watch/${featuredVideo.id}`}>
                            <img
                                src={featuredVideo.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                alt=""
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-8 flex flex-col justify-end gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="bg-[#FFB800] text-black text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">Featured</span>
                                    {featuredVideo.is_live && <span className="text-xs font-bold text-red-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live</span>}
                                </div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter max-w-2xl leading-none">
                                    {featuredVideo.title || 'Untitled'}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <img src={featuredVideo.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${featuredVideo.profiles?.username}`} className="w-6 h-6 rounded-full" alt="" />
                                        <span className="text-sm font-bold">{featuredVideo.profiles?.username || 'Unknown'}</span>
                                    </div>
                                    <span className="text-sm text-white/60 font-medium">{Math.max(featuredVideo.view_count || 0, featuredVideo.target_views || 0)} views</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2 md:px-0">
                        <h2 className="text-xl font-black uppercase tracking-tight">Recommended for you</h2>
                        <button className="text-xs font-black uppercase tracking-widest text-[#FFB800] hover:underline">Refresh Feed</button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-6 sm:gap-y-8">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="aspect-video bg-white/5 rounded-xl mb-3" />
                                    <div className="flex gap-3">
                                        <div className="w-9 h-9 rounded-full bg-white/5 shrink-0" />
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 bg-white/5 rounded w-3/4" />
                                            <div className="h-3 bg-white/5 rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-6 sm:gap-y-8">
                            {filtered.map((video, index) => (
                                <motion.div
                                    key={video.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    viewport={{ once: true }}
                                >
                                    <VideoCard video={video} />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl">🎬</div>
                            <h2 className="text-xl font-bold">No videos found</h2>
                            <p className="text-gray-400 text-sm">Check back later or try a different category.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
