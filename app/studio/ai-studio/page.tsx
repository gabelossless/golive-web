'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { 
    Sparkles, 
    Video, 
    Zap, 
    Scissors, 
    Share2, 
    CheckCircle2, 
    ChevronRight,
    Loader2,
    Play,
    Timer,
    TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

export default function AIStudioPage() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [videos, setVideos] = useState<any[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [moments, setMoments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVideos() {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const { data } = await supabase
                    .from('videos')
                    .select('*')
                    .eq('user_id', user.id)
                    .is('is_short', false)
                    .order('created_at', { ascending: false });
                
                if (data) setVideos(data);
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchVideos();
    }, [user]);

    const handleAnalyze = async () => {
        if (!selectedVideo) return;
        setIsAnalyzing(true);
        
        try {
            // Mock API call to Gemini (Phase 3)
            const res = await fetch('/api/ai-studio/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: selectedVideo.id })
            });
            const data = await res.json();
            
            setMoments(data.moments || []);
            setStep(2);
        } catch (err) {
            console.error('Analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const [isClipping, setIsClipping] = useState(false);

    const handleClip = async (moment: any) => {
        if (!selectedVideo || isClipping) return;
        setIsClipping(true);
        try {
            const res = await fetch('/api/ai-studio/clip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId: selectedVideo.id,
                    startTime: moment.start,
                    duration: 15, // Default for now, could be dynamic
                    title: selectedVideo.title
                })
            });
            if (res.ok) setStep(3);
        } catch (err) {
            console.error('Clipping failed:', err);
        } finally {
            setIsClipping(false);
        }
    };

    if (loading) return (
        <div className="p-20 text-center flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <Loader2 className="animate-spin text-[#FFB800]" size={48} />
            <div className="text-[#FFB800] animate-pulse font-black uppercase tracking-widest text-sm">Initializing AI Engine...</div>
        </div>
    );

    if (!user) return (
        <div className="p-20 text-center flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-500 border border-white/10">
                <Video size={36} />
            </div>
            <div className="space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Login Required</h2>
                <p className="text-gray-500 max-w-sm mx-auto">Please login to access the AI Studio and start clipping your viral moments.</p>
            </div>
            <Link href="/login" className="px-12 py-4 bg-[#FFB800] text-black rounded-full font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-[#FFB800]/20 hover:scale-105 transition-all">
                Login to Studio
            </Link>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-12 min-h-[80vh] flex flex-col items-center">
            {/* Header */}
            <div className="text-center space-y-4 mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFB800]/10 text-[#FFB800] rounded-full text-xs font-black uppercase tracking-widest border border-[#FFB800]/20">
                    <Sparkles size={14} /> AI Studio Early Access
                </div>
                <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter m-0">Go Viral <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-[#FF8A00]">Faster</span></h1>
                <p className="text-gray-500 font-medium text-lg max-w-xl mx-auto">Our AI analyzes your videos to find high-energy moments and automatically clips them into viral Shorts.</p>
            </div>

            {/* Stepper */}
            <div className="w-full flex items-center justify-center gap-4 mb-12">
                <StepIndicator num={1} label="Select Video" active={step >= 1} current={step === 1} />
                <div className={`h-[2px] w-12 rounded-full ${step >= 2 ? 'bg-[#FFB800]' : 'bg-white/10'}`} />
                <StepIndicator num={2} label="Pick Moments" active={step >= 2} current={step === 2} />
                <div className={`h-[2px] w-12 rounded-full ${step >= 3 ? 'bg-[#FFB800]' : 'bg-white/10'}`} />
                <StepIndicator num={3} label="Clip & Post" active={step >= 3} current={step === 3} />
            </div>

            {/* Content Cards */}
            <div className="w-full bg-[#111111] rounded-[40px] border border-white/5 p-8 md:p-12 shadow-3xl relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {videos.map(video => (
                                    <div 
                                        key={video.id}
                                        onClick={() => setSelectedVideo(video)}
                                        className={`group relative aspect-video rounded-3xl overflow-hidden cursor-pointer border-2 transition-all ${
                                            selectedVideo?.id === video.id ? 'border-[#FFB800] scale-[1.02]' : 'border-white/5 grayscale group-hover:grayscale-0'
                                        }`}
                                    >
                                        <img src={video.thumbnail_url || 'https://images.unsplash.com/photo-1492691523567-6170f0275df1?q=80&w=2670'} className="w-full h-full object-cover" alt="" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play className="text-white fill-white" size={32} />
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-xs font-bold truncate">{video.title}</p>
                                        </div>
                                    </div>
                                ))}
                                {videos.length === 0 && (
                                    <div className="col-span-full py-20 text-center space-y-4 opacity-50">
                                        <Video size={48} className="mx-auto" />
                                        <p className="font-bold">No long-form videos found.</p>
                                        <Link href="/upload" className="text-[#FFB800] hover:underline font-black uppercase text-xs">Upload something first</Link>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!selectedVideo || isAnalyzing}
                                    className="px-12 py-4 bg-[#FFB800] hover:bg-[#FFB800]/90 text-black rounded-full font-black uppercase tracking-[0.2em] text-sm flex items-center gap-3 transition-all disabled:opacity-50 disabled:grayscale shadow-2xl shadow-[#FFB800]/40 group"
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <Zap size={18} className="group-hover:animate-pulse" />}
                                    {isAnalyzing ? 'Analyzing with AI...' : 'Analyze for Viral Moments'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <h2 className="text-2xl font-black uppercase tracking-tight text-center">We found {moments.length} Viral Moments</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {moments.map((moment, idx) => (
                                    <div key={idx} className="bg-black/60 p-6 rounded-3xl border border-white/10 space-y-4 border-l-4 border-l-[#FFB800]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[#FFB800] font-black italic text-sm">
                                                <TrendingUp size={16} /> Viral Score: {moment.score}%
                                            </div>
                                            <div className="text-xs font-bold text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                                                {moment.start} - {moment.end}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-300 font-medium leading-relaxed italic">"{moment.reason}"</p>
                                        <button 
                                            onClick={() => handleClip(moment)}
                                            disabled={isClipping}
                                            className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-[#FFB800] border border-white/10 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
                                        >
                                            {isClipping ? <Loader2 size={14} className="animate-spin" /> : <Scissors size={14} className="group-hover:rotate-12 transition-transform" />}
                                            {isClipping ? 'Clipping Video...' : 'Clip & Post Short'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center py-12 text-center space-y-6"
                        >
                            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border-4 border-green-500/20">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black uppercase tracking-tight">Short Published!</h2>
                                <p className="text-gray-500">Your AI-generated short is now live on Zenith.</p>
                            </div>
                            <div className="flex gap-4 pt-8">
                                <Link href="/shorts" className="px-8 py-3 bg-[#FFB800] text-black font-black uppercase text-xs rounded-full">View Feed</Link>
                                <button onClick={() => setStep(1)} className="px-8 py-3 bg-white/5 text-white font-black uppercase text-xs rounded-full border border-white/10">Analyze More</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function StepIndicator({ num, label, active, current }: { num: number, label: string, active: boolean, current: boolean }) {
    return (
        <div className={`flex items-center gap-3 transition-colors ${active ? 'text-white' : 'text-white/20'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                current ? 'bg-[#FFB800] text-black border-[#FFB800] scale-110 shadow-lg shadow-[#FFB800]/30' : 
                active ? 'bg-white/20 text-white border-transparent' : 'bg-transparent border-white/10'
            }`}>
                {num}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${current ? 'text-[#FFB800]' : ''}`}>{label}</span>
        </div>
    );
}
