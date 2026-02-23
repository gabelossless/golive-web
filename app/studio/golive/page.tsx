'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Radio, Loader2, Video, StopCircle, RefreshCw, Cast } from 'lucide-react';

export default function GoLivePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Just Chatting');
    const [loading, setLoading] = useState(false);
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Mock accessing camera for "Preview"
    useEffect(() => {
        const startCamera = async () => {
            try {
                // In a real app we'd request camera, but for this demo maybe just show a placeholder 
                // or try to get actual camera if user allows.
                // let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                // setPreviewStream(stream);
                // if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (e) {
                console.log("Camera access not implemented/allowed for this demo.");
            }
        };
        startCamera();

        return () => {
            if (previewStream) {
                previewStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleStartStream = async () => {
        if (!user || !title) return;
        setLoading(true);

        try {
            // 1. Create a "Live" video record
            const { data, error } = await supabase
                .from('videos')
                .insert({
                    user_id: user.id,
                    title: title,
                    description: `Live stream started at ${new Date().toLocaleTimeString()}`,
                    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // Loop/Test stream
                    thumbnail_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${title}`, // Temp thumbnail
                    // is_live: true, // DB Auto-default or column missing
                    // category: category
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Redirect to the live watch page (or stay here in dashboard mode)
            // Ideally we stay here to "Manager" the stream, but for MVP let's go to the watch page
            router.push(`/live/${data.id}`);
        } catch (err) {
            console.error('Error starting stream:', err);
            alert('Failed to go live.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-500/10 rounded-full text-red-500">
                    <Radio size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black">Go Live</h1>
                    <p className="text-muted">Set up your stream and start broadcasting.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Preview Window */}
                <div className="space-y-4">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-border/50 shadow-2xl flex items-center justify-center group">
                        {previewStream ? (
                            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-surface/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                                    <Cast size={40} className="text-white/50" />
                                </div>
                                <p className="text-white/50 font-medium">Camera Preview Unavailable</p>
                            </div>
                        )}

                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            OFFLINE
                        </div>
                    </div>
                    <div className="p-4 bg-surface/30 rounded-xl border border-destructive/20">
                        <h3 className="text-sm font-bold text-destructive flex items-center gap-2 mb-2">
                            <Radio size={16} /> Beta Feature
                        </h3>
                        <p className="text-xs text-muted">
                            Real RTMP streaming is simulated. Your "stream" will play a loop video for viewers.
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-6 bg-surface p-8 rounded-2xl border border-border">
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase text-muted">Stream Title</label>
                        <input
                            type="text"
                            placeholder="e.g., Late Night Rankin' Up!"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold focus:border-primary focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase text-muted">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold focus:border-primary focus:outline-none"
                        >
                            <option>Just Chatting</option>
                            <option>Gaming</option>
                            <option>Music</option>
                            <option>Coding</option>
                            <option>Education</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleStartStream}
                            disabled={loading || !title}
                            className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all ${loading || !title
                                ? 'bg-surface-hover text-muted cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-900/20'
                                }`}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Radio />}
                            START STREAM
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
