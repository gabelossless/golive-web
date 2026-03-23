'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Radio, Loader2, StopCircle, Settings, AlertCircle, Lock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// We import livekit-client dynamically or directly
import { Room, createLocalTracks, LocalTrack } from 'livekit-client';

export default function GoLivePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Just Chatting');
    const [isGated, setIsGated] = useState(false);
    const [price, setPrice] = useState('5.00');
    
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pipeline, setPipeline] = useState<string | null>(null);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    
    // Media & Streaming references
    const videoRef = useRef<HTMLVideoElement>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    
    // LiveKit specific
    const roomRef = useRef<Room | null>(null);
    
    // WHIP (Livepeer) specific
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // Initialize Camera
    useEffect(() => {
        async function initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720, frameRate: 30 },
                    audio: true
                });
                setLocalStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err: any) {
                console.error("Camera error:", err);
                setError("Could not access camera/microphone. Please check permissions.");
            }
        }
        initCamera();

        return () => {
             stopBroadcasting(); // Cleanup on unmount
             if (localStream) {
                 localStream.getTracks().forEach(track => track.stop());
             }
        };
    }, []);

    // Heartbeat mechanism to keep stream alive & check for scale-up
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isBroadcasting && activeVideoId) {
            interval = setInterval(async () => {
                try {
                    // Normally you'd get viewers from LiveKit or Livepeer stats, just mocking scale up possibility
                    const res = await fetch('/api/live/heartbeat', {
                        method: 'POST',
                        body: JSON.stringify({ videoId: activeVideoId, viewerCount: Math.floor(Math.random() * 60) }) // Math.random for demoing scale up
                    });
                    const data = await res.json();
                    
                    if (data.switch_pipeline && data.stream_key) {
                        console.log("🔥 HOT SWAPPING TO LIVEPEER HLS 🔥");
                        // Disconnect old
                        if (roomRef.current) {
                            roomRef.current.disconnect();
                            roomRef.current = null;
                        }
                        
                        // Start WHIP
                        await startWHIPStream(data.stream_key);
                        setPipeline('LIVEPEER_HLS');
                    }

                } catch (err) {
                    console.error("Heartbeat error:", err);
                }
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [isBroadcasting, activeVideoId]);

    const startBroadcasting = async () => {
        if (!user || !title || !localStream) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Create Stream & Get Hybrid Allocation (LiveKit vs Livepeer)
            const res = await fetch('/api/live/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title, 
                    category, 
                    is_gated: isGated, 
                    price: isGated ? parseFloat(price) : 0 
                })
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create stream. Are you Premium?");
            }
            
            const streamData = await res.json();
            setPipeline(streamData.pipeline);
            setActiveVideoId(streamData.id);

            // 2. Connect based on Pipeline Allocation
            if (streamData.pipeline === 'LIVEKIT_SFU') {
                await startLiveKitStream(streamData.id, user.id);
            } else if (streamData.pipeline === 'LIVEPEER_HLS') {
                if (!streamData.stream_key) throw new Error("Missing stream key from Livepeer");
                await startWHIPStream(streamData.stream_key);
            } else {
                throw new Error("Unknown pipeline allocated.");
            }

            setIsBroadcasting(true);
        } catch (err: any) {
            console.error("Broadcast failed:", err);
            setError(err.message || "Failed to start broadcast");
            stopBroadcasting(); // Ensure cleanup
        } finally {
            setLoading(false);
        }
    };

    const startLiveKitStream = async (roomId: string, userId: string) => {
        // Get Token securely
        const tokenRes = await fetch('/api/livekit/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomName: roomId, identity: userId })
        });
        const { token } = await tokenRes.json();
        if (!token) throw new Error("Failed to get LiveKit token");
        
        // Connect to Room
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!livekitUrl) throw new Error("NEXT_PUBLIC_LIVEKIT_URL is not configured.");
        
        const room = new Room();
        await room.connect(livekitUrl, token);
        roomRef.current = room;

        // Publish local tracks
        localStream!.getTracks().forEach(async (track) => {
            // LiveKit expects specific Track types
             await room.localParticipant.publishTrack(track);
        });
    };

    const startWHIPStream = async (streamKey: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnectionRef.current = pc;

        localStream!.getTracks().forEach(track => {
            pc.addTrack(track, localStream!);
        });

        // WHIP handshake
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Standard WHIP endpoint from Livepeer
        const response = await fetch(`https://livepeer.studio/webrtc/ingest/${streamKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/sdp",
            },
            body: offer.sdp
        });

        if (!response.ok) {
            throw new Error(`WHIP error: ${response.status} ${response.statusText}`);
        }

        const answerSdp = await response.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    };

    const stopBroadcasting = async () => {
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        
        // Mark as offline in DB
        if (activeVideoId) {
            await supabase.from('videos').update({ is_live: false }).eq('id', activeVideoId);
        }

        setIsBroadcasting(false);
        setPipeline(null);
        setActiveVideoId(null);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-24 font-sans">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* ── Left: Preview & Stats ─────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 ring-1 ring-white/10 group">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted 
                            className="w-full h-full object-cover transform scale-x-[-1]" // mirror local preview
                        />
                        
                        {/* Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        
                        <div className="absolute top-6 left-6 flex flex-col gap-3">
                            <AnimatePresence>
                                {isBroadcasting && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] border border-red-400/50 backdrop-blur-md"
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                                        LIVE
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isBroadcasting && (
                                <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold border border-white/10 text-zinc-300">
                                    PREVIEW MODE
                                </div>
                            )}

                            {pipeline && (
                                <div className="bg-blue-500/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-blue-500/30 text-blue-300 uppercase tracking-wider w-fit">
                                    Network: {pipeline}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md p-8 text-center z-50">
                                <div className="space-y-4 max-w-md bg-zinc-900/50 border border-red-500/20 p-8 rounded-3xl shadow-2xl">
                                    <AlertCircle size={48} className="text-red-500 mx-auto animate-bounce" />
                                    <h2 className="text-xl font-black uppercase tracking-tight">Stream Error</h2>
                                    <p className="text-zinc-400 text-sm">{error}</p>
                                    <button 
                                        onClick={() => setError(null)} 
                                        className="mt-4 px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats (Placeholder until Realtime integrated) */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 border border-white/5 p-6 rounded-[24px] backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Viewers</p>
                            <p className="text-3xl font-black text-white">{isBroadcasting ? "0" : "-"}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-6 rounded-[24px] backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Status</p>
                            <p className={`text-2xl font-black ${isBroadcasting ? 'text-green-400' : 'text-zinc-600'}`}>
                                {isBroadcasting ? 'HEALTHY' : 'OFFLINE'}
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-6 rounded-[24px] backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Revenue</p>
                            <p className="text-3xl font-black text-white">$0.00</p>
                        </div>
                    </div>
                </div>

                {/* ── Right: Controls ────────────────────────────────────────── */}
                <div className="space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 space-y-8 sticky top-24 shadow-2xl">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
                                <Radio className="text-[#FFB800]" /> 
                                Broadcast Setup
                            </h2>
                            <p className="text-zinc-500 text-sm">Configure your stream parameters.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Stream Title</label>
                                <input 
                                    type="text" 
                                    title="Stream Title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Enter a compelling title..."
                                    className="w-full bg-[#111] border border-white/10 rounded-[20px] px-6 py-4 text-sm font-bold focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800]/50 outline-none transition-all placeholder:text-zinc-600"
                                    disabled={isBroadcasting}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Category</label>
                                <select 
                                    title="Category"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 rounded-[20px] px-6 py-4 text-sm font-bold focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800]/50 outline-none transition-all appearance-none"
                                    disabled={isBroadcasting}
                                >
                                    <option>Just Chatting</option>
                                    <option>Gaming</option>
                                    <option>Music</option>
                                    <option>Education</option>
                                    <option>IRL</option>
                                </select>
                            </div>

                            {/* Monetization Controls */}
                            <div className="p-5 bg-[#111] border border-white/5 rounded-[24px] space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-bold">
                                        <Lock size={16} className={isGated ? 'text-[#FFB800]' : 'text-zinc-500'} />
                                        Paywall Stream
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={isGated}
                                            onChange={(e) => setIsGated(e.target.checked)}
                                            disabled={isBroadcasting}
                                        />
                                        <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFB800]"></div>
                                    </label>
                                </div>

                                <AnimatePresence>
                                    {isGated && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden space-y-2 pt-2"
                                        >
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Unlock Price (USD)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                                <input 
                                                    title="Price"
                                                    type="number"
                                                    min="1.00"
                                                    step="0.50"
                                                    value={price}
                                                    onChange={e => setPrice(e.target.value)}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:border-[#FFB800] outline-none"
                                                    disabled={isBroadcasting}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="pt-4">
                            {isBroadcasting ? (
                                <button 
                                    onClick={stopBroadcasting}
                                    className="w-full py-5 bg-zinc-800 text-white font-black rounded-full text-lg uppercase tracking-widest shadow-xl hover:bg-zinc-700 hover:text-red-400 transition-all flex items-center justify-center gap-3 border border-white/5"
                                >
                                    <StopCircle size={24} /> End Stream
                                </button>
                            ) : (
                                <button 
                                    onClick={startBroadcasting}
                                    disabled={loading || !title || !localStream}
                                    className="w-full py-5 bg-white text-black font-black rounded-full text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                                >
                                    {loading ? <Loader2 size={24} className="animate-spin text-black" /> : <Radio size={24} className="text-red-500" />}
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
