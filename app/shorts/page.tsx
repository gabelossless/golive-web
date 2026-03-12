'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, UserPlus, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';

interface Short {
    id: string;
    title: string;
    video_url: string;
    view_count: number;
    profiles: { username: string; avatar_url: string | null } | null;
    like_count?: number;
}

export default function ShortsPage() {
    const { user } = useAuth();
    const [shorts, setShorts] = useState<Short[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [muted, setMuted] = useState(true);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchShorts() {
            const { data } = await supabase
                .from('videos')
                .select('id, title, video_url, view_count, profiles(username, avatar_url)')
                .eq('is_short', true)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                setShorts(data.map((s: any) => ({
                    ...s,
                    profiles: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles,
                })));
            }
            setLoading(false);
        }
        fetchShorts();
    }, []);

    useEffect(() => {
        videoRefs.current.forEach((vid, i) => {
            if (!vid) return;
            if (i === currentIndex) {
                vid.muted = muted;
                vid.play().catch(() => { });
            } else {
                vid.pause();
                vid.currentTime = 0;
            }
        });
    }, [currentIndex, muted]);

    const navigate = useCallback((dir: 'up' | 'down') => {
        setCurrentIndex(prev => {
            if (dir === 'down') return Math.min(prev + 1, shorts.length - 1);
            return Math.max(prev - 1, 0);
        });
    }, [shorts.length]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        let startY = 0;
        const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
        const onTouchEnd = (e: TouchEvent) => {
            const diff = startY - e.changedTouches[0].clientY;
            if (Math.abs(diff) > 50) navigate(diff > 0 ? 'down' : 'up');
        };
        container.addEventListener('touchstart', onTouchStart, { passive: true });
        container.addEventListener('touchend', onTouchEnd, { passive: true });
        return () => {
            container.removeEventListener('touchstart', onTouchStart);
            container.removeEventListener('touchend', onTouchEnd);
        };
    }, [navigate]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') navigate('down');
            if (e.key === 'ArrowUp') navigate('up');
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [navigate]);

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-black">
            <div className="w-8 h-8 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (shorts.length === 0) return (
        <div className="flex flex-col items-center justify-center h-screen bg-black gap-4 text-center px-6">
            <div className="text-5xl">🎬</div>
            <h2 className="text-xl font-black">No Shorts Yet</h2>
            <p className="text-gray-400 text-sm">Be the first to create a Short! Upload a vertical video or use the AI Studio.</p>
            <Link href="/upload" className="mt-2 px-6 py-2.5 bg-[#FFB800] text-black font-bold rounded-full text-sm hover:bg-[#FFB800]/90 transition-colors">
                Create a Short
            </Link>
        </div>
    );

    return (
        <div ref={containerRef} className="relative h-[calc(100vh-64px)] overflow-hidden bg-black select-none">
            {/* Navigation Arrows - Desktop */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-2">
                <button onClick={() => navigate('up')} disabled={currentIndex === 0}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 disabled:opacity-20 transition-all"
                    aria-label="Previous short" title="Previous short">
                    <ChevronUp size={20} />
                </button>
                <button onClick={() => navigate('down')} disabled={currentIndex === shorts.length - 1}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 disabled:opacity-20 transition-all"
                    aria-label="Next short" title="Next short">
                    <ChevronDown size={20} />
                </button>
            </div>

            {/* Scroll indicator */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 flex gap-1.5">
                {shorts.slice(0, 8).map((_, i) => (
                    <div key={i} className={`transition-all duration-300 rounded-full ${i === currentIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`} />
                ))}
            </div>

            <AnimatePresence initial={false}>
                {shorts.map((short, i) => (
                    i === currentIndex && (
                        <motion.div
                            key={short.id}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.25 }}
                            className="absolute inset-0 flex items-center justify-center bg-black"
                        >
                            {/* Video */}
                            <video
                                ref={el => { videoRefs.current[i] = el; }}
                                src={short.video_url}
                                className="h-full max-h-full aspect-[9/16] object-cover rounded-none md:rounded-2xl"
                                loop
                                playsInline
                                muted={muted}
                                autoPlay
                                onClick={() => setMuted(m => !m)}
                            />

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none md:rounded-2xl" />

                            {/* Right Action Bar */}
                            <div className="absolute right-4 bottom-24 md:right-8 flex flex-col items-center gap-5 z-10">
                                <ActionBtn icon={<Heart size={24} />} label={short.like_count || 0} title="Like" />
                                <ActionBtn icon={<MessageCircle size={24} />} label="Reply" title="Reply" />
                                <ActionBtn icon={<Share2 size={24} />} label="Share" title="Share" />
                                <ActionBtn
                                    icon={<UserPlus size={24} />}
                                    label="Follow"
                                    title={`Follow ${short.profiles?.username}`}
                                />
                                <button
                                    onClick={() => setMuted(m => !m)}
                                    className="flex flex-col items-center gap-1 text-white"
                                    aria-label={muted ? 'Unmute' : 'Mute'}
                                    title={muted ? 'Unmute' : 'Mute'}
                                >
                                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
                                        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                    </div>
                                </button>
                            </div>

                            {/* Bottom Info */}
                            <div className="absolute bottom-6 left-4 right-16 z-10">
                                <Link href={`/profile/${short.profiles?.username}`} className="flex items-center gap-2 mb-2 group">
                                    <img
                                        src={short.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${short.profiles?.username}`}
                                        alt={short.profiles?.username || ''}
                                        className="w-9 h-9 rounded-full border-2 border-white/20 object-cover"
                                    />
                                    <span className="font-bold text-sm group-hover:text-[#FFB800] transition-colors">
                                        @{short.profiles?.username || 'unknown'}
                                    </span>
                                </Link>
                                <p className="text-sm font-medium text-white/90 line-clamp-2 max-w-[80vw] md:max-w-sm">
                                    {short.title}
                                </p>
                            </div>
                        </motion.div>
                    )
                ))}
            </AnimatePresence>
        </div>
    );
}

function ActionBtn({ icon, label, title }: { icon: React.ReactNode; label: string | number; title: string }) {
    return (
        <button className="flex flex-col items-center gap-1 text-white" aria-label={title} title={title}>
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors">
                {icon}
            </div>
            <span className="text-xs font-bold">{label}</span>
        </button>
    );
}
