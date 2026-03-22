'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Radio, Loader2, Video, StopCircle, RefreshCw, Cast, Camera, Mic, Settings, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoLivePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Just Chatting');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({ duration: 0, segments: 0 });
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const segmentIndexRef = useRef(0);
    const streamIdRef = useRef<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Camera
    useEffect(() => {
        async function initCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720, frameRate: 30 },
                    audio: true
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err: any) {
                console.error("Camera error:", err);
                setError("Could not access camera/microphone. Please check permissions.");
            }
        }
        initCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startBroadcasting = async () => {
        if (!user || !title || !stream) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Create the Live Video record in Supabase
            const streamId = Math.random().toString(36).substring(7);
            streamIdRef.current = streamId;
            
            const playlistUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/live/${user.id}/${streamId}/index.m3u8`;

            const { data: video, error: dbError } = await supabase
                .from('videos')
                .insert({
                    user_id: user.id,
                    title: title,
                    description: `Live from Zenith! Started at ${new Date().toLocaleTimeString()}`,
                    video_url: playlistUrl,
                    thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${streamId}`,
                    is_live: true,
                    category: category,
                    view_count: 0
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 2. Start MediaRecorder
            // Use fMP4 if possible, fallback to webm
            const options = { mimeType: 'video/webm;codecs=h264' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
            }

            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    const currentIndex = segmentIndexRef.current++;
                    // Push to API
                    fetch(`/api/live/push?userId=${user.id}&streamId=${streamId}&index=${currentIndex}`, {
                        method: 'POST',
                        body: event.data
                    }).catch(err => console.error("Segment push failed:", err));
                    
                    setStats(prev => ({ ...prev, segments: currentIndex + 1 }));
                }
            };

            // Capture every 2 seconds
            recorder.start(2000);
            setIsBroadcasting(true);
            
            // Start duration timer
            timerRef.current = setInterval(() => {
                setStats(prev => ({ ...prev, duration: prev.duration + 1 }));
            }, 1000);

        } catch (err: any) {
            console.error("Broadcast failed:", err);
            setError("Failed to start broadcast: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const stopBroadcasting = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) clearInterval(timerRef.current);
        setIsBroadcasting(false);
        // Optionally update the video record to is_live: false
    };

    const formatDuration = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* ── Left: Preview & Stats ─────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 shadow-2xl group">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted 
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        
                        <div className="absolute top-6 left-6 flex items-center gap-3">
                            <AnimatePresence>
                                {isBroadcasting && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="bg-red-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        LIVE
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold border border-white/10">
                                {isBroadcasting ? formatDuration(stats.duration) : 'PREVIEW'}
                            </div>
                        </div>

                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center">
                                <div className="space-y-4 max-w-sm">
                                    <AlertCircle size={48} className="text-red-500 mx-auto" />
                                    <h2 className="text-xl font-black">Camera Error</h2>
                                    <p className="text-zinc-400 text-sm">{error}</p>
                                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white text-black font-bold rounded-full">Retry</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Segments</p>
                            <p className="text-2xl font-black text-white">{stats.segments}</p>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Health</p>
                            <p className="text-2xl font-black text-green-500">EXCELLENT</p>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Delay</p>
                            <p className="text-2xl font-black text-zinc-400">~4.0s</p>
                        </div>
                    </div>
                </div>

                {/* ── Right: Controls ────────────────────────────────────────── */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-white/10 rounded-[32px] p-8 space-y-8 sticky top-8">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black tracking-tighter uppercase">Broadcast Setup</h2>
                            <p className="text-zinc-500 text-sm">Configure your live parameters.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Stream Title</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Enter a compelling title..."
                                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-[#FFB800] outline-none transition-all placeholder:text-zinc-700"
                                    disabled={isBroadcasting}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Category</label>
                                <select 
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-[#FFB800] outline-none transition-all appearance-none"
                                    disabled={isBroadcasting}
                                    title="Category"
                                >
                                    <option>Just Chatting</option>
                                    <option>Gaming</option>
                                    <option>Music</option>
                                    <option>Education</option>
                                    <option>IRL</option>
                                </select>
                            </div>

                            <div className="p-4 bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-2xl flex gap-3">
                                <Settings className="text-[#FFB800] shrink-0" size={20} />
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-[#FFB800] uppercase tracking-wider">HLS Configuration</p>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed">Optimal segments (2s) will be pushed to Cloudflare R2 automatically.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            {isBroadcasting ? (
                                <button 
                                    onClick={stopBroadcasting}
                                    className="w-full py-5 bg-white text-black font-black rounded-full text-lg uppercase tracking-widest shadow-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3"
                                >
                                    <StopCircle size={24} /> Stop Broadcast
                                </button>
                            ) : (
                                <button 
                                    onClick={startBroadcasting}
                                    disabled={loading || !title || !stream}
                                    className="w-full py-5 bg-[#FFB800] text-black font-black rounded-full text-lg uppercase tracking-widest shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                                >
                                    {loading ? <Loader2 size={24} className="animate-spin" /> : <Radio size={24} />}
                                    Go Live Now
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
