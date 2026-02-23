'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Send, User, Heart, Share2, MoreVertical, Radio, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function LiveWatchPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [video, setVideo] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Initial Fetch
    useEffect(() => {
        fetchVideoDetails();
        fetchChatHistory();

        // Subscribe to real-time chat
        const channel = supabase
            .channel(`live_chat:${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'live_chat_messages',
                filter: `video_id=eq.${id}`
            }, (payload) => {
                // Fetch the user profile for the new message to display name/avatar
                fetchMessageAuthor(payload.new);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const fetchVideoDetails = async () => {
        const { data } = await supabase
            .from('videos')
            .select(`*, profiles(*)`)
            .eq('id', id)
            .single();
        if (data) setVideo(data);
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
        setNewMessage(''); // Optimistic clear

        await supabase.from('live_chat_messages').insert({
            video_id: id,
            user_id: user.id,
            content: content
        });
    };

    if (!video) return <div className="h-screen flex items-center justify-center text-muted">Loading Broadcast...</div>;

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col md:flex-row bg-[#000]">
            {/* Video Player Area */}
            <div className="flex-1 flex flex-col relative group">
                <div className="flex-1 bg-black relative flex items-center justify-center">
                    {/* Simulated Live Stream Player */}
                    <video
                        src={video.video_url}
                        className="w-full h-full object-contain max-h-[calc(100vh-140px)]"
                        autoPlay
                        controls
                        loop
                    />

                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <Radio size={12} className="animate-pulse" /> Live
                        </div>
                        <div className="bg-black/60 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 backdrop-blur-md">
                            <User size={12} /> 12,402
                        </div>
                    </div>
                </div>

                {/* Stream Info (Below Video) */}
                <div className="bg-background border-b border-border p-4 md:p-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold line-clamp-1">{video.title}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <Link href={`/profile/${video.profiles.username}`} className="flex items-center gap-2 group">
                                <img src={video.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.profiles.username}`} className="w-10 h-10 rounded-full bg-surface" />
                                <div>
                                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{video.profiles.username}</p>
                                    <p className="text-xs text-muted">Streaming {video.category}</p>
                                </div>
                            </Link>
                            <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold transition-colors ml-4">
                                Follow
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-surface rounded-full transition-colors text-muted hover:text-primary">
                            <Share2 size={20} />
                        </button>
                        <button className="p-2 hover:bg-surface rounded-full transition-colors text-muted hover:text-primary">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Live Chat Sidebar */}
            <div className="w-full md:w-[350px] lg:w-[400px] bg-surface border-l border-border flex flex-col h-[40vh] md:h-auto">
                <div className="p-3 border-b border-border flex items-center justify-between bg-surface z-10">
                    <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare size={16} /> Stream Chat
                    </h3>
                </div>

                {/* Messages Area */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                >
                    {chatMessages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-2 text-sm animate-in fade-in slide-in-from-left-1 duration-200">
                            <span className="font-bold text-muted-foreground whitespace-nowrap opacity-50 text-xs mt-0.5">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="break-words leading-tight">
                                <span className="font-bold text-[var(--color-primary)] mr-2 cursor-pointer hover:underline">
                                    {msg.profiles?.username}:
                                </span>
                                <span className="text-foreground/90">{msg.content}</span>
                            </div>
                        </div>
                    ))}

                    {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-muted opacity-50">
                            <p>Welcome to the chat room!</p>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-background border-t border-border">
                    {user ? (
                        <form onSubmit={handleSendMessage} className="relative">
                            <input
                                type="text"
                                placeholder="Send a message..."
                                className="w-full bg-surface border border-border rounded-full pl-4 pr-12 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="absolute right-1 top-1 p-1.5 bg-primary text-primary-foreground rounded-full hover:scale-105 transition-all disabled:opacity-0 disabled:scale-0"
                            >
                                <Send size={14} />
                            </button>
                        </form>
                    ) : (
                        <div className="text-center text-xs text-muted">
                            <Link href="/login" className="text-primary hover:underline font-bold">Sign in</Link> to chat
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
