'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import VideoCard from '@/components/VideoCard';
import CategoryBar from '@/components/CategoryBar';
import { Loader2 } from 'lucide-react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Video {
    id: string;
    title: string;
    thumbnail_url?: string | null;
    view_count?: number;
    created_at?: string;
    boosted?: boolean;
    profiles?: { username: string; avatar_url?: string | null } | null;
}

export default function HomeClient() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [filtered, setFiltered] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        async function fetchVideos() {
            const { data, error } = await supabase
                .from('videos')
                .select(`
          id, title, thumbnail_url, view_count, created_at, boosted,
          profiles(username, avatar_url)
        `)
                .not('description', 'ilike', '%[PRIVATE_VIDEO_FLAG]%')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setVideos(data as unknown as Video[]);
                setFiltered(data as unknown as Video[]);
            }
            setLoading(false);
        }
        fetchVideos();
    }, []);

    useEffect(() => {
        if (activeCategory === 'All') {
            setFiltered(videos);
        } else {
            // Filter by category word in title or just show all for now
            setFiltered(videos);
        }
    }, [activeCategory, videos]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin text-[#9147ff]" size={36} />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full">
            <CategoryBar onCategoryChange={setActiveCategory} />
            <div className="p-4 md:p-6 lg:p-8">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
                        <div className="text-6xl">🎬</div>
                        <h2 className="text-2xl font-bold">No videos yet</h2>
                        <p className="text-gray-400">Be the first to upload something amazing.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
                        {filtered.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
