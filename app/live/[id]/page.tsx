'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Send, User, Share2, MoreVertical, Radio, MessageSquare, DollarSign, Lock, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getGhostAvatar } from '@/lib/image-utils';
import { Room, RemoteVideoTrack, RemoteAudioTrack, RoomEvent } from 'livekit-client';

export default function LiveWatchPage() {
    const { id } = useParams();
    const { user } = useAuth();
    
    // Video & Access State
    const [video, setVideo] = useState<any>(null);
    const [hasAccess, setHasAccess] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Chat State
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // LiveKit State
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const roomRef = useRef<Room | null>(null);

    useEffect(() => {
        if (!id) return;
        initializeView();
        
        // Subscription
        const channel = supabase
            .channel(`live_status:${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'live_chat_messages',
                filter: `video_id=eq.${id}`
            }, (payload) => {
                fetchMessageAuthor(payload.new);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'videos',
                filter: `id=eq.${id}`
            }, (payload) => {
                // If pipeline changed to LIVEPEER_HLS, we hot swap the player
                if (payload.new.pipeline === 'LIVEPEER_HLS' && payload.old.pipeline !== 'LIVEPEER_HLS') {
                    console.log("🔥 Stream Upgraded to HLS 🔥");
                    setVideo((prev: any) => ({...prev, ...payload.new}));
                    if (roomRef.current) {
                        roomRef.current.disconnect(); 
                        roomRef.current = null;
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (roomRef.current) roomRef.current.disconnect();
        };
    }, [id]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const initializeView = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Video Metadata
            const { data: videoData, error: videoError } = await supabase
                .from('videos')
                .select('*, profiles(*)')
                .eq('id', id)
                .single();
                
            if (videoError) throw videoError;
            setVideo(videoData);

            // 2. Check Access (Paywall)
            if (videoData.is_gated) {
                const res = await fetch(`/api/live/check-access?videoId=${id}`);
                const { hasAccess } = await res.json();
                setHasAccess(hasAccess);
                
                if (!hasAccess) {
                    setIsLoading(false);
                    return; // Stop here if no access, show paywall
                }
            }

            // 3. Connect to Stream based on Pipeline
            await setupStream(videoData);
            
            // 4. Fetch initial chat history
            fetchChatHistory();

        } catch (err: any) {
            console.error(err);
            setError("Failed to load stream details");
        } finally {
            setIsLoading(false);
        }
    };

    const setupStream = async (videoData: any) => {
        if (videoData.pipeline === 'LIVEKIT_SFU') {
             // Fetch token for viewer
             const tokenRes = await fetch('/api/livekit/token', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ roomName: videoData.id, identity: user ? user.id : 'anonymous_' + Math.random().toString(36).substring(7) })
             });
             const { token } = await tokenRes.json();
             
             if (token) {
                 const room = new Room();
                 await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL || '', token, { autoSubscribe: true });
                 roomRef.current = room;

                 // Attach tracks when they subscribe
                 room.on(RoomEvent.TrackSubscribed, (track: any, publication: any, participant: any) => {
                     if (track.kind === 'video' && videoRef.current) {
                         (track as RemoteVideoTrack).attach(videoRef.current);
                     }
                     if (track.kind === 'audio' && audioRef.current) {
                         (track as RemoteAudioTrack).attach(audioRef.current);
                     }
                 });
             }
        } else if (videoData.pipeline === 'LIVEPEER_HLS') {
             // For HLS, we rely on native video element src if supported (Safari/Edge). 
             // In a full production app, you'd initialize hls.js here.
             console.log("Playing HLS from Livepeer:", videoData.video_url);
        }
    };

    const fetchChatHistory = async () => {
        const { data } = await supabase
            .from('live_chat_messages')
            .select(`*, profiles(username, avatar_url)`)
            .eq('video_id', id)
            .order('created_at', { ascending: true })
            .limit(100);

        if (data) setChatMessages(data);
    };

    const fetchMessageAuthor = async (newMessageRow: any) => {
        const { data } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newMessageRow.user_id)
            .single();

        if (data) {
            const fullMessage = { ...newMessageRow, profiles: data };
            setChatMessages(prev => [...prev, fullMessage]);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newMessage.trim()) return;

        const content = newMessage;
        setNewMessage(''); 

        await supabase.from('live_chat_messages').insert({
            video_id: id,
            user_id: user.id,
            content: content
        });
    };

    const handlePurchaseAccess = async () => {
        // Quick Mock Purchase Handler
        if (!user) {
            alert("Please sign in to purchase access");
            return;
        }

        // Normally, redirect to Stripe/PayPal here. For this demo, we directly grant access in DB.
        const { error } = await supabase.from('stream_access').insert({
            video_id: id,
            user_id: user.id,
            access_type: 'PPV'
        });
        
        // Record Transaction
        await supabase.from('transactions').insert({
            user_id: user.id,
            creator_id: video?.user_id,
            amount: video?.price || 0,
            currency: 'USD',
            transaction_type: 'PPV_PURCHASE',
            status: 'COMPLETED'
        });

        if (!error) {
            alert("Access unlocked!");
            window.location.reload();
        }
    };

    const handleTip = async () => {
        if (!user) return alert("Sign in to tip!");
        const amt = parseFloat(prompt("Enter tip amount ($):") || "0");
        if (amt > 0) {
            await supabase.from('transactions').insert({
                user_id: user.id,
                creator_id: video?.user_id,
                amount: amt,
                currency: 'USD',
                transaction_type: 'TIP',
                status: 'COMPLETED'
            });
            alert(`Tipped $${amt.toFixed(2)}!`);
            handleSendMessage({ preventDefault: () => {} } as any); // Send a fake chat ping maybe
            
            // Add a special chat message for the tip
            await supabase.from('live_chat_messages').insert({
                 video_id: id,
                 user_id: user.id,
                 content: `💎 Supported with a $${amt.toFixed(2)} tip!`
            });
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin text-[#FFB800]" size={48} /></div>;
    if (error || !video) return <div className="h-screen flex items-center justify-center bg-black text-white">{error || "Stream not found"}</div>;

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col md:flex-row bg-[#050505] text-white pt-16 font-sans">
            {/* ── Left: Video Player Area ─────────────────────────────── */}
            <div className="flex-1 flex flex-col relative group">
                <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] border-r border-white/5">
                    
                    {!hasAccess ? (
                        /* Paywall View */
                        <div className="absolute inset-0 z-10 flex items-center justify-center p-8 bg-zinc-900/90 backdrop-blur-xl">
                            <div className="max-w-md w-full bg-[#111] p-10 rounded-3xl border border-[#FFB800]/30 shadow-[0_0_50px_rgba(255,184,0,0.15)] text-center space-y-6 transform hover:scale-[1.02] transition-transform">
                                <Lock size={64} className="text-[#FFB800] mx-auto opacity-80" />
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Premium Content</h2>
                                    <p className="text-zinc-400 text-sm leading-relaxed">This exclusive broadcast by <span className="text-white font-bold">{video.profiles.username}</span> requires a digital pass to access.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                                    <span className="text-sm font-bold uppercase tracking-widest text-[#FFB800]">Unlock Price</span>
                                    <span className="text-2xl font-black">${Number(video.price).toFixed(2)}</span>
                                </div>
                                <button 
                                    onClick={handlePurchaseAccess}
                                    className="w-full py-4 bg-[#FFB800] text-black font-black uppercase tracking-widest rounded-full hover:bg-white transition-colors"
                                >
                                    Purchase Pass
                                </button>
                                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mt-4">Secure payment via Web3 / Stripe</p>
                            </div>
                        </div>
                    ) : (
                        /* Hybrid Video Player */
                        video.pipeline === 'LIVEKIT_SFU' ? (
                            <>
                                <video ref={videoRef} className="w-full h-full object-contain bg-black" autoPlay playsInline />
                                <audio ref={audioRef} autoPlay />
                            </>
                        ) : (
                            <video 
                                src={video.video_url} 
                                className="w-full h-full object-contain bg-black" 
                                autoPlay 
                                controls 
                                playsInline 
                                muted // AutoPlay policies
                            />
                        )
                    )}

                    {hasAccess && (
                        <div className="absolute top-6 left-6 flex gap-3 z-20">
                            {video.is_live ? (
                                <div className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-md">
                                    <Radio size={12} className="animate-pulse" /> Live
                                </div>
                            ) : (
                                <div className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                                    Offline
                                </div>
                            )}
                            <div className="bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md border border-white/10">
                                <User size={12} className="text-[#FFB800]" /> {video.viewer_count || 0}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Stream Info Bar ───────────────────────────────────── */}
                <div className="bg-[#0a0a0a] border-t border-white/5 border-r p-6 flex justify-between items-start shrink-0">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">{video.title}</h1>
                        <div className="flex items-center gap-4 mt-3">
                            <Link href={`/profile/${video.profiles.username}`} className="flex items-center gap-3 group">
                                <img src={video.profiles.avatar_url || getGhostAvatar()} className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-[#FFB800] transition-colors bg-zinc-800 object-cover" />
                                <div>
                                    <p className="font-bold text-base text-zinc-100 group-hover:text-white">{video.profiles.username}</p>
                                    <p className="text-xs text-[#FFB800] uppercase tracking-widest font-bold">Streaming {video.category}</p>
                                </div>
                            </Link>
                            <button className="bg-white/10 hover:bg-white text-white hover:text-black px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ml-4">
                                Subscribe
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        {hasAccess && (
                            <button 
                                onClick={handleTip}
                                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            >
                                <DollarSign size={16} /> Send Tip
                            </button>
                        )}
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
                            <Heart size={18} />
                        </button>
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Right: Live Chat Sidebar ────────────────────────────── */}
            <div className="w-full md:w-[380px] bg-[#111] border-l border-white/5 flex flex-col h-[40vh] md:h-auto z-10">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#111]">
                    <h3 className="font-black text-xs uppercase tracking-widest text-[#FFB800] flex items-center gap-2">
                        <MessageSquare size={16} /> Live Chat
                    </h3>
                </div>

                {/* Messages Area */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800"
                >
                    {chatMessages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                            <img src={msg.profiles?.avatar_url || getGhostAvatar()} alt="avatar" className="w-6 h-6 rounded-full shrink-0 opacity-80" />
                            <div className="break-words leading-tight flex-1">
                                <span className={`font-bold mr-2 text-sm ${msg.content.includes('💎') ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                    {msg.profiles?.username}
                                </span>
                                <span className={`text-sm ${msg.content.includes('💎') ? 'font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded-md' : 'text-zinc-400'}`}>
                                    {msg.content}
                                </span>
                            </div>
                        </div>
                    ))}

                    {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                            <MessageSquare size={32} className="opacity-20" />
                            <p className="text-xs uppercase tracking-widest font-bold">Chat is quiet</p>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#0a0a0a] border-t border-white/5">
                    {user ? (
                        <form onSubmit={handleSendMessage} className="relative">
                            <input
                                type="text"
                                placeholder={hasAccess ? "Send a message..." : "Unlock to chat..."}
                                disabled={!hasAccess}
                                className="w-full bg-[#111] border border-white/10 rounded-full pl-5 pr-12 py-3 text-sm focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800]/20 outline-none transition-all text-white placeholder:text-zinc-600 disabled:opacity-50"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || !hasAccess}
                                className="absolute right-1 top-1 p-2 bg-[#FFB800] text-black rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-0"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    ) : (
                        <div className="text-center text-xs text-zinc-500 bg-[#111] py-4 rounded-xl border border-white/5">
                            <Link href="/login" className="text-[#FFB800] hover:underline font-bold mr-1">Sign in</Link> 
                            to join the conversation
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
