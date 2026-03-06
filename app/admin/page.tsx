'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Zap, Search, Activity, Loader2, Video, User } from 'lucide-react';

const ADMIN_EMAILS = ['gabelossless@gmail.com', 'roadadventure@gmail.com'];

export default function AdminPanel() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [isAdmin, setIsAdmin] = useState(false);

    // Video Boost State
    const [videoId, setVideoId] = useState('');
    const [addViews, setAddViews] = useState(1000);
    const [addLikes, setAddLikes] = useState(50);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoMsg, setVideoMsg] = useState('');

    // Channel Boost State
    const [profileId, setProfileId] = useState('');
    const [addSubs, setAddSubs] = useState(100);
    const [channelLoading, setChannelLoading] = useState(false);
    const [channelMsg, setChannelMsg] = useState('');

    useEffect(() => {
        if (!isLoading) {
            if (!user || !user.email) {
                // Not logged in or no email found
                router.push('/');
            } else if (!ADMIN_EMAILS.includes(user.email)) {
                // Non-admin user
                router.push('/');
            } else {
                setIsAdmin(true);
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !isAdmin) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 size={32} className="text-[#FFB800] animate-spin" />
            </div>
        );
    }

    const handleBoostVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoId) return;
        setVideoLoading(true);
        setVideoMsg('');

        try {
            const { error } = await supabase.rpc('admin_boost_video', {
                p_video_id: videoId.trim(),
                p_views: addViews,
                p_likes: addLikes
            });

            if (error) throw error;
            setVideoMsg(`Successfully boosted video ${videoId.slice(0, 6)}... with ${addViews} views and ${addLikes} likes.`);
            setVideoId('');
        } catch (err: any) {
            setVideoMsg(`Error: ${err.message || 'Server error'}. Ensure the DB patch is applied.`);
        } finally {
            setVideoLoading(false);
        }
    };

    const handleBoostChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileId) return;
        setChannelLoading(true);
        setChannelMsg('');

        try {
            const { error } = await supabase.rpc('admin_boost_channel', {
                p_profile_id: profileId.trim(),
                p_subs: addSubs
            });

            if (error) throw error;
            setChannelMsg(`Successfully boosted channel ${profileId.slice(0, 6)}... with ${addSubs} subscribers.`);
            setProfileId('');
        } catch (err: any) {
            setChannelMsg(`Error: ${err.message || 'Server error'}. Ensure the DB patch is applied.`);
        } finally {
            setChannelLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 relative min-h-screen">
            <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
                <ShieldAlert className="text-[#FFB800]" size={32} />
                System Admin Panel
            </h1>

            <div className="mb-8 p-4 rounded-xl border border-[#FFB800]/20 bg-[#FFB800]/5 text-[#FFB800] text-sm">
                <strong>Attention Admin:</strong> This is a hidden system tool. Any changes to engagement metrics are made publicly visible in real-time. Make sure you apply the `admin_patch.sql` to your Supabase SQL Editor first.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* VIDEO BOOSTING */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-white/5 bg-[#222]">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Video size={20} className="text-[#FFB800]" /> Video Growth Stimulus
                        </h2>
                    </div>

                    <form onSubmit={handleBoostVideo} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Target Video ID (UUID)</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    required
                                    value={videoId}
                                    onChange={e => setVideoId(e.target.value)}
                                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Views to Inject</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    value={addViews}
                                    onChange={e => setAddViews(Number(e.target.value))}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Likes to Inject</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    value={addLikes}
                                    onChange={e => setAddLikes(Number(e.target.value))}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                                />
                            </div>
                        </div>

                        {videoMsg && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${videoMsg.startsWith('Err') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                {videoMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={videoLoading || !videoId}
                            className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {videoLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                            {videoLoading ? 'Injecting...' : 'Boost Video Data'}
                        </button>
                    </form>
                </div>

                {/* CHANNEL BOOSTING */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-white/5 bg-[#222]">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <User size={20} className="text-[#FFB800]" /> Channel Growth Stimulus
                        </h2>
                    </div>

                    <form onSubmit={handleBoostChannel} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Profile ID (UUID)</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    required
                                    value={profileId}
                                    onChange={e => setProfileId(e.target.value)}
                                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Subscribers to Inject</label>
                            <div className="relative">
                                <Activity size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    value={addSubs}
                                    onChange={e => setAddSubs(Number(e.target.value))}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                                />
                            </div>
                        </div>

                        {channelMsg && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${channelMsg.startsWith('Err') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                {channelMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={channelLoading || !profileId}
                            className="w-full py-3 rounded-xl mt-4 font-bold text-sm bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {channelLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                            {channelLoading ? 'Injecting...' : 'Boost Channel Data'}
                        </button>
                    </form>
                </div>
            </div>

        </div>
    );
}
