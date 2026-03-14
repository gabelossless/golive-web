'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { 
    LayoutDashboard, 
    Play, 
    Users, 
    Eye, 
    TrendingUp, 
    MoreVertical, 
    Edit, 
    Trash2, 
    Settings,
    Plus,
    Flame,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { formatViews } from '@/lib/utils';
import { format } from 'date-fns';

export default function DashboardClient() {
    const { user, profile } = useAuth();
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalViews: 0,
        subscribers: 0,
        videoCount: 0,
        totalHypes: 0
    });

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;

            // Fetch user's videos
            const { data: vids, error } = await supabase
                .from('videos')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (vids) {
                setVideos(vids);
                
                // Calculate basic stats
                const totalViews = vids.reduce((acc, v) => acc + (v.view_count || 0), 0);
                const totalHypes = vids.reduce((acc, v) => acc + (v.hype_count || 0), 0);
                
                setStats({
                    totalViews,
                    subscribers: (profile as any)?.subscriber_count || 0,
                    videoCount: vids.length,
                    totalHypes
                });
            }
            setLoading(false);
        }

        fetchDashboardData();
    }, [user, profile]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this video? This action is permanent.')) return;
        
        try {
            const { error } = await supabase.from('videos').delete().eq('id', id);
            if (error) throw error;
            setVideos(prev => prev.filter(v => v.id !== id));
            setStats(prev => ({ ...prev, videoCount: prev.videoCount - 1 }));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete video.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-8 p-6 md:p-8">
                <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-white/5 animate-pulse rounded-3xl" />
                    ))}
                </div>
                <div className="h-[400px] bg-white/5 animate-pulse rounded-3xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white m-0">Creator Studio</h1>
                    <p className="text-gray-500 font-medium m-0">Welcome back, {profile?.username || 'Creator'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/studio/ai-studio" 
                        className="px-6 py-3 bg-gradient-to-r from-[#FFB800] to-[#FF8A00] text-black font-black uppercase tracking-widest text-xs rounded-full flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-[#FFB800]/20">
                        <Sparkles size={16} /> AI Studio
                    </Link>
                    <Link href="/upload" 
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-full flex items-center gap-2 border border-white/10 transition-all">
                        <Plus size={16} /> Upload
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Eye} label="Total Views" value={formatViews(stats.totalViews)} trend="+12.5%" />
                <StatCard icon={Users} label="Subscribers" value={stats.subscribers} trend="+54" />
                <StatCard icon={Play} label="Videos" value={stats.videoCount} />
                <StatCard icon={Flame} label="Community Hype" value={stats.totalHypes} color="text-orange-500" />
            </div>

            {/* Video Management Section */}
            <div className="bg-[#111111] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-black uppercase tracking-tight m-0">Channel Content</h2>
                    <div className="flex items-center gap-4">
                        <input 
                            type="text" 
                            placeholder="Search videos..." 
                            className="bg-black/40 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-[#FFB800]/50 transition-colors w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/[0.02]">
                                <th className="px-8 py-4">Video</th>
                                <th className="px-6 py-4">Visibility</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Views</th>
                                <th className="px-6 py-4">Hype</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {videos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Play size={48} />
                                            <p className="font-bold">No videos uploaded yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : videos.map((video) => (
                                <tr key={video.id} className="group hover:bg-white/[0.01] transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 aspect-video rounded-xl bg-white/5 overflow-hidden shrink-0 relative">
                                                {video.thumbnail_url ? (
                                                    <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                        <Play size={20} className="text-white/20" />
                                                    </div>
                                                )}
                                                {video.is_short && (
                                                    <div className="absolute top-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">Short</div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-gray-200 group-hover:text-white truncate m-0">{video.title}</h4>
                                                <p className="text-[10px] text-gray-500 m-0 line-clamp-1">{video.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-green-500/10 text-green-500 border border-green-500/20">
                                            Public
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-400">
                                        {format(new Date(video.created_at), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-300">
                                        {video.view_count || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                                            <Flame size={12} />
                                            {video.hype_count || 0}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/watch/${video.id}`} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="View video" aria-label="View video">
                                                <Eye size={18} />
                                            </Link>
                                            <Link 
                                                href={`/studio/video/${video.id}`}
                                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                title="Edit video"
                                                aria-label="Edit video"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(video.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete video"
                                                aria-label="Delete video"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, trend, color = "text-[#FFB800]" }: any) {
    return (
        <div className="bg-[#111111] p-8 rounded-[32px] border border-white/5 shadow-xl hover:border-white/10 transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center ${color}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
                <div className="text-3xl font-black tracking-tighter text-white">{value}</div>
            </div>
        </div>
    );
}
