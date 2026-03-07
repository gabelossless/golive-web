'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Shield, Zap, TrendingUp, Users, MessageSquare, ThumbsUp } from 'lucide-react';

export default function AdminPage() {
    const { user, profile } = useAuth();
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [boostingId, setBoostingId] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.is_admin) {
            fetchVideos();
        }
    }, [profile]);

    async function fetchVideos() {
        setLoading(true);
        const { data } = await supabase
            .from('videos')
            .select('*, profiles(username)')
            .order('created_at', { ascending: false })
            .limit(20);
        if (data) setVideos(data);
        setLoading(false);
    }

    const triggerBoost = async (videoId: string, targetViews: number) => {
        setBoostingId(videoId);
        try {
            await supabase.from('videos').update({
                boosted: true,
                target_views: targetViews,
                target_likes: Math.floor(targetViews * 0.05)
            }).eq('id', videoId);

            // Trigger RPC directly for instant gratification
            await supabase.rpc('increment_view_count', { video_id: videoId, amount: 50 });

            alert('Boost applied! Bots will now drip-feed engagement.');
            fetchVideos();
        } catch (err) {
            console.error(err);
        } finally {
            setBoostingId(null);
        }
    };

    if (!profile?.is_admin) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
                <Shield size={64} className="text-red-500 mb-4 opacity-20" />
                <h1 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h1>
                <p className="text-gray-400 mt-2">This portal is restricted to VibeStream Administrators.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <header className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Shield className="text-[#FFB800]" /> Admin Terminal
                    </h1>
                    <p className="text-gray-400 font-medium">Growth Momentum Engine & Engagement Controls</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-[#FFB800]">
                    System Active
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                    <TrendingUp className="text-[#FFB800] mb-2" />
                    <div className="text-2xl font-black">2.4k</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Boosts</div>
                </div>
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                    <Users className="text-[#FFB800] mb-2" />
                    <div className="text-2xl font-black">50</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bot Agents</div>
                </div>
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                    <Zap className="text-[#FFB800] mb-2" />
                    <div className="text-2xl font-black">Live</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Engage Logic</div>
                </div>
            </div>

            <section>
                <h2 className="text-xl font-black uppercase tracking-tight mb-6">Recent Content Pulse</h2>
                <div className="space-y-4">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
                        </div>
                    ) : (
                        videos.map(video => (
                            <div key={video.id} className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <img src={video.thumbnail_url} className="w-20 aspect-video rounded-lg object-cover" alt="" />
                                    <div>
                                        <h3 className="font-bold text-sm line-clamp-1">{video.title}</h3>
                                        <p className="text-xs text-gray-500">by @{video.profiles?.username} • {video.view_count} views</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => triggerBoost(video.id, 500)}
                                        disabled={boostingId === video.id || video.boosted}
                                        className="px-4 py-2 bg-[#FFB800] hover:bg-[#FFB800]/90 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 disabled:opacity-30 border-none cursor-pointer"
                                    >
                                        {video.boosted ? 'Active Boost' : 'Instant Boost'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
