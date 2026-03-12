'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronLeft, Film, Clock, Zap, Scissors, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

interface ViralMoment {
    startSec: number;
    endSec: number;
    reason: string;
    viralScore: number;
}

interface VideoOption {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration: number | null;
}

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AIStudioPage() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<VideoOption[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [step, setStep] = useState<'select' | 'analyzing' | 'results' | 'clipping' | 'done'>('select');
    const [moments, setMoments] = useState<ViralMoment[]>([]);
    const [selectedMoment, setSelectedMoment] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [newShortId, setNewShortId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        supabase.from('videos').select('id, title, thumbnail_url, duration')
            .eq('user_id', user.id).order('created_at', { ascending: false })
            .then(({ data }) => setVideos(data || []));
    }, [user]);

    const handleAnalyze = async () => {
        if (!selectedId) return;
        setStep('analyzing');
        setError(null);
        try {
            const res = await fetch('/api/ai-studio/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: selectedId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Analysis failed');
            setMoments(data.moments);
            setStep('results');
        } catch (e: any) {
            setError(e.message);
            setStep('select');
        }
    };

    const handleClip = async () => {
        if (selectedMoment === null) return;
        const moment = moments[selectedMoment];
        setStep('clipping');
        setError(null);
        try {
            const res = await fetch('/api/ai-studio/clip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: selectedId, startSec: moment.startSec, endSec: moment.endSec }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Clipping failed');
            setNewShortId(data.shortId);
            setStep('done');
        } catch (e: any) {
            setError(e.message);
            setStep('results');
        }
    };

    const selectedVideo = videos.find(v => v.id === selectedId);

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <Link href="/studio/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-6">
                    <ChevronLeft size={16} /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFB800]/30 to-purple-500/30 flex items-center justify-center">
                        <Sparkles size={20} className="text-[#FFB800]" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">AI Studio</h1>
                    <span className="text-[10px] bg-[#FFB800]/20 text-[#FFB800] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
                </div>
                <p className="text-sm text-gray-400">AI automatically finds your most viral-worthy moments and clips them into a Short — powered by Gemini 2.5 Flash.</p>
            </div>

            {/* Step Progress */}
            <div className="flex items-center gap-2 mb-8">
                {['Select', 'Analyze', 'Clip'].map((label, i) => {
                    const activeStep = step === 'select' ? 0 : step === 'analyzing' || step === 'results' ? 1 : 2;
                    return (
                        <React.Fragment key={label}>
                            <div className={cn("flex items-center gap-1.5 text-xs font-bold",
                                i <= activeStep ? "text-[#FFB800]" : "text-gray-600")}>
                                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px]",
                                    i < activeStep ? "bg-[#FFB800] border-[#FFB800] text-black" :
                                        i === activeStep ? "border-[#FFB800] text-[#FFB800]" : "border-gray-700 text-gray-600")}>
                                    {i < activeStep ? '✓' : i + 1}
                                </div>
                                {label}
                            </div>
                            {i < 2 && <div className={cn("flex-1 h-px", i < activeStep ? "bg-[#FFB800]/50" : "bg-white/10")} />}
                        </React.Fragment>
                    );
                })}
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            <AnimatePresence mode="wait">
                {/* Step 1: Select Video */}
                {step === 'select' && (
                    <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="space-y-4">
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                            <h2 className="font-bold text-base">Choose a video to analyze</h2>
                            {videos.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Film size={32} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No videos uploaded yet.</p>
                                    <Link href="/upload" className="mt-3 inline-block text-[#FFB800] text-sm font-bold hover:underline">Upload your first video →</Link>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
                                    {videos.map(video => (
                                        <button key={video.id} onClick={() => setSelectedId(video.id)}
                                            className={cn("w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                selectedId === video.id
                                                    ? "border-[#FFB800] bg-[#FFB800]/10"
                                                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]")}>
                                            <div className="w-16 aspect-video rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                                {video.thumbnail_url
                                                    ? <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center text-gray-600">🎬</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold line-clamp-1 text-gray-200">{video.title || 'Untitled'}</p>
                                                {video.duration && (
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Clock size={11} /> {formatTime(video.duration)}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedId === video.id && <CheckCircle2 size={18} className="text-[#FFB800] flex-shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={handleAnalyze} disabled={!selectedId}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#FFB800] text-black font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FFB800]/90 transition-colors">
                            <Sparkles size={18} /> Analyze for Viral Moments
                        </button>
                    </motion.div>
                )}

                {/* Step 2: Analyzing */}
                {step === 'analyzing' && (
                    <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-[#FFB800]/20 border-t-[#FFB800] animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles size={24} className="text-[#FFB800] animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Analyzing your video...</h2>
                            <p className="text-gray-400 text-sm mt-2">Gemini AI is scanning every frame for viral moments.</p>
                            <p className="text-gray-600 text-xs mt-1">This usually takes 10–30 seconds.</p>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Results */}
                {step === 'results' && (
                    <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="space-y-4">
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-base">Viral Moments Detected</h2>
                                <span className="text-xs text-gray-500">{moments.length} moments found</span>
                            </div>
                            <div className="space-y-3">
                                {moments.map((m, i) => (
                                    <button key={i} onClick={() => setSelectedMoment(i)}
                                        className={cn("w-full text-left p-4 rounded-xl border transition-all",
                                            selectedMoment === i
                                                ? "border-[#FFB800] bg-[#FFB800]/10"
                                                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]")}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Clock size={13} className="text-gray-400" />
                                                <span className="text-sm font-bold text-[#FFB800]">{formatTime(m.startSec)} → {formatTime(m.endSec)}</span>
                                                <span className="text-xs text-gray-500">({m.endSec - m.startSec}s)</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Zap size={12} className="text-[#FFB800]" />
                                                <span className="text-xs font-black text-[#FFB800]">{Math.round(m.viralScore * 100)}%</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">{m.reason}</p>
                                        {selectedMoment === i && (
                                            <div className="mt-2 flex items-center gap-1 text-[#FFB800] text-xs font-bold">
                                                <CheckCircle2 size={12} /> Selected for clipping
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleClip} disabled={selectedMoment === null}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#FFB800] text-black font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FFB800]/90 transition-colors">
                            <Scissors size={18} /> Clip & Post as Short
                        </button>
                        <button onClick={() => { setStep('select'); setMoments([]); setSelectedMoment(null); }}
                            className="w-full py-3 text-gray-400 text-sm font-medium hover:text-white transition-colors">
                            ← Start Over
                        </button>
                    </motion.div>
                )}

                {/* Clipping */}
                {step === 'clipping' && (
                    <motion.div key="clipping" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Scissors size={24} className="text-purple-400 animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Clipping your Short...</h2>
                            <p className="text-gray-400 text-sm mt-2">Trimming and uploading your new Short to the platform.</p>
                        </div>
                    </motion.div>
                )}

                {/* Done */}
                {step === 'done' && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-16 gap-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                            <CheckCircle2 size={40} className="text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Your Short is Live! 🎉</h2>
                            <p className="text-gray-400 text-sm mt-2">Your AI-generated Short has been published to the platform.</p>
                        </div>
                        <div className="flex gap-3">
                            {newShortId && (
                                <Link href={`/watch/${newShortId}`}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FFB800] text-black font-bold rounded-full text-sm hover:bg-[#FFB800]/90 transition-colors">
                                    View Short <ArrowRight size={16} />
                                </Link>
                            )}
                            <button onClick={() => { setStep('select'); setSelectedId(''); setMoments([]); setSelectedMoment(null); setNewShortId(null); }}
                                className="px-5 py-2.5 bg-white/5 text-white font-bold rounded-full text-sm hover:bg-white/10 transition-colors border border-white/10">
                                Make Another
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
