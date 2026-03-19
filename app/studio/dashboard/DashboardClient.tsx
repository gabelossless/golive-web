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
    Sparkles,
    Wallet,
    DollarSign,
    ArrowUpRight,
    Search,
    History,
    Calendar,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatViews, cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer
} from 'recharts';

// --- Types ---
type Tab = 'content' | 'revenue';

export default function DashboardClient() {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('content');
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [revenueData, setRevenueData] = useState<any>(null);
    const [stats, setStats] = useState({
        totalViews: 0,
        subscribers: 0,
        videoCount: 0,
        totalHypes: 0
    });

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;
            setLoading(true);

            // Fetch user's videos
            const { data: vids, error } = await supabase
                .from('videos')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (vids) {
                setVideos(vids);
                const totalViews = vids.reduce((acc, v) => acc + (v.view_count || 0), 0);
                const totalHypes = vids.reduce((acc, v) => acc + (v.hype_count || 0), 0);
                setStats({
                    totalViews,
                    subscribers: (profile as any)?.subscriber_count || 0,
                    videoCount: vids.length,
                    totalHypes
                });
            }

            // Fetch Revenue Data
            try {
                const res = await fetch('/api/studio/revenue');
                const data = await res.json();
                if (!data.error) setRevenueData(data);
            } catch (err) {
                console.error('Failed to fetch revenue:', err);
            }

            setLoading(false);
        }
        fetchDashboardData();
    }, [user, profile]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this video?')) return;
        try {
            const { error } = await supabase.from('videos').delete().eq('id', id);
            if (error) throw error;
            setVideos(prev => prev.filter(v => v.id !== id));
            setStats(prev => ({ ...prev, videoCount: prev.videoCount - 1 }));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleQuickUpdate = async (id: string) => {
        try {
            const { error } = await supabase.from('videos').update({ title: editTitle }).eq('id', id);
            if (error) throw error;
            setVideos(prev => prev.map(v => v.id === id ? { ...v, title: editTitle } : v));
            setEditingId(null);
        } catch (err) {
            console.error('Update failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-8 p-6 md:p-10">
                <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-3xl" />)}
                </div>
                <div className="h-[400px] bg-white/5 animate-pulse rounded-[32px]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white m-0 italic">
                        Creator Studio
                    </h1>
                    <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-xs">
                        <Users size={14} className="text-[#FFB800]" />
                        {profile?.username || 'Creator'} Dashboard
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/studio/ai-studio" 
                        className="px-8 py-4 bg-gradient-to-r from-[#FFB800] to-[#FF8A00] text-black font-black uppercase tracking-widest text-xs rounded-full flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[#FFB800]/20">
                        <Sparkles size={16} /> AI Studio
                    </Link>
                    <Link href="/upload" 
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-full flex items-center gap-2 border border-white/10 transition-all">
                        <Plus size={16} /> New Content
                    </Link>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-full self-start border border-white/5">
                {[
                    { id: 'content', label: 'Channel Content', icon: LayoutDashboard },
                    { id: 'revenue', label: 'Analytics & Revenue', icon: Wallet },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                                isActive 
                                    ? "bg-white text-black shadow-lg" 
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'content' ? (
                    <motion.div 
                        key="content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard icon={Eye} label="Total Views" value={formatViews(stats.totalViews)} trend="+12.5%" />
                            <StatCard icon={Users} label="Subscribers" value={stats.subscribers} trend="+54" />
                            <StatCard icon={Play} label="Videos" value={stats.videoCount} />
                            <StatCard icon={Flame} label="Community Hype" value={stats.totalHypes} color="text-orange-500" />
                        </div>

                        {/* Video Management Table */}
                        <div className="bg-[#111111] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-xl font-black uppercase tracking-tight m-0">Content Manager</h2>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Search your library..." 
                                        className="bg-black/40 border border-white/10 rounded-full pl-12 pr-6 py-3 text-sm outline-none focus:border-[#FFB800]/50 transition-colors w-full md:w-80 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto scrollbar-hide">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-white/[0.01]">
                                            <th className="px-8 py-6">Video Name</th>
                                            <th className="px-6 py-6">Status</th>
                                            <th className="px-6 py-6">Published</th>
                                            <th className="px-6 py-6">Views</th>
                                            <th className="px-6 py-6">Vibes</th>
                                            <th className="px-8 py-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {videos.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-32 text-center text-zinc-600">
                                                    <Play size={48} className="mx-auto mb-4 opacity-10" />
                                                    <p className="font-bold">No content found.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            videos.map((video) => (
                                                <tr key={video.id} className="group hover:bg-white/[0.01] transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-32 aspect-video rounded-2xl bg-zinc-900 overflow-hidden shrink-0 border border-white/5 shadow-lg">
                                                                {video.thumbnail_url ? (
                                                                    <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Play size={20} className="text-white/10" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                {editingId === video.id ? (
                                                                    <input 
                                                                        autoFocus
                                                                        value={editTitle}
                                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                                        onBlur={() => handleQuickUpdate(video.id)}
                                                                        className="bg-zinc-800 border border-[#FFB800] rounded px-3 py-1.5 text-sm text-white w-full outline-none"
                                                                    />
                                                                ) : (
                                                                    <h4 className="text-sm font-black text-zinc-200 group-hover:text-white truncate m-0">
                                                                        {video.title}
                                                                    </h4>
                                                                )}
                                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                                                                    {video.is_short ? 'Vertical Short' : 'Long-form Video'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="px-2.5 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[9px] font-black uppercase">Public</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-bold text-zinc-500">
                                                        {format(new Date(video.created_at), 'MMM d, yyyy')}
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-black text-white italic">
                                                        {video.view_count || 0}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-1.5 text-xs font-black text-orange-400 italic">
                                                            <Flame size={14} />
                                                            {video.hype_count || 0}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link href={`/watch/${video.id}`} className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
                                                                <Eye size={18} />
                                                            </Link>
                                                            <button 
                                                                onClick={() => { setEditingId(video.id); setEditTitle(video.title); }}
                                                                className="p-2.5 hover:bg-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all"
                                                                title="Edit title"
                                                                aria-label="Edit title"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(video.id)}
                                                                className="p-2.5 hover:bg-red-500/5 rounded-2xl text-zinc-500 hover:text-red-500 transition-all"
                                                                title="Delete video"
                                                                aria-label="Delete video"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="revenue"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Revenue Overview Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard 
                                icon={DollarSign} 
                                label="Total USDC Revenue" 
                                value={`$${revenueData?.stats?.totalUSDC?.toFixed(2) || '0.00'}`} 
                                trend="75% Split Share"
                                color="text-green-400" 
                            />
                            <StatCard 
                                icon={Wallet} 
                                label="Base Native (ETH)" 
                                value={`${revenueData?.stats?.totalNativeBase?.toFixed(4) || '0.0000'} ETH`} 
                                color="text-blue-400" 
                            />
                            <StatCard 
                                icon={Flame} 
                                label="Solana Native (SOL)" 
                                value={`${revenueData?.stats?.totalNativeSolana?.toFixed(2) || '0.00'} SOL`} 
                                color="text-[#14F195]" 
                            />
                            <StatCard 
                                icon={History} 
                                label="Total Transactions" 
                                value={revenueData?.stats?.count || 0} 
                                color="text-purple-400" 
                            />
                        </div>

                        {/* Revenue Analytics Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-[#111111] p-8 rounded-[40px] border border-white/5 space-y-8 shadow-2xl">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black uppercase tracking-tight italic">Revenue Velocity</h3>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#FFB800]">
                                        <TrendingUp size={14} /> Last 7 Days (USDC)
                                    </div>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData?.chartData || []}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis 
                                                dataKey="date" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#666', fontSize: 10, fontWeight: 900 }} 
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#666', fontSize: 10, fontWeight: 900 }} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                                itemStyle={{ color: '#FFB800', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="revenue" 
                                                stroke="#FFB800" 
                                                strokeWidth={4}
                                                fillOpacity={1} 
                                                fill="url(#colorRev)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Payout Channels Card */}
                            <div className="bg-[#111111] p-8 rounded-[40px] border border-white/5 flex flex-col shadow-2xl">
                                <h3 className="text-xl font-black uppercase tracking-tight italic mb-8">Payout Status</h3>
                                <div className="space-y-6 flex-1">
                                    <PayoutItem chain="Base" address={profile?.wallet_address} status="Linked" color="blue" />
                                    <PayoutItem chain="Solana" address={profile?.solana_wallet_address} status={profile?.solana_wallet_address ? 'Linked' : 'Not Set'} color="green" />
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-relaxed">
                                        All tips are split 75/25 atomically on-chain. Funds are deposited directly to your non-custodial wallet.
                                    </p>
                                    <Link href="/studio/settings" className="mt-4 flex items-center gap-2 text-[#FFB800] text-xs font-black uppercase hover:underline">
                                        Update Wallets <ArrowUpRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-[#111111] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-xl font-black uppercase tracking-tight m-0 italic">Transaction History</h2>
                                <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                                    <Calendar size={14} /> Total: {revenueData?.stats?.count || 0}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-white/[0.01]">
                                            <th className="px-8 py-6">Date</th>
                                            <th className="px-6 py-6">Blockchain</th>
                                            <th className="px-6 py-6">Asset</th>
                                            <th className="px-6 py-6 text-right">Amount (Gross)</th>
                                            <th className="px-8 py-6 text-right">Explorer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {!revenueData?.recentTips?.length ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-24 text-center text-zinc-700 font-black uppercase italic">
                                                    No transactions yet
                                                </td>
                                            </tr>
                                        ) : (
                                            revenueData.recentTips.map((tip: any) => (
                                                <tr key={tip.id} className="hover:bg-white/[0.01] transition-colors">
                                                    <td className="px-8 py-5 text-xs font-bold text-zinc-400">
                                                        {format(new Date(tip.created_at), 'MMM d, HH:mm')}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase border",
                                                            tip.chain === 'base' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        )}>
                                                            {tip.chain}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="text-xs font-black text-white italic uppercase tracking-widest">
                                                            {tip.asset}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-black text-white italic">
                                                        {parseFloat(tip.amount_raw).toFixed(4)}
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        {tip.tx_hash && (
                                                            <a 
                                                                href={tip.chain === 'base' ? `https://basescan.org/tx/${tip.tx_hash}` : `https://solscan.io/tx/${tip.tx_hash}`}
                                                                target="_blank"
                                                                className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-[#FFB800] transition-colors text-[10px] font-black uppercase"
                                                            >
                                                                Receipt <ExternalLink size={14} />
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Helper Components ---

function StatCard({ icon: Icon, label, value, trend, color = "text-[#FFB800]" }: any) {
    return (
        <div className="bg-[#111111] p-8 rounded-[40px] border border-white/5 shadow-xl hover:border-white/10 transition-all group overflow-hidden relative">
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={cn("w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center border border-white/5 shadow-inner", color)}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                {trend && (
                    <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                        {trend}
                    </span>
                )}
            </div>
            <div className="space-y-1 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
                <div className="text-4xl font-black tracking-tighter text-white italic">{value}</div>
            </div>
            {/* Ambient micro-glow */}
            <div className="absolute -bottom-10 -right-10 w-24 h-24 blur-[80px] bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

function PayoutItem({ chain, address, status, color }: any) {
    const isLinked = !!address;
    return (
        <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-3xl group">
            <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-white/5", color === 'blue' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400')}>
                    <Wallet size={18} />
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">{chain} Payout</h4>
                    <p className="text-[10px] text-zinc-600 font-bold truncate max-w-[120px] lg:max-w-none">
                        {isLinked ? address : 'Configure in settings'}
                    </p>
                </div>
            </div>
            <span className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                isLinked ? "bg-green-500/10 text-green-500" : "bg-zinc-500/10 text-zinc-500"
            )}>
                {status}
            </span>
        </div>
    );
}
