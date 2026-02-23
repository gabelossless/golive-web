'use client';

import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, MoreVertical, BarChart2, Image as ImageIcon } from 'lucide-react';

const mockPosts = [
    {
        id: 1,
        author: 'FragMaster Pro',
        avatar: 'https://i.pravatar.cc/150?u=frag',
        time: '2 hours ago',
        text: 'What game should I play for the charity stream next week? 🎮',
        type: 'poll',
        pollOptions: [
            { label: 'Valorant', votes: 45 },
            { label: 'Elden Ring', votes: 30 },
            { label: 'Minecraft Hardcore', votes: 25 },
        ],
        totalVotes: 1250,
        likes: 450,
        comments: 120,
    },
    {
        id: 2,
        author: 'FragMaster Pro',
        avatar: 'https://i.pravatar.cc/150?u=frag',
        time: '1 day ago',
        text: 'New setup is finally complete! Here is a sneak peek before the full tour video drops tomorrow. 🖥️✨',
        type: 'image',
        image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=2642&auto=format&fit=crop',
        likes: '2.5K',
        comments: 340,
    },
    {
        id: 3,
        author: 'FragMaster Pro',
        avatar: 'https://i.pravatar.cc/150?u=frag',
        time: '3 days ago',
        text: 'Just wanted to say thank you to everyone who tuned in to the tournament. We didn\'t win, but the support was incredible. You guys are the best community ever. ❤️',
        type: 'text',
        likes: '10K',
        comments: 890,
    }
];

export default function CommunityTab() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Create Post Input (Owner only mock) */}
            <div className="bg-surface border border-border rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img src="https://i.pravatar.cc/150?u=frag" alt="Me" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-3">
                    <input
                        type="text"
                        placeholder="Post an update to your fans..."
                        className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-surface-hover rounded-full text-muted transition-colors"><ImageIcon size={20} /></button>
                            <button className="p-2 hover:bg-surface-hover rounded-full text-muted transition-colors"><BarChart2 size={20} /></button>
                        </div>
                        <button className="btn btn-primary px-4 py-1.5 rounded-full text-xs font-bold">Post</button>
                    </div>
                </div>
            </div>

            {/* Posts Feed */}
            {mockPosts.map((post) => (
                <div key={post.id} className="bg-surface border border-border rounded-xl p-4 md:p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">{post.author}</h3>
                                <p className="text-xs text-muted font-medium">{post.time}</p>
                            </div>
                        </div>
                        <button className="text-muted hover:text-foreground p-1"><MoreVertical size={18} /></button>
                    </div>

                    {/* Content */}
                    <p className="text-sm md:text-base leading-relaxed">{post.text}</p>

                    {post.type === 'image' && (
                        <div className="rounded-lg overflow-hidden border border-border/50">
                            <img src={post.image} alt="Post" className="w-full h-auto max-h-[500px] object-cover" />
                        </div>
                    )}

                    {post.type === 'poll' && post.pollOptions && (
                        <div className="space-y-2 mt-2">
                            {post.pollOptions.map((option, i) => (
                                <button key={i} className="relative w-full text-left p-3 rounded-lg border border-border/50 hover:bg-surface-hover/50 transition-all overflow-hidden group">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-1000"
                                        style={{ width: `${(option.votes / 100) * 100}%` }}
                                    />
                                    <div className="relative flex justify-between items-center px-2">
                                        <span className="text-sm font-medium">{option.label}</span>
                                        <span className="text-xs font-bold text-muted">{option.votes}%</span>
                                    </div>
                                </button>
                            ))}
                            <p className="text-xs text-muted font-medium mt-2">{post.totalVotes} votes</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-6 pt-2">
                        <button className="flex items-center gap-2 text-muted hover:text-primary transition-colors">
                            <ThumbsUp size={18} />
                            <span className="text-xs font-bold">{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 text-muted hover:text-primary transition-colors">
                            <MessageSquare size={18} />
                            <span className="text-xs font-bold">{post.comments}</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
