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
            <div className="w-full lg:w-[380px] flex-shrink-0">
                <div className="sticky top-24 rounded-[32px] overflow-hidden bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-8 flex flex-col min-h-[500px] shadow-2xl relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/5 to-transparent opacity-50" />
                    <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8 shadow-2xl relative group/img bg-white/5 border border-white/10">
                        {videos.length > 0 ? (
                            <img src={videos[0].thumbnail_url || ''} alt="Playlist Cover" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                <Heart size={48} className="text-zinc-800" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-sm">
                            <Play size={48} className="text-[#FFB800] drop-shadow-[0_0_20px_rgba(255,184,0,0.5)]" fill="currentColor" />
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-4xl font-black mb-3 tracking-tighter italic font-premium text-gradient">Liked Videos</h1>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 italic">
                            <span className="text-[#FFB800]">{user?.email?.split('@')[0] || 'Member'}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                            <span>{videos.length} videos</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col gap-3 mt-auto">
                        <button className="flex-1 bg-white text-black rounded-full py-4 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50" disabled={videos.length === 0}>
                            <Play size={16} fill="currentColor" /> Play All
                        </button>
                        <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-4 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-white" disabled={videos.length === 0}>
                            <Shuffle size={16} /> Shuffle
                        </button>
                    </div>
                </div>
            </div>

            {/* Video List */}
            <div className="flex-1">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {Array.from({ length: 9 }).map((_, i) => (
                             <div key={i} className="animate-pulse space-y-4">
                                 <div className="aspect-video bg-white/5 rounded-xl" />
                                 <div className="flex gap-4">
                                     <div className="w-10 h-10 rounded-full bg-white/5" />
                                     <div className="flex-1 space-y-2 py-1">
                                         <div className="h-4 bg-white/5 rounded w-3/4" />
                                         <div className="h-3 bg-white/5 rounded w-1/2" />
                                     </div>
                                 </div>
                             </div>
                        ))}
                    </div>
                ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] rounded-[40px] border border-white/5">
                        <Heart size={64} className="text-[#FFB800] mb-6 opacity-20" />
                        <p className="text-2xl font-black uppercase tracking-tighter mb-2">Your library is waiting</p>
                        <p className="text-zinc-500 max-w-xs text-center text-[10px] font-black uppercase tracking-[0.2em] italic">Tap Hype or Like on any video to curate your vibe here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
