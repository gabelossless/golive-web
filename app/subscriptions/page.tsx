'use client';

import React from 'react';
import VideoCard from '@/components/VideoCard';
import { Compass, Filter } from 'lucide-react';

const subscribedVideos = [
    {
        id: 'sub1',
        title: 'My Setup Tour 2026',
        thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=2642&auto=format&fit=crop',
        author: 'TechHeaven',
        authorAvatar: 'https://i.pravatar.cc/150?u=tech',
        views: '120K',
        timestamp: '1 hour ago',
        duration: '14:20',
        isVerified: true
    },
    {
        id: 'sub2',
        title: 'Speedrun Any% - World Record Pace',
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop',
        author: 'SpeedQueen',
        authorAvatar: 'https://i.pravatar.cc/40?u=sq',
        views: '5.4K',
        timestamp: 'Live Now',
        isLive: true,
        isVerified: true
    },
    {
        id: 'sub3',
        title: 'Vlog: Day in the Life of a Pro Gamer',
        thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2665&auto=format&fit=crop',
        author: 'FragMaster Pro',
        authorAvatar: 'https://i.pravatar.cc/150?u=frag',
        views: '45K',
        timestamp: '3 hours ago',
        duration: '18:55',
        isVerified: true
    },
    {
        id: 'sub4',
        title: 'Cyberpunk 2077: Phantom Liberty - Hidden Secrets',
        thumbnail: 'https://images.unsplash.com/photo-1605898399783-1820b735e127?q=80&w=2574&auto=format&fit=crop',
        author: 'NightOwl',
        authorAvatar: 'https://i.pravatar.cc/150?u=no',
        views: '12K',
        timestamp: '5 hours ago',
        duration: '10:02',
    },
    {
        id: 'sub5',
        title: 'Making a Game in 48 Hours',
        thumbnail: 'https://images.unsplash.com/photo-1552824236-07764a7538b2?q=80&w=2671&auto=format&fit=crop',
        author: 'IndieDev',
        authorAvatar: 'https://i.pravatar.cc/150?u=indie',
        views: '89K',
        timestamp: '1 day ago',
        duration: '42:15',
        isVerified: true
    }
];

export default function SubscriptionsPage() {
    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center">
                        <Compass className="text-primary" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Your Subscriptions</h1>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-full text-sm font-bold shadow-lg shadow-foreground/10 hover:opacity-90 transition-opacity whitespace-nowrap">
                        All Videos
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover rounded-full text-sm font-medium border border-border transition-colors whitespace-nowrap">
                        Today
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover rounded-full text-sm font-medium border border-border transition-colors whitespace-nowrap">
                        Live Now
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover rounded-full text-sm font-medium border border-border transition-colors whitespace-nowrap">
                        Continue Watching
                    </button>
                    <button className="p-2 hover:bg-surface-hover rounded-full transition-colors ml-2">
                        <Filter size={20} className="text-muted" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {subscribedVideos.map((video) => (
                    <VideoCard key={video.id} {...video} />
                ))}
            </div>

            <div className="mt-12 text-center">
                <p className="text-muted text-sm">You&apos;re all caught up!</p>
            </div>
        </div>
    );
}
