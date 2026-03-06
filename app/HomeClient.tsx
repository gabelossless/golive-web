'use client';

import React, { useState, useEffect } from 'react';
import VideoCard from '@/components/VideoCard';
import CategoryBar from '@/components/CategoryBar';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['All', 'Gaming', 'Technology', 'Music', 'Live', 'Education', 'Entertainment', 'Just Chatting', 'Sports'];

export default function HomeClient() {
    const [videos, setVideos] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');

    useEffect(() => {
        async function fetchVideos() {
            const { data, error } = await supabase
                .from('videos')
                .select('id, title, thumbnail_url, view_count, target_views, created_at, is_live, duration, profiles(username, avatar_url)')
                .not('description', 'ilike', '%[PRIVATE_VIDEO_FLAG]%')
                .order('created_at', { ascending: false });

            if (!error && data) {
                const normalized = data.map((v: any) => ({
                    ...v,
                    profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
                }));
                setVideos(normalized);
                setFiltered(normalized);
            }
            setLoading(false);
        }
        fetchVideos();
    }, []);

    const handleCategory = (cat: string) => {
        setCategory(cat);
        if (cat === 'All') {
            setFiltered(videos);
        } else {
            setFiltered(videos.filter(v => v.category === cat || (cat === 'Live' && v.is_live)));
        }
    };

    return (
        <div className="flex flex-col min-h-full">
            <CategoryBar onSelect={handleCategory} />

            <div className="p-4 md:p-6 lg:p-8">
                {loading ? (
                    /* Skeleton grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-3">
                                <div className="aspect-video rounded-xl bg-white/5 animate-pulse" />
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
                                    <div className="flex flex-col gap-2 flex-1">
                                        <div className="h-3 bg-white/5 animate-pulse rounded" />
                                        <div className="h-3 bg-white/5 animate-pulse rounded w-2/3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
                        {filtered.map((video, i) => (
                            <div key={video.id} style={{ animationDelay: `${i * 50}ms` }}>
                                <VideoCard video={video} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <span className="text-3xl">🎬</span>
                        </div>
                        <h2 className="text-xl font-bold text-white">No videos yet</h2>
                        <p className="text-gray-400 text-sm">Be the first to upload a video.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
