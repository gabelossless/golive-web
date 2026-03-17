'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Shield, Zap, TrendingUp, Users, MessageSquare, ThumbsUp, Loader2, Plus, Ghost, Play, Clock, BarChart3, ChevronRight, Activity, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GrowthIntelligenceHub() {
    const { profile } = useAuth();
    const [videos, setVideos] = useState<any[]>([]);
    const [stats, setStats] = useState({ activeBoosts: 0, dummyCount: 0, velocity: 'Normal' });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'videos' | 'dummies' | 'protocol'>('videos');

    useEffect(() => {
        if (profile?.is_admin) {
            fetchInitialData();
        }
    }, [profile]);

    async function fetchInitialData() {
        setLoading(true);
        // 1. Fetch Videos
        const { data: vids } = await supabase
            .from('videos')
            .select('*, profiles(username)')
            .order('created_at', { ascending: false })
            .limit(20);
        if (vids) setVideos(vids);

        // 2. Fetch Dummy Count
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_dummy', true);
        
        // 3. Fetch Active Boosts
        const { count: boosts } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('boosted', true);

        setStats({
            activeBoosts: boosts || 0,
            dummyCount: count || 0,
            velocity: (vids?.some(v => (v.growth_velocity || 0) > 0)) ? 'Accelerated' : 'Normal'
        });
        setLoading(false);
    }

    const handleDripConfig = async (videoId: string, velocity: number) => {
        setProcessing(videoId);
        try {
            const { error } = await supabase.from('videos').update({
                boosted: true,
                growth_velocity: velocity,
                target_views: 1000 // Default target for drip
            }).eq('id', videoId);

            if (error) throw error;
            fetchInitialData();
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(null);
        }
    };

    const handleGenerateDummies = async (amount: number) => {
        setProcessing('dummies');
        try {
            const { error } = await supabase.rpc('generate_dummy_accounts', { count: amount });
            if (error) throw error;
            fetchInitialData();
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(null);
        }
    };

    const handleBulkEngage = async (videoId: string) => {
        setProcessing(videoId + '_engage');
        try {
            const { error } = await supabase.rpc('dummy_engage_video', { 
                target_video_id: videoId, 
                like_count: 25 
            });
            if (error) throw error;
            alert('25 Agents engaged with this video.');
            fetchInitialData();
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(null);
        }
    };

    if (!profile?.is_admin) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-[#050505]">
                <Shield size={64} className="text-destructive mb-4 opacity-20 animate-pulse" />
                <h1 className="text-4xl font-black uppercase tracking-tighter">Protocol Violation</h1>
                <p className="text-gray-500 mt-2 max-w-sm">Access to the Growth Intelligence Hub is restricted to Level 1 Administrators.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            {/* Glossy Header */}
            <header className="relative p-8 rounded-[32px] overflow-hidden border border-white/5 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB800]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] border border-[#FFB800]/20">
                                <Zap size={20} className="fill-[#FFB800]" />
                            </div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter">Growth Hub</h1>
                        </div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Strategic Momentum & Engagement Engine</p>
                    </div>
                    <div className="flex gap-4">
                        <StatCard icon={TrendingUp} label="Active Boosts" value={stats.activeBoosts} />
                        <StatCard icon={Users} label="Agent Population" value={stats.dummyCount} />
                        <StatCard icon={Activity} label="System State" value={stats.velocity} color="text-green-500" />
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl w-fit">
                <TabButton active={activeTab === 'videos'} onClick={() => setActiveTab('videos')} icon={Film} label="Content Pulse" />
                <TabButton active={activeTab === 'dummies'} onClick={() => setActiveTab('dummies')} icon={Ghost} label="Agents" />
                <TabButton active={activeTab === 'protocol'} onClick={() => setActiveTab('protocol')} icon={Shield} label="Protocol" />
            </div>

            <main className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'videos' && (
                        <motion.div
                            key="videos"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-4"
                        >
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 pl-2">System Content Feed</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />)
                                ) : (
                                    videos.map(video => (
                                        <div key={video.id} className="group bg-[#0C0C0C] p-4 rounded-3xl border border-white/5 hover:border-[#FFB800]/30 transition-all flex items-center justify-between gap-6">
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className="relative w-32 aspect-video rounded-xl overflow-hidden shrink-0">
                                                    <img src={video.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                                    {video.boosted && (
                                                        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-[#FFB800] text-black text-[8px] font-black uppercase">Active Boost</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-black text-lg truncate group-hover:text-[#FFB800] transition-colors">{video.title}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-wider">
                                                        <span>@{video.profiles?.username}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-800" />
                                                        <span className="flex items-center gap-1">
                                                            <BarChart3 size={12} /> {video.view_count} views
                                                        </span>
                                                        {video.growth_velocity > 0 && (
                                                            <span className="text-green-500 flex items-center gap-1">
                                                                <Play size={10} className="fill-green-500" /> {video.growth_velocity} / hr
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleBulkEngage(video.id)}
                                                    disabled={processing === video.id + '_engage'}
                                                    className="p-3 rounded-2xl bg-white/5 hover:bg-[#FFB800]/10 text-gray-400 hover:text-[#FFB800] transition-all border-none cursor-pointer"
                                                    title="Bulk Like (25 Agents)"
                                                >
                                                    {processing === video.id + '_engage' ? <Loader2 size={18} className="animate-spin" /> : <ThumbsUp size={18} />}
                                                </button>
                                                <div className="h-8 w-px bg-white/5" />
                                                <div className="flex gap-1 p-1 bg-black/50 rounded-2xl">
                                                    <DripButton label="50" onClick={() => handleDripConfig(video.id, 50)} active={video.growth_velocity === 50} loading={processing === video.id} />
                                                    <DripButton label="200" onClick={() => handleDripConfig(video.id, 200)} active={video.growth_velocity === 200} loading={processing === video.id} />
                                                    <DripButton label="500" onClick={() => handleDripConfig(video.id, 500)} active={video.growth_velocity === 500} loading={processing === video.id} />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'dummies' && (
                        <motion.div
                            key="dummies"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-[#0C0C0C] p-8 rounded-[40px] border border-white/5 space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">Agent Management</h2>
                                    <p className="text-gray-500 text-sm font-medium">Generate and deploy high-fidelity simulated users.</p>
                                </div>
                                <div className="flex gap-3">
                                    <ActionCard 
                                        icon={Plus} 
                                        label="Deploy 10 Agents" 
                                        onClick={() => handleGenerateDummies(10)} 
                                        loading={processing === 'dummies'}
                                    />
                                    <ActionCard 
                                        icon={Plus} 
                                        label="Deploy 50 Agents" 
                                        onClick={() => handleGenerateDummies(50)} 
                                        loading={processing === 'dummies'}
                                        primary
                                    />
                                </div>
                            </div>

                            <DummyProfileGrid processing={processing === 'dummies'} />
                        </motion.div>
                    )}

                    {activeTab === 'protocol' && (
                        <motion.div
                            key="protocol"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-[#0C0C0C] p-12 rounded-[40px] border border-white/5 prose prose-invert max-w-none"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800]">
                                    <Shield size={24} />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter m-0">Confidential Protocol</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h3 className="text-[#FFB800] uppercase tracking-widest text-xs font-black">Access Control</h3>
                                    <ul className="space-y-4 list-none p-0 text-gray-400">
                                        <li className="flex items-start gap-3">
                                            <ChevronRight className="shrink-0 text-[#FFB800]" size={16} />
                                            <span>Admin panel access requires <code>is_admin</code> bit enabled in public profiles.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <ChevronRight className="shrink-0 text-[#FFB800]" size={16} />
                                            <span>Role assignments must be performed directly via encrypted SQL interface.</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-[#FFB800] uppercase tracking-widest text-xs font-black">Engagement Strategy</h3>
                                    <ul className="space-y-4 list-none p-0 text-gray-400">
                                        <li className="flex items-start gap-3">
                                            <ChevronRight className="shrink-0 text-[#FFB800]" size={16} />
                                            <span>Slow Drip increments view counts organic-style every 15-60 minutes.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <ChevronRight className="shrink-0 text-[#FFB800]" size={16} />
                                            <span>Bulk Engagement simulates spike viral events through Agent networks.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-12 p-6 rounded-3xl bg-[#FFB800]/5 border border-[#FFB800]/10 text-[#FFB800] text-sm font-bold flex items-center gap-4">
                                <Zap size={20} />
                                <span>PROTOCOL ADHERENCE IS MANDATORY. ALL ADMINISTRATIVE ACTIONS ARE LOGGED.</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function DummyProfileGrid({ processing }: { processing: boolean }) {
    const [dummies, setDummies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDummies();
    }, [processing]);

    async function fetchDummies() {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_dummy', true)
            .order('created_at', { ascending: false })
            .limit(20);
        if (data) setDummies(data);
        setLoading(false);
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bg-black/40 p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-3 animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-white/5" />
                        <div className="h-3 w-20 bg-white/5 rounded-full" />
                    </div>
                ))
            ) : dummies.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-600 font-black uppercase tracking-[0.2em]">
                    No Active Agents Detected
                </div>
            ) : (
                dummies.map(dummy => (
                    <div key={dummy.id} className="bg-black/40 p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-3 hover:border-[#FFB800]/20 transition-all group">
                        <div className="relative">
                            <img src={dummy.avatar_url} className="w-16 h-16 rounded-full border border-white/10 group-hover:scale-110 transition-transform" alt="" />
                            {dummy.is_verified && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FFB800] rounded-full border-4 border-[#0C0C0C] flex items-center justify-center text-black font-black text-[8px]">V</div>}
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-black truncate max-w-[120px]">@{dummy.username}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Level 1 Agent</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color = "text-white" }: any) {
    return (
        <div className="bg-black/40 px-6 py-4 rounded-2xl border border-white/5 group hover:border-[#FFB800]/20 transition-all">
            <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className="text-[#FFB800]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-400">{label}</span>
            </div>
            <div className={`text-xl font-black ${color}`}>{value}</div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                active ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'
            } border-none cursor-pointer`}
        >
            <Icon size={14} />
            {label}
        </button>
    );
}

function DripButton({ label, onClick, active, loading }: any) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                active 
                    ? 'bg-[#FFB800] text-black' 
                    : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/10'
            } border-none cursor-pointer flex items-center gap-1 min-w-[60px] justify-center`}
        >
            {loading && active ? <div className="w-2 h-2 rounded-full bg-black animate-pulse" /> : label}
        </button>
    );
}

function ActionCard({ icon: Icon, label, onClick, loading, primary }: any) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-30 border-none cursor-pointer ${
                primary ? 'bg-[#FFB800] text-black hover:bg-[#FFB800]/90 shadow-lg shadow-[#FFB800]/20' : 'bg-white/5 text-white hover:bg-white/10'
            }`}
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
            {label}
        </button>
    );
}
