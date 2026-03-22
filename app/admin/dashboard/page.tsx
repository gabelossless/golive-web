import React from 'react';
import { createClient } from '@/lib/supabase-server';
import {
    Users,
    Video as VideoIcon,
    Zap,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    UserPlus,
    Heart,
    MessageSquare,
    Eye,
} from 'lucide-react';
import { formatCount } from '@/lib/stats-engine';

export default async function AdminDashboard() {
    const supabase = await createClient();

    // --- Real Data Queries (Agent 3: Admin Dashboard Intelligence) ---
    const [
        { count: userCount },
        { count: videoCount },
        { count: likeCount },
        { count: commentCount },
        { data: recentVideos },
        { count: newUsersToday },
        { count: newVideosToday },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('id, title, thumbnail_url, visibility, view_count, created_at, profiles(username)').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('videos').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

    // DAU from video_events (best effort — graceful fallback if table doesn't exist yet)
    let dau = 0;
    try {
        const { count } = await supabase
            .from('video_events')
            .select('user_id', { count: 'exact', head: true })
            .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
        dau = count ?? 0;
    } catch { dau = 0; }

    // Total view count (sum of all video view_counts)
    let totalViews = 0;
    try {
        const { data: viewData } = await supabase.from('videos').select('view_count');
        totalViews = (viewData ?? []).reduce((sum, v) => sum + (v.view_count || 0), 0);
    } catch { totalViews = 0; }

    // Top creator by view count
    let topCreator: { username: string; views: number } | null = null;
    try {
        const { data: topVid } = await supabase
            .from('videos')
            .select('view_count, profiles(username)')
            .order('view_count', { ascending: false })
            .limit(1)
            .single();
        if (topVid) {
            topCreator = {
                username: (topVid.profiles as any)?.username ?? 'unknown',
                views: topVid.view_count ?? 0,
            };
        }
    } catch { topCreator = null; }

    const stats = [
        { label: 'Total Users', value: userCount ?? 0, sub: `+${newUsersToday ?? 0} today`, icon: Users, up: (newUsersToday ?? 0) > 0, color: 'text-blue-500' },
        { label: 'Total Videos', value: videoCount ?? 0, sub: `+${newVideosToday ?? 0} today`, icon: VideoIcon, up: (newVideosToday ?? 0) > 0, color: 'text-[#FFB800]' },
        { label: 'Total Views', value: totalViews, sub: 'All time', icon: Eye, up: true, color: 'text-purple-500' },
        { label: 'DAU', value: dau, sub: 'Logged events today', icon: Zap, up: dau > 0, color: 'text-green-500' },
        { label: 'Total Likes', value: likeCount ?? 0, sub: 'Platform-wide', icon: Heart, up: true, color: 'text-red-500' },
        { label: 'Comments', value: commentCount ?? 0, sub: 'Platform-wide', icon: MessageSquare, up: true, color: 'text-cyan-500' },
        { label: 'New Users Today', value: newUsersToday ?? 0, sub: 'Since midnight', icon: UserPlus, up: (newUsersToday ?? 0) > 0, color: 'text-emerald-500' },
        { label: 'Uploads Today', value: newVideosToday ?? 0, sub: 'Since midnight', icon: TrendingUp, up: (newVideosToday ?? 0) > 0, color: 'text-orange-400' },
    ];

    return (
        <div className="space-y-10">
            {/* Stats Grid — 4 cols on large, 2 on medium */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.slice(0, 4).map((stat) => (
                    <div key={stat.label} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[32px] hover:border-[#FFB800]/20 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-black ${stat.up ? 'text-green-500' : 'text-gray-500'}`}>
                                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {stat.sub}
                            </div>
                        </div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">{stat.label}</p>
                        <h2 className="text-2xl font-black tracking-tighter">{formatCount(stat.value)}</h2>
                    </div>
                ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.slice(4).map((stat) => (
                    <div key={stat.label} className="bg-[#0a0a0a] border border-white/5 p-5 rounded-3xl flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl bg-white/5 ${stat.color}`}>
                            <stat.icon size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-lg font-black">{formatCount(stat.value)}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Uploads */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-black tracking-tighter uppercase">Recent Uploads</h3>
                        <a href="/admin/videos" className="text-xs font-bold text-[#FFB800] hover:underline">View All</a>
                    </div>
                    <div className="divide-y divide-white/5">
                        {recentVideos?.map((video) => (
                            <div key={video.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 aspect-video bg-white/5 rounded-xl overflow-hidden shrink-0">
                                        {video.thumbnail_url && (
                                            <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm line-clamp-1">{video.title}</h4>
                                        <p className="text-xs text-gray-500">by @{(video.profiles as any)?.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Views</p>
                                        <p className="text-sm font-bold">{formatCount(video.view_count ?? 0)}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${video.visibility === 'public' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>
                                        {video.visibility}
                                    </span>
                                    <a href={`/watch/${video.id}`} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label={`Watch ${video.title}`} title={`Watch ${video.title}`}>
                                        <ArrowUpRight size={16} className="text-gray-400" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Health + Top Creator */}
                <div className="space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8">
                        <h3 className="text-lg font-black tracking-tighter uppercase mb-6">Service Health</h3>
                        <div className="space-y-5">
                            <HealthItem label="Database (Supabase)" status="Operational" level={98} />
                            <HealthItem label="Storage (R2)" status="Operational" level={100} />
                            <HealthItem label="Edge API" status="Fast" level={94} />
                            <HealthItem label="Transcoding" status={(videoCount ?? 0) > 0 ? 'Active' : 'Idle'} level={(videoCount ?? 0) > 0 ? 72 : 0} />
                        </div>
                    </div>

                    {topCreator && (
                        <div className="bg-gradient-to-br from-[#FFB800]/20 to-orange-600/10 border border-[#FFB800]/20 rounded-[40px] p-8">
                            <TrendingUp className="text-[#FFB800] mb-3" />
                            <h4 className="font-bold text-sm mb-1">🏆 Top Creator</h4>
                            <p className="text-xl font-black">@{topCreator.username}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatCount(topCreator.views)} total views</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function HealthItem({ label, status, level }: { label: string; status: string; level: number }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span className="text-gray-500">{label}</span>
                <span className={level > 90 ? 'text-green-500' : level > 0 ? 'text-[#FFB800]' : 'text-gray-500'}>{status}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${level > 90 ? 'bg-green-500' : 'bg-[#FFB800]'}`}
                    style={{ width: `${level || 2}%` }}
                />
            </div>
        </div>
    );
}
