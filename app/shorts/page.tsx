'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Music2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav'; // Import to ensure it shows up on mobile

const shortsData = [
    {
        id: 's1',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-gaming-world-glowing-texture-31346-large.mp4', // Mock video URL
        author: 'FragMaster Pro',
        description: 'This is what 10,000 hours of aim training looks like 🎯 #gaming #valorant #aimbot',
        song: 'Original Sound - FragMaster Pro',
        likes: '1.2M',
        comments: '12K',
        shares: '55K',
        avatar: 'https://i.pravatar.cc/150?u=frag'
    },
    {
        id: 's2',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-red-frog-on-a-log-1487-large.mp4',
        author: 'NatureLover',
        description: 'Found this little guy in the rainforest today! 🐸 #nature #wildlife',
        song: 'Rainforest Ambience - Nature Sounds',
        likes: '850K',
        comments: '5K',
        shares: '12K',
        avatar: 'https://i.pravatar.cc/150?u=nature'
    },
    {
        id: 's3',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-1558-large.mp4',
        author: 'ArtisticFlow',
        description: 'Mesmerizing ink flow... can you see the dragon? 🐉 #art #satisfying',
        song: 'LoFi Chill Beats - ArtMusic',
        likes: '2.5M',
        comments: '25K',
        shares: '100K',
        avatar: 'https://i.pravatar.cc/150?u=art'
    }
];

export default function ShortsPage() {
    const [currentShortIndex, setCurrentShortIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial scroll handler to track current index (simplified)
    const handleScroll = () => {
        if (!containerRef.current) return;
        const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
        setCurrentShortIndex(index);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);

    return (
        <div
            ref={containerRef}
            className="h-screen w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black fixed inset-0 z-[60]" // z-index higher than navbar/sidebar
        >
            {/* Nav overlay for escaping */}
            <div className="absolute top-4 left-4 z-50">
                <Link href="/" className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
            </div>

            {shortsData.map((short, index) => (
                <ShortItem key={short.id} data={short} isActive={index === currentShortIndex} />
            ))}

            <div className="md:hidden">
                <BottomNav />
            </div>
        </div>
    );
}

function ShortItem({ data, isActive }: { data: typeof shortsData[0]; isActive: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        if (isActive) {
            videoRef.current?.play().catch(() => { });
            setIsPlaying(true);
        } else {
            videoRef.current?.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    return (
        <div className="h-screen w-full snap-start relative flex items-center justify-center bg-black">
            {/* Video Container */}
            <div
                className="relative h-full w-full md:max-w-[450px] md:h-[95vh] md:rounded-2xl overflow-hidden cursor-pointer"
                onClick={togglePlay}
            >
                {/* Placeholder image while video loads or as fallback */}
                <div className="absolute inset-0 bg-gray-900 animate-pulse" />

                <video
                    ref={videoRef}
                    src={data.url}
                    className="h-full w-full object-cover"
                    loop
                    muted={isMuted}
                    playsInline
                />

                {/* Play/Pause Overlay Icon */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play size={64} className="text-white/80 fill-white/80" />
                    </div>
                )}

                {/* Controls Layer */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 flex flex-col justify-end p-4 pb-20 md:pb-6">

                    {/* Right Side Actions */}
                    <div className="absolute right-2 bottom-20 md:bottom-24 flex flex-col items-center gap-6">
                        <button
                            onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <div className={`p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all ${liked ? 'text-red-500' : 'text-white'}`}>
                                <Heart size={28} fill={liked ? 'currentColor' : 'none'} className={liked ? 'scale-110' : ''} />
                            </div>
                            <span className="text-white text-xs font-bold drop-shadow-md">{data.likes}</span>
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <div className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all text-white">
                                <MessageCircle size={28} fill="currentColor" />
                            </div>
                            <span className="text-white text-xs font-bold drop-shadow-md">{data.comments}</span>
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <div className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all text-white">
                                <Share2 size={28} />
                            </div>
                            <span className="text-white text-xs font-bold drop-shadow-md">{data.shares}</span>
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all text-white mt-2"
                        >
                            <MoreHorizontal size={28} />
                        </button>

                        <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white/50 mt-4 animate-spin-slow">
                            <img src={data.avatar} className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="pr-16 max-w-[90%] space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white">
                                <img src={data.avatar} alt={data.author} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-sm drop-shadow-md flex items-center gap-2">
                                    @{data.author}
                                    <span className="bg-red-600 text-[10px] px-1.5 py-0.5 rounded ml-1">SUBSCRIBE</span>
                                </span>
                            </div>
                        </div>

                        <p className="text-white text-sm drop-shadow-md line-clamp-2">
                            {data.description}
                        </p>

                        <div className="flex items-center gap-2 text-white/90 text-xs font-bold">
                            <Music2 size={14} />
                            <div className="overflow-hidden w-40">
                                <p className="whitespace-nowrap animate-marquee">{data.song}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mute Toggle */}
                <button
                    onClick={toggleMute}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors z-20"
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            </div>

            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 8s linear infinite;
                }
                .animate-spin-slow {
                    animation: spin 6s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
