'use client';

import React from 'react';
import { Clock, Trash2, Search } from 'lucide-react';
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
        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
                <h1 className="text-2xl font-black mb-6">Watch History</h1>

                {historyVideos.map((video) => (
                    <div key={video.id} className="group flex gap-4 p-2 rounded-xl hover:bg-surface-hover/50 transition-colors cursor-pointer">
                        {/* Thumbnail View */}
                        <div className="relative w-40 md:w-64 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                <div className="h-full bg-primary" style={{ width: `${video.progress}%` }} />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm md:text-base font-bold line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors">{video.title}</h3>
                                <p className="text-xs md:text-sm text-muted mt-1">{video.author} • {video.views} views</p>
                            </div>
                            <p className="text-xs text-muted/50 font-medium">Watched {video.timestamp}</p>
                        </div>

                        {/* Actions */}
                        <button className="self-start p-2 opacity-0 group-hover:opacity-100 hover:bg-surface-hover rounded-full transition-all text-muted hover:text-destructive">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Sidebar Controls */}
            <div className="w-full md:w-80 space-y-4">
                <div className="bg-surface/50 rounded-2xl p-6 border border-border/50 sticky top-24">
                    <div className="relative mb-6">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Search watch history"
                            className="w-full bg-background border-b border-border py-2 pl-10 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-full hover:bg-surface-hover transition-colors text-sm font-bold text-muted hover:text-foreground">
                            <Trash2 size={18} /> Clear all watch history
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-full hover:bg-surface-hover transition-colors text-sm font-bold text-muted hover:text-foreground">
                            <Clock size={18} /> Pause watch history
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
