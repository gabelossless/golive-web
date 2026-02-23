'use client';

import React from 'react';
import VideoCard from '@/components/VideoCard';
import { ThumbsUp, Play, Shuffle } from 'lucide-react';

const likedVideos = [
    {
        id: 'l1',
        title: 'Top 5 Mistakes I See in Ranked',
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2670&auto=format&fit=crop',
        author: 'FragMaster Pro',
        authorAvatar: 'https://i.pravatar.cc/150?u=frag',
        views: '2.3M',
        timestamp: '2 weeks ago',
        duration: '19:44',
        isVerified: true
    },
    {
        id: 'l2',
        title: 'My Setup Tour 2026',
        thumbnail: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?q=80&w=2670&auto=format&fit=crop',
        author: 'TechHeaven',
        authorAvatar: 'https://i.pravatar.cc/150?u=tech',
        views: '120K',
        timestamp: '1 hour ago',
        duration: '14:20',
        isVerified: true
    },
    {
        id: 'l3',
        title: 'Cyberpunk 2077: Phantom Liberty - Hidden Secrets',
        thumbnail: 'https://images.unsplash.com/photo-1605898399783-1820b735e127?q=80&w=2574&auto=format&fit=crop',
        author: 'NightOwl',
        authorAvatar: 'https://i.pravatar.cc/150?u=no',
        views: '12K',
        timestamp: '5 hours ago',
        duration: '10:02',
    }
];

export default function LikedPage() {
    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Playlist Info Sidebar */}
            <div className="w-full lg:w-[360px] flex-shrink-0">
                <div className="sticky top-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-background border border-border/50 p-6 flex flex-col min-h-[400px]">
                    <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 shadow-2xl relative group">
                        <img src={likedVideos[0].thumbnail} alt="Playlist Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={48} className="text-white drop-shadow-lg" fill="white" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-black mb-2">Liked Videos</h1>
                    <div className="flex items-center gap-2 text-sm font-bold text-muted mb-6">
                        <span>FragMaster Pro</span>
                        <span>•</span>
                        <span>{likedVideos.length} videos</span>
                    </div>

                    <div className="flex gap-2">
                        <button className="flex-1 btn btn-primary rounded-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25">
                            <Play size={18} fill="currentColor" /> Play all
                        </button>
                        <button className="flex-1 bg-surface hover:bg-surface-hover border border-border/50 rounded-full py-2.5 font-bold flex items-center justify-center gap-2 transition-colors">
                            <Shuffle size={18} /> Shuffle
                        </button>
                    </div>
                </div>
            </div>

            {/* Video List */}
            <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-8 animate-in fade-in slide-in-from-bottom-4">
                    {likedVideos.map((video) => (
                        <VideoCard key={video.id} {...video} />
                    ))}
                    {/* Add more mock repetitions to fill grid if needed */}
                </div>
            </div>
        </div>
    );
}
