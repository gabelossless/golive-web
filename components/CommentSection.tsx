'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Loader2, SendHorizontal, SortDesc, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        username: string;
        avatar_url: string;
    };
}

interface CommentSectionProps {
    videoId: string;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        fetchComments();

        // Realtime subscription for new comments
        const subscription = supabase
            .channel(`comments:${videoId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `video_id=eq.${videoId}` }, () => {
                fetchComments();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, [videoId]);

    const fetchComments = async () => {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*, profiles(username, avatar_url)')
                .eq('video_id', videoId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Normalize profiles
            const formatted = (data || []).map(c => ({
                ...c,
                profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
            }));

            setComments(formatted);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!user || !newComment.trim()) return;
        setIsPosting(true);

        try {
            const { error } = await supabase.from('comments').insert({
                video_id: videoId,
                user_id: user.id,
                content: newComment
            });

            if (error) throw error;
            setNewComment('');
        } catch (err) {
            console.error('Error posting comment:', err);
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeleteComment = async (id: string) => {
        if (!confirm('Delete this comment?')) return;
        try {
            const { error } = await supabase.from('comments').delete().eq('id', id);
            if (error) throw error;
            // Optimistic update handled by realtime or fetch
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    return (
        <div className="pt-6">
            <div className="flex items-center gap-4 mb-6">
                <h3 className="text-lg font-black">{comments.length} Comments</h3>
                <div className="flex items-center gap-2 text-sm font-bold text-muted cursor-pointer hover:text-foreground">
                    <SortDesc size={18} /> Sort by
                </div>
            </div>

            {/* Add Comment */}
            <div className="flex gap-4 mb-8">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-surface">
                    {user ? (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user.email?.[0].toUpperCase()}
                        </div>
                    ) : (
                        <div className="w-full h-full bg-surface-hover" />
                    )}
                </div>
                <div className="flex-1">
                    {user ? (
                        <>
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-primary transition-colors mb-2"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handlePostComment}
                                    disabled={!newComment.trim() || isPosting}
                                    className="btn btn-primary px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isPosting ? <Loader2 size={14} className="animate-spin" /> : 'Comment'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="bg-surface/50 p-4 rounded-lg text-sm text-center border border-border/30">
                            <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link> to post a comment.
                        </div>
                    )}
                </div>
            </div>

            {/* Comment List */}
            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted" /></div>
            ) : (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 group">
                            <Link href={`/profile/${comment.profiles?.username}`} className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 ring-primary transition-all">
                                <img
                                    src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles?.username}`}
                                    alt={comment.profiles?.username}
                                    className="w-full h-full object-cover"
                                />
                            </Link>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/profile/${comment.profiles?.username}`} className="text-xs font-bold hover:text-primary cursor-pointer transition-colors">
                                            {comment.profiles?.username}
                                        </Link>
                                        <span className="text-[10px] text-muted">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {user?.id === comment.user_id && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-destructive transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                <div className="flex items-center gap-4 mt-1">
                                    <button className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors group">
                                        <ThumbsUp size={14} className="group-hover:scale-110 transition-transform" /> <span className="text-xs font-bold">0</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors group">
                                        <ThumbsDown size={14} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button className="text-xs font-bold text-muted hover:text-foreground">Reply</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
