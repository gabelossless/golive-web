'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { LayoutDashboard, Video as VideoIcon, BarChart3, Radio, Settings, Clock, Users, DollarSign, Eye, Upload } from 'lucide-react';
import { calculateAlgorithmicViews } from '@/lib/utils';
import Link from 'next/link';

export default function StudioPage() {
    const { user, profile } = useAuth();
    const [videos, setVideos] = useState<any[]>([]);
    const [totalViews, setTotalViews] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchStats = async () => {
            const { data } = await supabase
                .from('videos')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                const processed = data.map(v => ({
                    ...v,
                    algorithmic_views: calculateAlgorithmicViews(v.id, v.created_at, v.view_count)
                }));
                setVideos(processed);
                const views = processed.reduce((acc, v) => acc + v.algorithmic_views, 0);
                setTotalViews(views);
            }
            setLoading(false);
        };
        fetchStats();
    }, [user]);

    if (!user) return <div className="p-8 text-center text-muted">Please log in to view your dashboard.</div>;

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', active: true },
        { icon: VideoIcon, label: 'Content' },
        { icon: BarChart3, label: 'Analytics' },
        { icon: Radio, label: 'Live' },
        { icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="flex h-[calc(100vh-var(--spacing-header))] -m-4 md:-m-6">
            {/* Sidebar (Studio Style) */}
            <div className="w-64 border-r border-border bg-background hidden lg:flex flex-col py-4">
                <div className="px-6 py-4 mb-2 flex flex-col items-center border-b border-border/50 text-center">
                    <img
                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}&backgroundColor=9147ff`}
                        alt="Channel Avatar"
                        className="w-24 h-24 rounded-full mb-3 border border-border"
                    />
                    <p className="font-semibold text-foreground text-sm">Your channel</p>
                    <p className="text-muted text-xs truncate w-full">{profile?.username || user.email}</p>
                </div>

                <div className="px-3 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            className={`flex items-center gap-4 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active ? 'bg-surface text-primary' : 'text-foreground hover:bg-surface-hover'
                                }`}
                        >
                            <item.icon size={20} strokeWidth={item.active ? 2.5 : 2} className={item.active ? 'text-primary' : 'text-muted'} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-background">
                <header>
                    <h1 className="text-2xl font-bold text-foreground">Channel dashboard</h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Latest Video Performance */}
                    <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-1 border-t-4 border-t-primary">
                        <h2 className="font-semibold mb-4">Latest video performance</h2>
                        {videos.length > 0 ? (
                            <div>
                                <img src={videos[0].thumbnail_url} alt="Latest" className="w-full aspect-video object-cover rounded-lg mb-4 bg-background" />
                                <h3 className="font-medium text-sm line-clamp-2 mb-4">{videos[0].title}</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted">Views</span>
                                        <span className="font-medium">{videos[0].algorithmic_views}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted">Likes</span>
                                        <span className="font-medium">{Math.floor(videos[0].algorithmic_views * 0.12)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted">Comments</span>
                                        <span className="font-medium">{Math.floor(videos[0].algorithmic_views * 0.03)}</span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-border">
                                    <Link href="/studio/content" className="text-primary text-sm font-medium uppercase tracking-wide hover:opacity-80">Go to video analytics</Link>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted">
                                <Upload size={32} className="mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No videos uploaded yet</p>
                                <Link href="/upload" className="btn btn-primary btn-sm mt-4">Upload Video</Link>
                            </div>
                        )}
                    </div>

                    {/* Channel Analytics */}
                    <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-1">
                        <h2 className="font-semibold mb-4">Channel analytics</h2>
                        <p className="text-sm text-foreground mb-6">Current subscribers</p>
                        <p className="text-4xl font-bold mb-6">0</p>
                        <div className="h-px bg-border mb-4" />
                        <h3 className="text-sm font-medium mb-3">Summary <span className="text-muted font-normal text-xs ml-1">Last 28 days</span></h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Views</span>
                                <span className="font-medium">{totalViews}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Watch time (hours)</span>
                                <span className="font-medium">0.0</span>
                            </div>
                        </div>
                        <div className="h-px bg-border mb-4" />
                        <h3 className="text-sm font-medium mb-3">Top videos</h3>
                        <div className="space-y-3">
                            {videos.slice(0, 3).map((v) => (
                                <div key={v.id} className="flex justify-between text-sm">
                                    <span className="text-foreground truncate pr-4">{v.title}</span>
                                    <span className="text-muted whitespace-nowrap">{v.algorithmic_views} views</span>
                                </div>
                            ))}
                            {videos.length === 0 && <span className="text-sm text-muted">No data available</span>}
                        </div>
                        <div className="mt-6 pt-4 border-t border-border">
                            <Link href="/studio/analytics" className="text-primary text-sm font-medium uppercase tracking-wide hover:opacity-80">Go to channel analytics</Link>
                        </div>
                    </div>

                    {/* Creator Insider / Updates */}
                    <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-1">
                        <h2 className="font-semibold mb-4">GoLive Insider</h2>
                        <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=640&q=80" alt="News" className="w-full aspect-video object-cover rounded-lg mb-4" />
                        <h3 className="font-medium text-sm mb-2">New: Premium Cinematic Layouts</h3>
                        <p className="text-sm text-muted mb-4 line-clamp-3">We just redesigned the platform with a sleek, YouTube-meets-Twitch aesthetic. Try uploading a video to see the new card styles!</p>
                        <button className="text-primary text-sm font-medium uppercase tracking-wide">Read more</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
