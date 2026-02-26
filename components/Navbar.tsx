'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, Menu, Plus, Mic, Video } from 'lucide-react';
import Notifications from './Notifications';

interface NavbarProps {
    onMenuClick?: () => void;
}

import { useAuth } from '@/components/AuthProvider';
import { User as UserIcon } from 'lucide-react';

export default function Navbar({ onMenuClick }: NavbarProps) {
    const { user, profile, isLoading } = useAuth();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    return (
        <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-white/5 transition-all duration-300" style={{ height: 'var(--spacing-header)' }}>
            <div className="flex items-center justify-between h-full px-6">
                {/* Left: Brand Identity */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-sm hover:bg-white/5 transition-colors active:scale-95"
                        aria-label="Toggle Menu"
                    >
                        <Menu size={22} className="text-white" />
                    </button>
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
                            Go<span className="text-primary">Live</span>
                        </span>
                    </Link>
                </div>

                {/* Center: Cinematic Search */}
                <div className="flex-1 max-w-xl mx-8 hidden md:block">
                    <div className="search-container flex items-center rounded-sm overflow-hidden h-10 px-4">
                        <Search size={16} className="text-muted mr-3" />
                        <input
                            type="text"
                            placeholder="SEARCH EVERYTHING..."
                            className="flex-1 bg-transparent text-[11px] font-bold tracking-widest text-white placeholder-muted/50 focus:outline-none uppercase"
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    {!isLoading && (
                        user ? (
                            <>
                                <Link
                                    href="/upload"
                                    className="hidden sm:flex items-center gap-2 px-4 h-10 border border-white/10 hover:border-white/30 text-[10px] font-black tracking-widest uppercase transition-all"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                    UPLOAD
                                </Link>

                                <div className="relative">
                                    <button
                                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                        className={`p-2 rounded-sm hover:bg-white/5 transition-colors relative ${isNotificationsOpen ? 'text-primary' : 'text-white'}`}
                                        aria-label="Notifications"
                                    >
                                        <Bell size={22} />
                                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
                                    </button>
                                    <Notifications isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
                                </div>

                                <Link
                                    href={`/profile/${profile?.username || 'user'}`}
                                    className="relative group ml-2"
                                >
                                    <div className="w-10 h-10 rounded-sm overflow-hidden border border-white/10 group-hover:border-primary/50 transition-all p-0.5">
                                        <img
                                            src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.id}&backgroundColor=E50914`}
                                            alt="Profile"
                                            className="w-full h-full object-cover rounded-sm"
                                        />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="hidden sm:block text-[11px] font-black tracking-widest uppercase text-white hover:text-primary transition-colors"
                                >
                                    LOG IN
                                </Link>
                                <Link
                                    href="/register"
                                    className="btn btn-primary"
                                >
                                    GET STARTED
                                </Link>
                            </div>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
}
