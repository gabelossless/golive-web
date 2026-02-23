'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, Frown } from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import { VideoCardSkeleton } from '@/components/VideoCardSkeleton';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            // Simple text search on title/description
            const { data, error } = await supabase
                .from('videos')
                .select('*, profiles(username, avatar_url)')
                .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                .order('view_count', { ascending: false })
                .limit(20);

            if (error) throw error;

            // Transform
            const formatted = (data || []).map(v => ({
                ...v,
                profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
            }));

            setVideos(formatted);
        } catch (err) {
            console.error('Error searching:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black flex items-center gap-2">
                <Search className="text-primary" />
                Results for &quot;{query}&quot;
            </h1>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    {[...Array(8)].map((_, i) => <VideoCardSkeleton key={i} />)}
                </div>
            ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-2 animate-pulse">
                        <Frown size={36} className="text-muted" />
                    </div>
                    <h2 className="text-xl font-bold">No results found</h2>
                    <p className="text-muted">Try searching for something else.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    {videos.map((video) => (
                        <VideoCard
                            key={video.id}
                            id={video.id}
                            title={video.title}
                            thumbnail={video.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e'}
                            author={video.profiles?.username || 'Unknown'}
                            authorAvatar={video.profiles?.avatar_url || 'https://i.pravatar.cc/150'}
                            views={Math.max(video.view_count || 0, video.target_views || 0)}
                            timestamp={video.created_at}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
            <SearchContent />
        </Suspense>
    );
}
