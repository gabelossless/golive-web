'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, BarChart3, Radio, Video, TrendingUp, Users, DollarSign, Settings, Eye } from 'lucide-react';

export default function StudioPage() {
    return (
        <div className="flex h-[calc(100vh-var(--spacing-header))] -m-4 md:-m-6">
            {/* Studio Sidebar */}
            <div className="w-64 border-r border-border bg-surface/30 hidden lg:flex flex-col p-4 space-y-1">
                <div className="px-4 py-4 mb-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white">F</div>
                    <div>
                        <p className="text-sm font-bold">FragMaster Pro</p>
                        <p className="text-xs text-muted">Channel Dashboard</p>
                    </div>
                </div>

                {[
                    { icon: LayoutDashboard, label: 'Dashboard', active: true },
                    { icon: Video, label: 'Content' },
                    { icon: BarChart3, label: 'Analytics' },
                    { icon: Radio, label: 'Live Control' },
                    { icon: Settings, label: 'Settings' },
                ].map((item) => (
                    <button
                        key={item.label}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${item.active ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-muted hover:bg-surface-hover hover:text-foreground'
                            }`}
                    >
                        <item.icon size={18} />
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-black">Channel Analytics</h1>
                    <div className="text-sm text-muted font-bold bg-surface px-4 py-2 rounded-lg border border-border">
                        Last 28 days
                    </div>
                </header>

                {/* Big Graphs Mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-surface/50 border border-border rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-muted font-bold text-sm uppercase">Total Views</h3>
                                <p className="text-3xl font-black mt-1">1.2M <span className="text-sm text-emerald-500 font-bold ml-2">↑ 12%</span></p>
                            </div>
                        </div>
                        {/* Mock SVG Graph */}
                        <div className="w-full h-64 flex items-end justify-between gap-1 opacity-80">
                            {[40, 60, 45, 70, 80, 50, 60, 90, 75, 65, 85, 95, 80, 70, 90, 100, 85, 75, 60, 50, 70, 80, 60, 90].map((h, i) => (
                                <div key={i} className="w-full bg-primary hover:bg-primary-hover transition-all rounded-t-sm" style={{ height: `${h}%`, opacity: (i + 10) / 30 }} />
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-muted font-medium mt-4">
                            <span>Feb 1</span>
                            <span>Feb 7</span>
                            <span>Feb 14</span>
                            <span>Feb 21</span>
                            <span>Feb 28</span>
                        </div>
                    </div>

                    {/* Realtime */}
                    <div className="bg-surface/50 border border-border rounded-2xl p-6 flex flex-col">
                        <h3 className="text-muted font-bold text-sm uppercase mb-4">Realtime</h3>
                        <p className="text-4xl font-black tracking-tight">12,450</p>
                        <p className="text-xs text-muted mb-6">Views • Last 48 hours</p>

                        <div className="flex-1 space-y-4">
                            {[
                                { title: 'INSANE Clutch in the Grand Finals!', views: '4.5K' },
                                { title: 'Warmup Routine 2026', views: '2.1K' },
                                { title: 'Top 5 Mistakes', views: '1.2K' },
                            ].map((v, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div className="flex justify-between text-sm font-bold mb-1 group-hover:text-primary transition-colors">
                                        <span className="line-clamp-1">{v.title}</span>
                                        <span>{v.views}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${80 - (i * 20)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="text-primary text-sm font-bold mt-6 hover:underline">See more details</button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Watch Time (hours)', val: '142.5K', icon: Clock },
                        { label: 'Subscribers', val: '+12.4K', icon: Users },
                        { label: 'Est. Revenue', val: '$4,250', icon: DollarSign },
                        { label: 'Impressions', val: '5.4M', icon: Eye },
                    ].map((m, i) => (
                        <div key={i} className="bg-surface/50 border border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-2 mb-2 text-muted">
                                <m.icon size={16} />
                                <span className="text-xs font-bold uppercase">{m.label}</span>
                            </div>
                            <p className="text-2xl font-black">{m.val}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Needed imports workaround if missing
function Clock({ size, className }: { size?: number, className?: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
