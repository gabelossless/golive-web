'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import {
    BarChart2, Eye, Users, Film, Trash2, Edit3, Sparkles,
    Globe, Lock, EyeOff, UploadCloud, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

function formatViews(n?: number) {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

interface VideoRow {
    id: string;
    title: string;
    thumbnail_url: string | null;
    view_count: number;
    created_at: string;
    visibility: string;
    description: string;
}

export default function CreatorDashboard() {
    const { user, profile, isLoading } = useAuth();
    const router = useRouter();
    const [videos, setVideos] = useState<VideoRow[]>([]);
    const [stats, setStats] = useState({ views: 0, subs: 0, videos: 0 });
    const [fetching, setFetching] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editVisibility, setEditVisibility] = useState('Public');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (!isLoading && !user) router.replace('/login');
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user) return;
        async function load() {
            setFetching(true);
            const { data: vids } = await supabase
                .from('videos')
                .select('id, title, thumbnail_url, view_count, created_at, description')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });

            const { count: subCount } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('channel_id', user!.id);

            if (vids) {
                const rows: VideoRow[] = vids.map((v: any) => {
                    let visibility = 'Public';
                    if ((v.description || '').includes('[PRIVATE_VIDEO_FLAG]')) visibility = 'Private';
                    else if ((v.description || '').includes('[UNLISTED_FLAG]')) visibility = 'Unlisted';
                    return { ...v, visibility };
                });
                setVideos(rows);
                const totalViews = rows.reduce((sum, v) => sum + (v.view_count || 0), 0);
                setStats({ views: totalViews, subs: subCount || 0, videos: rows.length });
            }
            setFetching(false);
        }
        load();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this video? This cannot be undone.')) return;
        setDeleting(id);
        const { error } = await supabase.from('videos').delete().eq('id', id);
        if (error) {
            setFeedback({ type: 'error', message: 'Failed to delete: ' + error.message });
        } else {
            setVideos(prev => prev.filter(v => v.id !== id));
            setStats(prev => ({ ...prev, videos: prev.videos - 1 }));
            setFeedback({ type: 'success', message: 'Video deleted.' });
        }
        setDeleting(null);
        setTimeout(() => setFeedback(null), 3000);
    };

    const startEdit = (video: VideoRow) => {
        setEditingId(video.id);
        setEditTitle(video.title);
        setEditVisibility(video.visibility);
    };

    const handleSave = async () => {
        if (!editingId) return;
        setSaving(true);
        const video = videos.find(v => v.id === editingId);
        let desc = (video?.description || '').replace('[PRIVATE_VIDEO_FLAG]', '').replace('[UNLISTED_FLAG]', '').trim();
        if (editVisibility === 'Private') desc += '\n\n[PRIVATE_VIDEO_FLAG]';
        else if (editVisibility === 'Unlisted') desc += '\n\n[UNLISTED_FLAG]';

        const { error } = await supabase.from('videos').update({ title: editTitle, description: desc }).eq('id', editingId);
        if (error) {
            setFeedback({ type: 'error', message: 'Failed to save: ' + error.message });
        } else {
            setVideos(prev => prev.map(v => v.id === editingId ? { ...v, title: editTitle, visibility: editVisibility, description: desc } : v));
            setFeedback({ type: 'success', message: 'Video updated!' });
            setEditingId(null);
        }
        setSaving(false);
        setTimeout(() => setFeedback(null), 3000);
    };

    const visibilityIcon = (v: string) => {
        if (v === 'Private') return <Lock size={12} className="text-gray-500" />;
        if (v === 'Unlisted') return <EyeOff size={12} className="text-gray-400" />;
        return <Globe size={12} className="text-green-400" />;
    };

    if (isLoading || fetching) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Feedback Toast */}
            {feedback && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={cn("fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border font-bold text-sm",
                        feedback.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400')}>
                    {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {feedback.message}
                </motion.div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Creator Studio</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage your content and grow your channel.</p>
                </div>
                <Link href="/upload"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FFB800] text-black font-bold rounded-full hover:bg-[#FFB800]/90 transition-colors text-sm">
                    <UploadCloud size={16} /> Upload Video
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Views', value: formatViews(stats.views), icon: Eye, color: 'text-blue-400' },
                    { label: 'Subscribers', value: formatViews(stats.subs), icon: Users, color: 'text-purple-400' },
                    { label: 'Videos', value: stats.videos, icon: Film, color: 'text-[#FFB800]' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center", stat.color)}>
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p className="text-2xl font-black">{stat.value}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Studio CTA */}
            <Link href="/studio/ai-studio"
                className="group flex items-center justify-between p-5 bg-gradient-to-r from-[#FFB800]/10 to-purple-500/10 border border-[#FFB800]/20 rounded-2xl hover:border-[#FFB800]/50 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFB800]/20 flex items-center justify-center text-[#FFB800]">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-sm">AI Studio — Viral Clip Generator</p>
                        <p className="text-xs text-gray-400 mt-0.5">Let AI find your best moments and clip them into Shorts automatically.</p>
                    </div>
                </div>
                <ChevronRight size={20} className="text-gray-500 group-hover:text-[#FFB800] transition-colors" />
            </Link>

            {/* Video Table */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                    <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Your Videos</h2>
                </div>
                {videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-2xl">🎬</div>
                        <h3 className="font-bold text-lg">No videos yet</h3>
                        <p className="text-sm text-gray-400">Upload your first video to get started.</p>
                        <Link href="/upload" className="px-5 py-2.5 bg-[#FFB800] text-black font-bold rounded-full text-sm hover:bg-[#FFB800]/90 transition-colors">
                            Upload Now
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {videos.map((video) => (
                            <div key={video.id} className="px-5 py-4">
                                {editingId === video.id ? (
                                    <div className="flex flex-col gap-3">
                                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFB800]"
                                            placeholder="Video title" title="Edit video title" />
                                        <div className="flex items-center gap-3">
                                            <select value={editVisibility} onChange={e => setEditVisibility(e.target.value)}
                                                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFB800]"
                                                aria-label="Visibility">
                                                <option>Public</option>
                                                <option>Unlisted</option>
                                                <option>Private</option>
                                            </select>
                                            <button onClick={handleSave} disabled={saving}
                                                className="px-4 py-2 bg-[#FFB800] text-black text-sm font-bold rounded-lg disabled:opacity-50">
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button onClick={() => setEditingId(null)}
                                                className="px-4 py-2 bg-white/5 text-white text-sm font-bold rounded-lg hover:bg-white/10">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <Link href={`/watch/${video.id}`} className="flex-shrink-0">
                                            <div className="w-24 aspect-video rounded-lg overflow-hidden bg-white/5">
                                                {video.thumbnail_url
                                                    ? <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center text-gray-600 text-xl">🎬</div>
                                                }
                                            </div>
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/watch/${video.id}`} className="hover:text-[#FFB800] transition-colors">
                                                <h3 className="font-bold text-sm line-clamp-1">{video.title || 'Untitled'}</h3>
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1">
                                                {visibilityIcon(video.visibility)}
                                                <span className="text-xs text-gray-500 capitalize">{video.visibility}</span>
                                                <span className="text-gray-700">•</span>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Eye size={11} /> {formatViews(video.view_count)} views
                                                </div>
                                                <span className="text-gray-700">•</span>
                                                <span className="text-xs text-gray-500">{new Date(video.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => startEdit(video)}
                                                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                                                title="Edit video" aria-label="Edit video">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(video.id)}
                                                disabled={deleting === video.id}
                                                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-gray-400 hover:text-red-400 disabled:opacity-50"
                                                title="Delete video" aria-label="Delete video">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
