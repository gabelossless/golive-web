'use client';

import React from 'react';
import VideoCard from '@/components/VideoCard';
import { Play, Shuffle, Plus, MoreVertical, Share2 } from 'lucide-react';

const playlistVideos = [
    {
        id: 'p1',
        title: 'Valorant Guides: From Iron to Radiant',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop',
        author: 'FragMaster Pro',
        views: '1.2M',
        authorAvatar: 'https://i.pravatar.cc/150?u=frag',
        timestamp: '1 year ago',
        duration: '10:00',
    },
    {
        id: 'p2',
        title: 'Aim Training Routine 2026',
        thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=2642&auto=format&fit=crop',
        author: 'FragMaster Pro',
        views: '450K',
        authorAvatar: 'https://i.pravatar.cc/150?u=frag',
        timestamp: '6 months ago',
        duration: '15:20',
    },
    {
        id: 'p3',
        title: 'Map Knowledge: Ascent Deep Dive',
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=2574&auto=format&fit=crop',
        author: 'FragMaster Pro',
        views: '220K',
        authorAvatar: 'https://i.pravatar.cc/150?u=frag',
        timestamp: '3 months ago',
        duration: '22:15',
    }
];

export default function PlaylistPage() {
    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar Info */}
            <div className="w-full lg:w-[360px] flex-shrink-0">
                <div className="bg-surface/30 rounded-2xl p-6 border border-border/50 sticky top-24 lg:min-h-[calc(100vh-140px)] flex flex-col">
                    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl mb-6 relative group">
                        <img src={playlistVideos[0].thumbnail} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={48} fill="white" className="text-white drop-shadow-lg" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-black leading-tight mb-2">Valorant Mastery Guide</h1>
                    <div className="flex items-center gap-2 mb-6">
                        <p className="text-sm font-bold text-primary cursor-pointer hover:underline">FragMaster Pro</p>
                        <span className="text-muted text-xs">•</span>
                        <p className="text-xs text-muted font-medium">32 videos • Updated today</p>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button className="flex-1 btn btn-primary rounded-full py-3 font-bold shadow-lg shadow-primary/20">
                            <Play size={18} fill="currentColor" /> Play all
                        </button>
                        <button className="flex-1 bg-surface hover:bg-surface-hover border border-border rounded-full py-3 font-bold flex items-center justify-center gap-2 transition-colors">
                            <Shuffle size={18} /> Shuffle
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-4 py-2">
                        <button className="p-2 rounded-full hover:bg-surface-hover transition-colors"><Plus size={20} /></button>
                        <button className="p-2 rounded-full hover:bg-surface-hover transition-colors"><Share2 size={20} /></button>
                        <button className="p-2 rounded-full hover:bg-surface-hover transition-colors"><MoreVertical size={20} /></button>
                    </div>

                    <p className="mt-6 text-sm text-foreground/70 leading-relaxed line-clamp-4">
                        The ultimate guide to ranking up in Valorant. From basic mechanics to advanced strategy, this playlist covers everything you need to know to hit Radiant.
                    </p>
                </div>
            </div>

            {/* Right Video List */}
            <div className="flex-1 space-y-2">
                {/* Simulated list repeats for volume */}
                {[...playlistVideos, ...playlistVideos, ...playlistVideos].map((video, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors group cursor-pointer border border-transparent hover:border-border/50">
                        <div className="flex items-center justify-center w-8 text-muted font-medium text-sm">
                            {i + 1}
                        </div>
                        <div className="w-40 aspect-video rounded-lg overflow-hidden relative flex-shrink-0">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-bold">{video.duration}</div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h3 className="font-bold text-sm md:text-base line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors">{video.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted mt-1">
                                <span>{video.author}</span>
                                <span>•</span>
                                <span>{video.views}</span>
                                <span>•</span>
                                <span>{video.timestamp}</span>
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 self-center">
                            <button className="p-2 hover:bg-background rounded-full transition-colors"><MoreVertical size={18} className="text-muted" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
