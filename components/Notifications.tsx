'use client';

import React from 'react';
import { Bell, Video, Heart, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';

interface NotificationsProps {
    isOpen: boolean;
    onClose: () => void;
}

const mockNotifications = [
    {
        id: 1,
        type: 'upload',
        user: 'TechTips',
        avatar: 'https://i.pravatar.cc/150?u=tech',
        message: 'uploaded: Reviewing the New META for 2026',
        time: '2 minutes ago',
        isRead: false,
    },
    {
        id: 2,
        type: 'live',
        user: 'SpeedQueen',
        avatar: 'https://i.pravatar.cc/150?u=sq',
        message: 'is LIVE: World Record Attempt #402',
        time: '15 minutes ago',
        isRead: false,
    },
    {
        id: 3,
        type: 'like',
        user: 'JohnDoe',
        avatar: 'https://i.pravatar.cc/150?u=jd',
        message: 'liked your comment: "That was insane!"',
        time: '1 hour ago',
        isRead: true,
    },
    {
        id: 4,
        type: 'comment',
        user: 'GamerGuy',
        avatar: 'https://i.pravatar.cc/150?u=gg',
        message: 'replied: "Totally agree with you"',
        time: '3 hours ago',
        isRead: true,
    },
];

export default function Notifications({ isOpen, onClose }: NotificationsProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop to close */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Dropdown */}
            <div className="absolute top-[80%] right-0 mt-2 w-80 md:w-96 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex items-center justify-between bg-surface-hover/30">
                    <h3 className="font-bold text-base">Notifications</h3>
                    <button className="text-xs text-primary font-bold hover:underline">Mark all as read</button>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {mockNotifications.map((note) => (
                        <div
                            key={note.id}
                            className={`p-4 border-b border-border/50 hover:bg-surface-hover transition-colors flex gap-3 cursor-pointer ${!note.isRead ? 'bg-primary/5' : ''}`}
                        >
                            <div className="relative flex-shrink-0">
                                <img src={note.avatar} className="w-10 h-10 rounded-full object-cover" alt="User" />
                                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-background border border-border shadow-sm">
                                    {note.type === 'upload' && <Video size={10} className="text-primary" />}
                                    {note.type === 'live' && <div className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />}
                                    {note.type === 'like' && <Heart size={10} className="text-red-500" fill="currentColor" />}
                                    {note.type === 'comment' && <MessageCircle size={10} className="text-blue-400" fill="currentColor" />}
                                </div>
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm leading-snug">
                                    <span className="font-bold text-foreground">{note.user}</span>{' '}
                                    <span className="text-foreground/80">{note.message}</span>
                                </p>
                                <p className="text-xs text-muted font-medium">{note.time}</p>
                            </div>
                            {!note.isRead && (
                                <div className="self-center w-2 h-2 bg-primary rounded-full" />
                            )}
                        </div>
                    ))}
                </div>

                <Link href="/settings" className="block p-3 text-center text-xs font-bold text-muted hover:bg-surface-hover border-t border-border transition-colors">
                    Notification Settings
                </Link>
            </div>
        </>
    );
}
