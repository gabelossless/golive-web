'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, UserPlus, Volume2, VolumeX, ChevronUp, ChevronDown, MoreVertical, Music2 } from 'lucide-react';
import { formatViews } from '@/lib/utils';

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
            const urlParams = new URLSearchParams(window.location.search);
            const targetId = urlParams.get('id');

            let query = supabase
                .from('videos')
                .select('id, title, video_url, view_count, profiles(username, avatar_url)')
                .eq('is_short', true);
            
            if (targetId) {
                // If we have a target ID, we might need to fetch it specifically or just sort it to top
                // For now, let's just fetch all and we'll reorder in memory
            }

            const { data } = await query
                .order('created_at', { ascending: false })
                .limit(40);

            if (data) {
                let normalized = data.map((s: any) => ({
                    ...s,
                    profiles: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles,
                }));

                if (targetId) {
                    const idx = normalized.findIndex(s => s.id === targetId);
                    if (idx > -1) {
                        const [target] = normalized.splice(idx, 1);
                        normalized = [target, ...normalized];
                    }
                }

                setShorts(normalized);
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
                            className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden"
                        >
                            {/* Background Blur - Cinematic Ambient */}
                            <div className="absolute inset-0 pointer-events-none">
                                <video
                                    src={short.video_url}
                                    className="w-full h-full object-cover opacity-40 blur-[80px] scale-150"
                                    muted
                                    playsInline
                                    autoPlay
                                    loop
                                />
                                <div className="absolute inset-0 bg-black/40" />
                            </div>

                            {/* Video */}
                            <video
                                ref={el => { videoRefs.current[i] = el; }}
                                src={short.video_url}
                                className="relative h-full max-h-full aspect-[9/16] object-contain md:rounded-2xl z-10 cursor-pointer"
                                loop
                                playsInline
                                muted={muted}
                                autoPlay
                                onClick={() => setMuted(m => !m)}
                            />

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none md:rounded-2xl" />

                            {/* Right Action Bar - YouTube Tonal Style */}
                            <div className="absolute right-3 bottom-20 md:right-8 flex flex-col items-center gap-6 z-20">
                                <div className="flex flex-col items-center gap-1 group">
                                    <motion.button 
                                        whileTap={{ scale: 0.8 }}
                                        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center transition-colors shadow-lg"
                                        aria-label="Like"
                                        title="Like"
                                        onClick={() => {/* Toggle Hype Logic */}}
                                    >
                                        <Heart size={28} className="text-white group-hover:scale-110 transition-transform" />
                                    </motion.button>
                                    <span className="text-[11px] font-bold text-white tracking-tight drop-shadow-md">{formatViews(short.view_count / 10)}</span>
                                </div>

                                <div className="flex flex-col items-center gap-1 group">
                                    <button 
                                        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center transition-colors shadow-lg"
                                        title="View Replies"
                                    >
                                        <MessageCircle size={28} className="text-white group-hover:scale-110 transition-transform" />
                                    </button>
                                    <span className="text-[11px] font-bold text-white tracking-tight drop-shadow-md">Replies</span>
                                </div>

                                <div className="flex flex-col items-center gap-1 group">
                                    <button 
                                        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center transition-colors shadow-lg"
                                        title="Share"
                                    >
                                        <Share2 size={28} className="text-white group-hover:scale-110 transition-transform" />
                                    </button>
                                    <span className="text-[11px] font-bold text-white tracking-tight drop-shadow-md">Share</span>
                                </div>

                                <div className="flex flex-col items-center gap-1 group">
                                    <button 
                                        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl flex items-center justify-center transition-colors shadow-lg"
                                        title="More Options"
                                    >
                                        <MoreVertical size={28} className="text-white group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>

                                {/* Audio Pivot - YT Style */}
                                <motion.div 
                                    animate={{ rotate: 360 }} 
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-10 h-10 mt-4 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black"
                                >
                                    <img src={short.profiles?.avatar_url || ''} className="w-full h-full object-cover" alt="Audio track" />
                                </motion.div>
                            </div>

                            {/* Bottom Info - YouTube Layout */}
                            <div className="absolute bottom-6 left-4 right-16 z-20">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <Link href={`/profile/${short.profiles?.username}`} className="flex items-center gap-2 group">
                                            <img
                                                src={short.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${short.profiles?.username}`}
                                                alt={short.profiles?.username || ''}
                                                className="w-10 h-10 rounded-full border border-white/10 object-cover shadow-lg"
                                            />
                                            <span className="font-black text-sm tracking-tight drop-shadow-lg">
                                                @{short.profiles?.username || 'unknown'}
                                            </span>
                                        </Link>
                                        <button className="px-4 py-1.5 bg-white text-black text-xs font-black rounded-full hover:bg-white/90 transition-all active:scale-95 shadow-lg">
                                            Subscribe
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-white leading-tight drop-shadow-lg line-clamp-2 max-w-[85%]">
                                            {short.title}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FFB800] drop-shadow-lg">
                                            <Music2 size={12} />
                                            <span>Original Audio • {short.profiles?.username}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                ))}
            </AnimatePresence>
        </div>
    );
}

function formatCountDiscarded(count: number) {
    return formatViews(count);
}

function ActionBtn({ icon, label, title }: { icon: React.ReactNode; label: string | number; title: string }) {
    return (
        <button className="flex flex-col items-center gap-1 text-white" aria-label={title} title={title}>
            <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center border border-white/5 hover:bg-white/30 transition-colors">
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest drop-shadow-md">{label}</span>
        </button>
    );
}
