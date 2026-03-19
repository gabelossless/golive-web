'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import VideoCard from '@/components/VideoCard';
import CategoryBar from '@/components/CategoryBar';
import VideoSkeleton from '@/components/VideoSkeleton';
import { supabase } from '@/lib/supabase';
import { rankVideos } from '@/lib/vibe-rank';
import { ChevronRight } from 'lucide-react';

export default function HomeClient() {
    const [videos, setVideos] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVideos() {
            const { data, error } = await supabase
                .from('videos')
                .select(`
                    id, 
                    title, 
                    thumbnail_url, 
                    view_count, 
                    target_views, 
                    created_at, 
                    is_live, 
                    duration, 
                    category, 
                    description, 
                    width, 
                    height,
                    is_short,
                    profiles (
                        id, 
                        username, 
                        avatar_url,
                        is_verified
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(48);

            if (!error && data) {
                const normalized = data.map((v: any) => ({
                    ...v,
                    profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
                }));
                // Filter out private videos safely
                const pubVideos = normalized.filter(v => !(v.description || '').includes('[PRIVATE_VIDEO_FLAG]'));

                // Rank videos by quality & velocity
                const ranked = rankVideos(pubVideos);

                setVideos(ranked);
                setFiltered(ranked);
            }
            setLoading(false);
        }
        fetchVideos();
    }, []);

    const handleCategory = (cat: string) => {
        if (cat === 'All') { setFiltered(videos); return; }
        if (cat === 'Recent') {
            const sorted = [...videos].sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setFiltered(sorted);
            return;
        }
        if (cat === 'Live') { setFiltered(videos.filter((v: any) => v.is_live)); return; }
        setFiltered(videos.filter((v: any) => (v.category || '').toLowerCase() === cat.toLowerCase()));
    };

    const featuredVideo = filtered[0]; // Just use latest for now, real app might curate this

    return (
        <div className="flex flex-col min-h-full">
            <CategoryBar onSelect={handleCategory} />

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
                                alt={featuredVideo.title || 'Featured video'}
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

                {/* Trending Shorts Section */}
                {!loading && videos.some(v => v.is_short) && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-2 md:px-0">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-[#FFB800] rounded-lg">
                                    <span className="w-3 h-3 block bg-black rounded-sm" />
                                </span>
                                <h2 className="text-xl font-black uppercase tracking-tight">Trending Shorts</h2>
                            </div>
                            <Link href="/shorts" className="text-xs font-black uppercase tracking-widest text-[#FFB800] hover:underline">View All</Link>
                        </div>

                        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar scroll-smooth snap-x">
                            {videos.filter(v => v.is_short).slice(0, 10).map((short) => (
                                <motion.div 
                                    key={short.id} 
                                    className="flex-none w-44 md:w-52 snap-start"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <Link href={`/shorts?id=${short.id}`} className="block relative aspect-[9/16] rounded-2xl overflow-hidden group">
                                        <img 
                                            src={short.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop'} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            alt={short.title}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                                            <p className="text-white text-sm font-bold line-clamp-2 mb-1">{short.title}</p>
                                            <p className="text-white/60 text-[10px] font-bold uppercase">{short.view_count || 0} views</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2 md:px-0">
                        <h2 className="text-xl font-black uppercase tracking-tight">Recommended for you</h2>
                        <button className="text-xs font-black uppercase tracking-widest text-[#FFB800] hover:underline">Refresh Feed</button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <VideoSkeleton key={i} />
                            ))}
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10">
                            {/* First row of videos (top 5) */}
                            {filtered.slice(0, 5).map((video: any, index: number) => (
                                <motion.div
                                    key={video.id}
                                    whileHover={{ y: -5 }}
                                    className="transition-transform duration-300"
                                >
                                    <VideoCard video={video as any} />
                                </motion.div>
                            ))}

                            {/* Intermixed Shorts Shelf */}
                            {videos.some(v => v.is_short) && (
                                <div className="col-span-full py-10 border-y border-white/5 my-6">
                                    <div className="flex items-center justify-between mb-8 px-2 md:px-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-8 bg-[#FFB800] rounded-full" />
                                            <h2 className="text-2xl font-black tracking-tight uppercase italic">Shorts</h2>
                                        </div>
                                        <Link href="/shorts" className="text-sm font-bold text-[#FFB800] hover:text-white transition-colors flex items-center gap-1 group">
                                            View All <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4">
                                        {videos.filter((v: any) => v.is_short).slice(0, 6).map((short: any, i: number) => (
                                            <motion.div
                                                key={short.id}
                                                whileHover={{ y: -8 }}
                                                className="group"
                                            >
                                                <Link href={`/shorts?id=${short.id}`} className="block">
                                                    <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-white/5 relative shadow-2xl border border-white/5 group-hover:border-[#FFB800]/30 transition-all">
                                                        <img
                                                            src={short.thumbnail_url || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80'}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                            alt={short.title}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                                                        <div className="absolute bottom-4 left-4 right-4 text-left">
                                                            <p className="text-sm font-black leading-tight line-clamp-2 drop-shadow-2xl text-white group-hover:text-[#FFB800] transition-colors">{short.title}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">{short.view_count || 0} views</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Remaining videos */}
                            {filtered.slice(5).map((video: any, index: number) => (
                                <motion.div
                                    key={video.id}
                                    whileHover={{ y: -5 }}
                                    className="transition-transform duration-300"
                                >
                                    <VideoCard video={video as any} />
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
