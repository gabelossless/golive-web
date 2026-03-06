'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Filter, CheckCircle2, MoreVertical, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { formatViews } from '@/lib/utils';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query) {
            fetchResults();
        } else {
            setLoading(false);
            setVideos([]);
        }
    }, [query]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*, profiles(username, avatar_url, is_verified)')
                .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                .order('view_count', { ascending: false })
                .limit(20);

            if (error) throw error;

            const formatted = (data || []).map(v => ({
                ...v,
                profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
            }));

            // Safe filter
            setVideos(formatted.filter((v: any) => !(v.description || '').includes('[PRIVATE_VIDEO_FLAG]')));
        } catch (err) {
            console.error('Error searching:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1100px] mx-auto p-4 md:p-6 lg:p-8 w-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Search results for "{query}"</h2>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors border-none cursor-pointer text-white">
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="flex justify-center py-20 text-[#FFB800]">
                        <Loader2 size={40} className="animate-spin" />
                    </div>
                ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>No results found for "{query}"</p>
                    </div>
                ) : (
                    videos.map((video, index) => {
                        const author = video.profiles?.username || 'Unknown';
                        const avatar = video.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`;

                        return (
                            <motion.div
                                key={video.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex flex-col sm:flex-row gap-4 group cursor-pointer"
                            >
                                <Link href={`/watch/${video.id}`} className="relative flex-shrink-0 w-full sm:w-80 aspect-video rounded-xl overflow-hidden bg-white/5">
                                    <img
                                        src={video.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop'}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        referrerPolicy="no-referrer"
                                    />
                                    {video.duration && !video.is_live && (
                                        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                            {video.duration}
                                        </div>
                                    )}
                                    {video.is_live && (
                                        <div className="absolute top-2 left-2 live-badge">Live</div>
                                    )}
                                </Link>

                                <div className="flex flex-col flex-1 min-w-0 py-1">
                                    <div className="flex justify-between gap-2">
                                        <Link href={`/watch/${video.id}`} className="no-underline">
                                            <h3 className="text-lg font-bold line-clamp-2 group-hover:text-[#FFB800] transition-colors text-white m-0">
                                                {video.title}
                                            </h3>
                                        </Link>
                                        <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-full h-fit text-gray-400 border-none bg-transparent cursor-pointer">
                                            <MoreVertical size={20} />
                                        </button>
                                    </div>

                                    <div className="text-xs text-gray-400 mt-1">
                                        {formatViews(video.target_views || video.view_count || 0)} views • {new Date(video.created_at).toLocaleDateString()}
                                    </div>

                                    <Link
                                        href={`/profile/${author}`}
                                        className="flex items-center gap-2 my-3 hover:text-white transition-colors no-underline w-fit"
                                    >
                                        <img
                                            src={avatar}
                                            alt={author}
                                            className="w-6 h-6 rounded-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            {author}
                                            {(video.profiles as any)?.is_verified && <CheckCircle2 size={12} className="text-[#FFB800]" />}
                                        </span>
                                    </Link>

                                    <p className="text-xs text-gray-400 line-clamp-2 m-0">
                                        {video.description?.trim() || 'No description available.'}
                                    </p>

                                    {video.is_live && (
                                        <div className="mt-2">
                                            <span className="text-[10px] bg-red-600/20 text-red-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                New Live
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20 text-[#FFB800]">
                <Loader2 size={40} className="animate-spin" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
