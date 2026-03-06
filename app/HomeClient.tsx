'use client';

import React, { useState, useEffect } from 'react';
import VideoCard from '@/components/VideoCard';
import CategoryBar from '@/components/CategoryBar';
import { supabase } from '@/lib/supabase';

export default function HomeClient() {
    const [videos, setVideos] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        if (cat === 'All') { setFiltered(videos); return; }
        if (cat === 'Live') { setFiltered(videos.filter(v => v.is_live)); return; }
        setFiltered(videos.filter(v => (v.category || '').toLowerCase() === cat.toLowerCase()));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <CategoryBar onSelect={handleCategory} />

            <div style={{ padding: '24px' }}>
                {loading ? (
                    <div style={gridStyle}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i}>
                                <div style={{ aspectRatio: '16/9', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '6px' }} />
                                        <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '66%' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div style={gridStyle}>
                        {filtered.map(video => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px', textAlign: 'center' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🎬</div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>No videos yet</h2>
                        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Be the first to upload.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '32px 16px',
};
