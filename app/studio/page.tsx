'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, BarChart3, Radio, Video, TrendingUp, Users, DollarSign, Settings, Eye } from 'lucide-react';

export default function StudioPage() {
    return (
        <div className="flex h-[calc(100vh-var(--spacing-header))] -m-4 md:-m-6">
            {/* Studio Sidebar */}
            <div className="w-64 border-r border-white/5 bg-black hidden lg:flex flex-col p-4 space-y-1">
                <div className="px-4 py-6 mb-4 flex items-center gap-3 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]">
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center font-display text-xl text-white">F</div>
                    </div>
                    <div>
                        <p className="text-sm font-black tracking-widest uppercase">FragMaster</p>
                        <p className="text-[10px] tracking-[0.2em] text-primary uppercase font-black">CREATOR_DASH</p>
                    </div>
                </div>

                {[
                    { icon: LayoutDashboard, label: 'Analytics Core' },
                    { icon: Video, label: 'Content Matrix', active: true },
                    { icon: BarChart3, label: 'Revenue Intel' },
                    { icon: Radio, label: 'Live Protocol' },
                    { icon: Settings, label: 'System Prefs' },
                ].map((item) => (
                    <button
                        key={item.label}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-sm text-xs font-black tracking-widest uppercase transition-all ${item.active ? 'bg-primary text-white shadow-[0_0_20px_rgba(229,9,20,0.3)]' : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <item.icon size={16} strokeWidth={item.active ? 3 : 2} />
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#050505]">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-display font-black tracking-tighter uppercase italic text-white/90">Channel Analytics</h1>
                    <div className="text-[10px] text-white font-black tracking-[0.2em] uppercase bg-white/5 px-6 py-3 rounded-sm border border-white/10">
                        LAST_28_DAYS
                    </div>
                </header>

                {/* Big Graphs Mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-sm p-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <h3 className="text-white/40 font-black tracking-[0.2em] text-[10px] uppercase">TOTAL INTEL VIEWS</h3>
                                <p className="text-5xl font-display font-black tracking-[-0.02em] mt-2">1.2M <span className="text-sm text-green-500 font-bold ml-2">↑ 12%</span></p>
                            </div>
                        </div>
                        {/* Mock SVG Graph */}
                        <div className="w-full h-64 flex items-end justify-between gap-[2px] opacity-90 relative z-10">
                            {[40, 60, 45, 70, 80, 50, 60, 90, 75, 65, 85, 95, 80, 70, 90, 100, 85, 75, 60, 50, 70, 80, 60, 90].map((h, i) => (
                                <div key={i} className="w-full bg-primary hover:bg-white transition-all rounded-sm" style={{ height: `${h}%`, opacity: (i + 10) / 30 }} />
                            ))}
                        </div>
                        <div className="flex justify-between text-[9px] text-white/30 font-black tracking-[0.2em] uppercase mt-6 relative z-10">
                            <span>CYCLE_1</span>
                            <span>CYCLE_2</span>
                            <span>CYCLE_3</span>
                            <span>CYCLE_4</span>
                            <span>CYCLE_5</span>
                        </div>
                    </div>

                    {/* Realtime */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-sm p-8 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full" />
                        <h3 className="text-white/40 font-black tracking-[0.2em] text-[10px] uppercase mb-4 relative z-10">REALTIME MATRIX</h3>
                        <p className="text-5xl font-display font-black tracking-tighter relative z-10">12,450</p>
                        <p className="text-[9px] text-white/30 tracking-[0.2em] uppercase mb-8 relative z-10">VIEWS // LAST_48H</p>

                        <div className="flex-1 space-y-6 relative z-10">
                            {[
                                { title: 'BREACH PROTOCOL: GRAND FINALS', views: '4.5K' },
                                { title: 'WARMUP ROUTINE 2026', views: '2.1K' },
                                { title: 'TOP 5 SECURITY FLAWS', views: '1.2K' },
                            ].map((v, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div className="flex justify-between text-[11px] font-black tracking-widest uppercase mb-2 text-white/60 group-hover:text-primary transition-colors">
                                        <span className="line-clamp-1 pr-4">{v.title}</span>
                                        <span className="text-white">{v.views}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-sm overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary to-purple-500" style={{ width: `${80 - (i * 20)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="text-primary text-[10px] font-black tracking-[0.2em] uppercase mt-8 hover:text-white transition-colors relative z-10 text-left">ESTABLISH UPLINK →</button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'WATCH_TIME_HRS', val: '142.5K', icon: Clock },
                        { label: 'NEW_RECRUITS', val: '+12.4K', icon: Users },
                        { label: 'EST_REVENUE', val: '$4,250', icon: DollarSign },
                        { label: 'IMPRESSIONS', val: '5.4M', icon: Eye },
                    ].map((m, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-sm p-6 hover:border-primary/50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3 mb-4 text-white/40 group-hover:text-primary transition-colors">
                                <m.icon size={16} />
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase">{m.label}</span>
                            </div>
                            <p className="text-4xl font-display font-black tracking-[-0.02em]">{m.val}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Needed imports workaround if missing
function Clock({ size, className }: { size?: number, className?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
