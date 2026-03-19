'use client';

import React from 'react';
import { Clock, Trash2, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const historyVideos = [
    {
        id: 'h1',
        title: 'INSANE Clutch in the Grand Finals! | Pro League Highlights',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop',
        author: 'FragMaster Pro',
        views: '1.2M',
        progress: 85,
        timestamp: 'Just now'
    },
    {
        id: 'h2',
        title: 'Reviewing the New META for 2026',
        thumbnail: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=2670&auto=format&fit=crop',
        author: 'TechTips',
        views: '340K',
        progress: 30,
        timestamp: '2 hours ago'
    },
    {
        id: 'h3',
        title: 'Top 10 Hidden Secrets in Elden Ring 2',
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2670&auto=format&fit=crop',
        author: 'LoreMaster',
        views: '890K',
        progress: 100,
        timestamp: 'Yesterday'
    },
    {
        id: 'h4',
        title: 'Building a $5000 Gaming PC',
        thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=2642&auto=format&fit=crop',
        author: 'HardwareGurus',
        views: '1.5M',
        progress: 10,
        timestamp: '2 days ago'
    }
];

export default function HistoryPage() {
    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto w-full p-4 md:p-8">
            <div className="flex-1 space-y-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-[#FFB800] rounded-full shadow-[0_0_15px_#FFB800]" />
                    <h1 className="text-4xl font-black italic font-premium text-gradient uppercase tracking-tighter">Watch History</h1>
                </div>

                <div className="space-y-4">
                    {historyVideos.map((video) => (
                        <div key={video.id} className="group flex flex-col sm:flex-row gap-6 p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all cursor-pointer relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FFB800]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {/* Thumbnail View */}
                            <div className="relative w-full sm:w-72 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                                    <div className="h-full bg-[#FFB800] shadow-[0_0_10px_#FFB800]" style={{ width: `${video.progress}%` }} />
                                </div>
                            </div>
 
                            {/* Info */}
                            <div className="flex-1 min-w-0 py-1 flex flex-col justify-between relative z-10">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold line-clamp-2 md:line-clamp-1 group-hover:text-[#FFB800] transition-colors leading-tight">{video.title}</h3>
                                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-500">
                                        <span>{video.author}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                        <span>{video.views} views</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] italic">Watched {video.timestamp}</p>
                                    <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full transition-all text-zinc-500 hover:text-red-500 border border-transparent hover:border-red-500/20" title="Remove from history">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sidebar Controls */}
            <div className="w-full lg:w-80 space-y-4">
                <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[32px] p-8 border border-white/5 sticky top-24 shadow-2xl overflow-hidden group/side">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/5 to-transparent opacity-50" />
                    <div className="relative mb-8">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search history"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#FFB800]/50 focus:bg-white/10 transition-all placeholder:text-zinc-600"
                        />
                    </div>

                    <div className="relative space-y-3">
                        <button className="w-full flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white border border-transparent hover:border-white/5 group">
                            <div className="flex items-center gap-3">
                                <Trash2 size={16} className="text-zinc-500 group-hover:text-red-500" /> 
                                Clear history
                            </div>
                            <ChevronDown size={14} className="opacity-30" />
                        </button>
                        <button className="w-full flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white border border-transparent hover:border-white/5 group">
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-zinc-500 group-hover:text-[#FFB800]" /> 
                                Pause history
                            </div>
                            <ChevronDown size={14} className="opacity-30" />
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 text-center italic">
                        VibeStream Secure History
                    </div>
                </div>
            </div>
        </div>
    );
}
