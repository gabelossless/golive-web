'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Plus, 
    RefreshCcw, 
    UserPlus, 
    Search, 
    Filter,
    MoreHorizontal,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Loader2
} from 'lucide-react';

export default function BotManagementPage() {
    const [bots, setBots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        fetchBots();
    }, []);

    const fetchBots = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*, user_profiles(*)')
            .ilike('email', '%@zenith.bot');

        if (!error) setBots(data || []);
        setLoading(false);
    };

    const handleCreateBots = async () => {
        setCreating(true);
        setStatus(null);
        try {
            const res = await fetch('/api/admin/create-bots', { method: 'POST' });
            const data = await res.json();
            
            if (data.success) {
                setStatus({ type: 'success', message: `Successfully created ${data.count} new bots!` });
                fetchBots();
            } else {
                setStatus({ type: 'error', message: data.error || 'Failed to create bots' });
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Network error occurred' });
        }
        setCreating(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">BOT <span className="text-[#FFB800]">MANAGEMENT</span></h2>
                    <p className="text-gray-500 text-sm">Control the automated workforce and social engines.</p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={fetchBots}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        title="Refresh List"
                    >
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={handleCreateBots}
                        disabled={creating}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFB800] text-black font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {creating ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                        GENERATE 50 BOTS
                    </button>
                </div>
            </div>

            {/* Status Alert */}
            {status && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in zoom-in duration-300 ${
                    status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-bold">{status.message}</span>
                </div>
            )}

            {/* Filters & Search */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search bots by name or style..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#FFB800] transition-colors"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                        <Filter size={14} />
                        Filter Style
                    </button>
                </div>
            </div>

            {/* Bot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array(8).fill(0).map((_, i) => (
                        <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                    ))
                ) : bots.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <UserPlus size={48} className="mx-auto text-gray-700 mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">No bots found</h3>
                        <p className="text-sm text-gray-600">Start by generating the bot workforce.</p>
                    </div>
                ) : (
                    bots.map((bot) => (
                        <div 
                            key={bot.id} 
                            className="bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-[#FFB800]/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 rounded-lg bg-black/50 text-gray-400 hover:text-white">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-[#FFB800]/10 flex items-center justify-center border border-[#FFB800]/20 relative group-hover:scale-110 transition-transform">
                                    {bot.avatar_url ? (
                                        <img src={bot.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <span className="text-2xl font-black text-[#FFB800]">{bot.username[0]}</span>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0a0a0a]" title="Online" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold truncate" title={bot.username}>{bot.username}</h4>
                                    <div className="flex gap-2 mt-1">
                                        <span className="px-2 py-0.5 rounded-md bg-[#FFB800]/10 text-[#FFB800] text-[10px] font-black uppercase">
                                            {bot.user_profiles?.engagement_style || 'CASUAL'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-500 uppercase font-black tracking-widest">Credibility</span>
                                    <span className="text-white font-mono">{(bot.user_profiles?.credibility_score || 1).toFixed(2)}</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[#FFB800]" 
                                        style={{ width: `${(bot.user_profiles?.activity_level || 0.5) * 100}%` }} 
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {(bot.user_profiles?.interests?.primary || []).map((interest: string) => (
                                        <span key={interest} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] text-gray-400">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[10px] text-gray-600 italic">Created {new Date(bot.created_at).toLocaleDateString()}</span>
                                <button className="text-xs font-black text-[#FFB800] flex items-center gap-1 hover:underline">
                                    EDIT <ExternalLink size={10} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
