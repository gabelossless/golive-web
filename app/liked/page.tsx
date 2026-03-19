'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Heart, Play, Shuffle } from 'lucide-react';
import { Video } from '@/types';
import VideoCard from '@/components/VideoCard';

export default function LikedPage() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchLikedVideos();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchLikedVideos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('likes')
                .select('video_id, videos(*, profiles(id, username, avatar_url, is_verified, display_name, channel_name))')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const formatted = (data || []).map((l: any) => {
                const v = l.videos;
                return {
                    ...v,
                    profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
                };
            }).filter(v => v !== null);

            setVideos(formatted as any);
        } catch (err) {
            console.error('Error fetching liked videos:', err);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Playlist Info Sidebar */}
            <div className="w-full lg:w-[360px] flex-shrink-0">
                <div className="sticky top-24 rounded-[40px] overflow-hidden bg-gradient-to-br from-[#FFB800]/10 to-background border border-white/5 p-8 flex flex-col min-h-[450px] shadow-2xl">
                    <div className="w-full aspect-video rounded-3xl overflow-hidden mb-8 shadow-2xl relative group bg-white/5">
                        {videos.length > 0 ? (
                            <img src={videos[0].thumbnail_url || ''} alt="Playlist Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                <Heart size={48} className="text-gray-700" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <Play size={48} className="text-[#FFB800] drop-shadow-[0_0_20px_rgba(255,184,0,0.5)]" fill="currentColor" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black mb-3 tracking-tighter">Liked Videos</h1>
                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-500 mb-8">
                        <span className="text-[#FFB800]">{user?.email?.split('@')[0] || 'Member'}</span>
                        <span>•</span>
                        <span>{videos.length} videos</span>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        <button className="flex-1 bg-[#FFB800] text-black rounded-full py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-[#FFB800]/20 active:scale-95 disabled:opacity-50" disabled={videos.length === 0}>
                            <Play size={18} fill="currentColor" /> Play all
                        </button>
                        <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50" disabled={videos.length === 0}>
                            <Shuffle size={18} /> Shuffle
                        </button>
                    </div>
                </div>
            </div>

            {/* Video List */}
            <div className="flex-1">
                {loading ? (
                    <div className="flex justify-center py-20 text-[#FFB800]">
                        <Loader2 size={40} className="animate-spin" />
                    </div>
                ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-[40px] border border-white/5">
                        <Heart size={64} className="text-gray-700 mb-4 opacity-20" />
                        <p className="text-xl font-black uppercase tracking-tighter mb-2">No liked videos yet</p>
                        <p className="text-gray-500 max-w-xs text-center text-xs font-bold uppercase tracking-widest">Tap the Hype or Like button on any video to save it here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-8">
                        {videos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={{
                                    ...video,
                                    thumbnail_url: video.thumbnail_url ?? undefined
                                } as any}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
