'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, Users, Clock, Video, TrendingUp, Loader2 } from 'lucide-react';

export default function AnalyticsDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        tipRevenue: 0,
        ppvRevenue: 0,
        totalViews: 0,
        totalStreams: 0,
        peakViewers: 0
    });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [recentStreams, setRecentStreams] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        fetchAnalytics();
    }, [user]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // 1. Fetch Revenue Data (Tips & PPV)
            const { data: transactions } = await supabase
                .from('transactions')
                .select('amount, type, created_at')
                .eq('creator_id', user!.id)
                .eq('status', 'completed');

            // 2. Fetch Streams Data
            const { data: streams } = await supabase
                .from('videos')
                .select('id, title, view_count, viewer_count, started_at, is_live')
                .eq('user_id', user!.id)
                .order('started_at', { ascending: false });

            // Calculate Totals
            let totalRev = 0, tipRev = 0, ppvRev = 0;
            let revenueByDay: Record<string, number> = {};

            transactions?.forEach(tx => {
                const amt = Number(tx.amount);
                totalRev += amt;
                if (tx.type === 'tip') tipRev += amt;
                if (tx.type === 'ppv') ppvRev += amt;

                // Group by Day for chart
                const day = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                revenueByDay[day] = (revenueByDay[day] || 0) + amt;
            });

            // Format Chart Data
            const chartData = Object.keys(revenueByDay).map(date => ({
                date,
                revenue: revenueByDay[date]
            })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Calculate Stream Stats
            let totalVws = 0, peakVws = 0;
            streams?.forEach(stream => {
                totalVws += (stream.view_count || 0);
                if (stream.viewer_count > peakVws) peakVws = stream.viewer_count;
            });

            setStats({
                totalRevenue: totalRev,
                tipRevenue: tipRev,
                ppvRevenue: ppvRev,
                totalViews: totalVws,
                totalStreams: streams?.length || 0,
                peakViewers: peakVws
            });

            setRevenueData(chartData.length > 0 ? chartData : [{ date: 'Today', revenue: 0 }]);
            setRecentStreams(streams?.slice(0, 5) || []);

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center pt-24">
                <Loader2 className="animate-spin text-[#FFB800]" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <TrendingUp className="text-[#FFB800]" size={32} /> 
                            Creator Analytics
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">Track your livestream performance and revenue.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Revenue</p>
                        <p className="text-4xl font-black text-[#FFB800]">${stats.totalRevenue.toFixed(2)}</p>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#111] border border-white/5 p-6 rounded-3xl">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Peak Viewers</p>
                            <Users size={16} className="text-blue-500" />
                        </div>
                        <p className="text-3xl font-black">{stats.peakViewers}</p>
                    </div>

                    <div className="bg-[#111] border border-white/5 p-6 rounded-3xl">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Streams</p>
                            <Video size={16} className="text-purple-500" />
                        </div>
                        <p className="text-3xl font-black">{stats.totalStreams}</p>
                    </div>

                    <div className="bg-[#111] border border-white/5 p-6 rounded-3xl">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50">Tip Income</p>
                            <DollarSign size={16} className="text-emerald-500" />
                        </div>
                        <p className="text-3xl font-black text-emerald-400">${stats.tipRevenue.toFixed(2)}</p>
                    </div>

                    <div className="bg-[#111] border border-white/5 p-6 rounded-3xl">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB800]/50">PPV Sales</p>
                            <DollarSign size={16} className="text-[#FFB800]" />
                        </div>
                        <p className="text-3xl font-black text-[#FFB800]">${stats.ppvRevenue.toFixed(2)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-3xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Revenue Over Time</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="date" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis 
                                        stroke="#ffffff50" 
                                        tick={{ fill: '#ffffff50', fontSize: 12 }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                        itemStyle={{ color: '#FFB800' }}
                                        formatter={(value: any) => {
                                            if (typeof value === 'number') return [`$${value.toFixed(2)}`, 'Revenue'];
                                            return [value, 'Revenue'];
                                        }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#FFB800" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Broadcasts */}
                    <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Recent Broadcasts</h3>
                        <div className="flex-1 space-y-4">
                            {recentStreams.length > 0 ? recentStreams.map((stream) => (
                                <div key={stream.id} className="p-4 bg-black rounded-2xl border border-white/5 flex items-center justify-between group hover:border-[#FFB800]/30 transition-colors">
                                    <div>
                                        <p className="font-bold text-sm line-clamp-1">{stream.title}</p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {new Date(stream.started_at).toLocaleDateString()} • {stream.is_live ? <span className="text-red-500 font-bold uppercase text-[10px]">Live Now</span> : 'Ended'}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <p className="text-xs font-bold bg-white/5 px-2 py-1 rounded text-zinc-300 group-hover:bg-[#FFB800]/10 group-hover:text-[#FFB800] transition-colors">
                                            {stream.viewer_count || stream.view_count || 0} vws
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                                    No broadcasts yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
