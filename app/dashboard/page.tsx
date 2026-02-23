'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, BarChart3, Users, DollarSign, Upload, Edit, Trash2, MoreVertical, Search, Plus } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Creator Dashboard</h1>
                    <p className="text-muted">Welcome back, FragMaster! Here&apos;s what&apos;s happening with your channel.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/upload" className="btn btn-primary px-6 shadow-lg shadow-primary/25">
                        <Upload size={18} className="mr-2" /> Upload New
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border border-border relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BarChart3 size={64} />
                    </div>
                    <h3 className="text-muted text-sm font-bold uppercase tracking-wider mb-2">Total Views</h3>
                    <p className="text-4xl font-black tracking-tighter">1,245,678</p>
                    <p className="text-sm font-medium text-emerald-500 mt-2 flex items-center gap-1">
                        +12.5% <span className="text-muted font-normal">from last month</span>
                    </p>
                </div>

                <div className="glass p-6 rounded-2xl border border-border relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={64} />
                    </div>
                    <h3 className="text-muted text-sm font-bold uppercase tracking-wider mb-2">Subscribers</h3>
                    <p className="text-4xl font-black tracking-tighter">1,542,000</p>
                    <p className="text-sm font-medium text-emerald-500 mt-2 flex items-center gap-1">
                        +850 <span className="text-muted font-normal">new this week</span>
                    </p>
                </div>

                <div className="glass p-6 rounded-2xl border border-border relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={64} />
                    </div>
                    <h3 className="text-muted text-sm font-bold uppercase tracking-wider mb-2">Est. Revenue</h3>
                    <p className="text-4xl font-black tracking-tighter">$12,450.00</p>
                    <p className="text-sm font-medium text-emerald-500 mt-2 flex items-center gap-1">
                        +5% <span className="text-muted font-normal">from estimated</span>
                    </p>
                </div>
            </div>

            {/* Recent Content */}
            <div className="glass border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold">Recent Content</h2>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Filter videos..."
                            className="bg-surface border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface text-muted font-bold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">Video</th>
                                <th className="px-6 py-4">Visibility</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Views</th>
                                <th className="px-6 py-4">Comments</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {[
                                { title: 'INSANE Clutch in the Grand Finals!', views: '1.2M', date: 'Feb 16, 2026', comments: 4520, status: 'Public' },
                                { title: 'Warmup Routine for 2026 Season', views: '45K', date: 'Feb 14, 2026', comments: 120, status: 'Public' },
                                { title: 'Top 5 Mistakes in Ranked', views: '890K', date: 'Feb 10, 2026', comments: 3400, status: 'Public' },
                                { title: 'Secret Pro Settings Reveal', views: '-', date: 'Draft', comments: '-', status: 'Draft' },
                            ].map((row, i) => (
                                <tr key={i} className="group hover:bg-surface-hover transition-colors">
                                    <td className="px-6 py-4 font-medium flex items-center gap-4">
                                        <div className="w-24 h-14 bg-black rounded-lg overflow-hidden relative border border-border/50">
                                            {/* Mock thumb */}
                                            <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center text-xs text-muted">
                                                IMG
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate max-w-[200px] text-foreground">{row.title}</p>
                                            <p className="text-xs text-muted line-clamp-1">{row.status === 'Draft' ? 'Add description...' : 'Gaming • 12:34'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status === 'Public' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted">{row.date}</td>
                                    <td className="px-6 py-4 font-medium">{row.views}</td>
                                    <td className="px-6 py-4 text-muted">{row.comments}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-background rounded-lg text-primary transition-colors" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-background rounded-lg text-destructive transition-colors" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-background rounded-lg text-muted transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
