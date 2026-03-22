'use client';

import React, { useEffect, useState } from 'react';
import {
    Eye,
    ArrowUpRight,
    ArrowDownRight,
    Globe,
    Smartphone,
    Monitor,
    RefreshCcw,
    BarChart3,
    Clock,
    Heart,
} from 'lucide-react';
import {
    fillDailyViews,
    computeDevicePercentages,
    computeEngagementRate,
    formatWatchTime,
    formatCount,
    type PlatformStats,
} from '@/lib/stats-engine';

export default function AdminAnalytics() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/stats');
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            setStats(data);
            setLastRefreshed(new Date());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const dailyViews = stats?.views_last_30_days ? fillDailyViews(stats.views_last_30_days) : [];
    const maxViews = Math.max(...dailyViews.map(d => d.views), 1);
    const devicePcts = stats?.device_distribution ? computeDevicePercentages(stats.device_distribution) : [];
    const engagementRate = stats ? computeEngagementRate(stats.total_likes, stats.total_views) : '—';
    const avgWatch = stats ? formatWatchTime(stats.avg_watch_seconds) : '—';

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase">Platform Intelligence</h2>
                    <p className="text-sm text-gray-500">
                        Live analytics from real data.
                        {lastRefreshed && (
                            <span className="ml-2 text-gray-600">Last updated: {lastRefreshed.toLocaleTimeString()}</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-bold transition-all disabled:opacity-50"
                >
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                    ⚠️ Stats API error: {error}. Make sure the Supabase migration has been applied.
                </div>
            )}

            {/* Quick Metric Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickMetric icon={Eye} label="Total Views" value={stats ? formatCount(stats.total_views) : '—'} loading={loading} />
                <QuickMetric icon={Heart} label="Engagement Rate" value={engagementRate} loading={loading} />
                <QuickMetric icon={Clock} label="Avg Watch Time" value={avgWatch} loading={loading} />
                <QuickMetric icon={Eye} label="DAU" value={stats ? formatCount(stats.dau) : '—'} loading={loading} />
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Views Chart */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="font-bold flex items-center gap-2">
                                <BarChart3 size={18} className="text-[#FFB800]" />
                                Views — Last 30 Days
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats ? `${formatCount(stats.views_today)} views today` : 'Loading...'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Total</p>
                            <p className="text-lg font-black text-[#FFB800]">
                                {stats ? formatCount(stats.total_views) : '—'}
                            </p>
                        </div>
                    </div>

                    {/* Real chart from data */}
                    <div className="h-48 flex items-end gap-1">
                        {loading ? (
                            Array(30).fill(0).map((_, i) => (
                                <div key={i} className="flex-1 bg-white/5 rounded-t-sm animate-pulse" style={{ height: `${20 + Math.random() * 60}%` }} />
                            ))
                        ) : dailyViews.map((point, i) => {
                            const height = maxViews > 0 ? (point.views / maxViews) * 100 : 0;
                            const isToday = i === dailyViews.length - 1;
                            return (
                                <div
                                    key={point.date}
                                    className={`flex-1 rounded-t-sm transition-all hover:scale-y-110 cursor-pointer group relative ${isToday ? 'bg-[#FFB800]' : 'bg-gradient-to-t from-[#FFB800]/60 to-orange-500/40'}`}
                                    style={{ height: `${Math.max(height, 2)}%` }}
                                    title={`${point.date}: ${formatCount(point.views)} views`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        <span>30 days ago</span>
                        <span>Today</span>
                    </div>
                </div>

                {/* Device Distribution */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 space-y-8">
                    <h3 className="font-bold">Device Distribution</h3>

                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-white/5 rounded-full animate-pulse" />)}
                        </div>
                    ) : devicePcts.length > 0 ? (
                        <div className="space-y-6">
                            {devicePcts.map(d => (
                                <DeviceStat
                                    key={d.label}
                                    icon={d.label === 'Mobile' ? Smartphone : d.label === 'Desktop' ? Monitor : Globe}
                                    label={d.label}
                                    percentage={d.percentage}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* No event data yet — show placeholder with explanation */}
                            <p className="text-xs text-gray-500 italic">No device data yet. Events are tracked as users watch videos.</p>
                            <DeviceStat icon={Smartphone} label="Mobile" percentage={0} />
                            <DeviceStat icon={Monitor} label="Desktop" percentage={0} />
                            <DeviceStat icon={Globe} label="Other" percentage={0} />
                        </div>
                    )}

                    {/* Top Video */}
                    {stats?.top_video && (
                        <div className="pt-8 border-t border-white/5">
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#FFB800] mb-3">🏆 Top Video</h4>
                            <p className="text-sm font-bold line-clamp-2">{stats.top_video.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatCount(stats.top_video.view_count)} views</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SmallMetricCard
                    label="New Users Today"
                    value={stats ? formatCount(stats.new_users_today) : '—'}
                    trend={stats?.new_users_today ? `+${stats.new_users_today}` : '0'}
                    up={(stats?.new_users_today ?? 0) > 0}
                    loading={loading}
                />
                <SmallMetricCard
                    label="Total Comments"
                    value={stats ? formatCount(stats.total_comments) : '—'}
                    trend="+live"
                    up={true}
                    loading={loading}
                />
                <SmallMetricCard
                    label="Likes Today"
                    value={stats ? formatCount(stats.likes_today) : '—'}
                    trend={stats?.likes_today ? `+${stats.likes_today}` : '0'}
                    up={(stats?.likes_today ?? 0) > 0}
                    loading={loading}
                />
                <SmallMetricCard
                    label="New Uploads Today"
                    value={stats ? formatCount(stats.new_videos_today) : '—'}
                    trend={stats?.new_videos_today ? `+${stats.new_videos_today}` : '0'}
                    up={(stats?.new_videos_today ?? 0) > 0}
                    loading={loading}
                />
            </div>

            {/* Geo / Top Countries */}
            {stats?.top_countries && stats.top_countries.length > 0 && (
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8">
                    <h3 className="font-bold mb-6 flex items-center gap-2">
                        <Globe size={18} className="text-[#FFB800]" />
                        Geographic Distribution (Top Countries)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {stats.top_countries.map((c) => (
                            <div key={c.country_code} className="text-center p-4 bg-white/5 rounded-2xl">
                                <p className="text-2xl mb-1">{countryFlag(c.country_code)}</p>
                                <p className="text-xs font-black text-gray-400 uppercase">{c.country_code}</p>
                                <p className="text-sm font-bold mt-1">{formatCount(c.views)}</p>
                                <p className="text-[10px] text-gray-600">views</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function countryFlag(code: string): string {
    try {
        return code.toUpperCase().replace(/./g, char =>
            String.fromCodePoint(127397 + char.charCodeAt(0))
        );
    } catch { return '🌍'; }
}

function QuickMetric({ icon: Icon, label, value, loading }: { icon: any; label: string; value: string; loading: boolean }) {
    return (
        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-3xl">
            <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-[#FFB800]" />
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
            </div>
            {loading ? (
                <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
            ) : (
                <p className="text-2xl font-black">{value}</p>
            )}
        </div>
    );
}

function DeviceStat({ icon: Icon, label, percentage }: { icon: any; label: string; percentage: number }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2 text-gray-400">
                    <Icon size={14} />
                    {label}
                </span>
                <span>{percentage}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function SmallMetricCard({ label, value, trend, up, loading }: { label: string; value: string; trend: string; up: boolean; loading: boolean }) {
    return (
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl flex justify-between items-center">
            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                {loading ? (
                    <div className="h-7 w-16 bg-white/5 rounded animate-pulse" />
                ) : (
                    <h3 className="text-xl font-black">{value}</h3>
                )}
            </div>
            <div className={`text-[10px] font-black flex items-center gap-1 ${up ? 'text-green-500' : 'text-red-500'}`}>
                {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {trend}
            </div>
        </div>
    );
}
