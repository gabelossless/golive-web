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
        <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-border/60 transition-all duration-300" style={{ height: 'var(--spacing-header)' }}>
            <div className="flex items-center justify-between h-full px-4">
                {/* Left: Logo & Menu */}
                <div className="flex items-center gap-1 md:gap-3">
                    <button
                        onClick={onMenuClick}
                        className="p-2.5 rounded-full hover:bg-surface-hover transition-all active:scale-90"
                        aria-label="Toggle Menu"
                    >
                        <Menu size={20} className="text-foreground" />
                    </button>
                    <Link href="/" className="flex items-center gap-2 group ml-1">
                        <div className="w-8 h-8 md:w-9 md:h-9 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-all shadow-[0_4px_20px_rgba(145,71,255,0.4)]">
                            <Video size={20} className="text-white fill-white/10" />
                        </div>
                        <span className="text-lg md:text-xl font-black tracking-tighter text-foreground hidden sm:block">
                            Go<span className="text-primary">Live</span>
                        </span>
                    </Link>
                </div>

                {/* Center: Unified Search — Apple/Google Premium style */}
                <div className="flex-1 max-w-2xl mx-4 hidden md:flex items-center gap-3">
                    <div className="flex-1 flex items-center">
                        <div className="search-container flex-1 flex items-center rounded-full overflow-hidden group">
                            <div className="pl-5 pr-2 py-2.5 text-muted group-focus-within:text-primary transition-colors">
                                <Search size={18} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search channels, games, or videos..."
                                className="flex-1 bg-transparent py-2.5 pr-5 text-sm font-medium text-foreground placeholder-muted/60 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Voice Search Button */}
                    <button className="w-10 h-10 flex items-center justify-center rounded-full glass border border-white/5 hover:border-primary/50 hover:bg-surface-hover transition-all active:scale-95 text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(145,71,255,0.3)] group">
                        <Mic size={18} className="group-hover:text-primary transition-colors" />
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 md:gap-3">
                    {/* Only show 'Create' if logged in */}
                    {user && (
                        <Link
                            href="/upload"
                            className="p-2.5 rounded-full hover:bg-surface-hover transition-all relative group"
                            aria-label="Create"
                        >
                            <Plus size={22} className="text-foreground group-hover:text-primary transition-colors" />
                            <span className="absolute -top-1 -right-1 bg-primary text-[8px] font-bold text-white px-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">GO</span>
                        </Link>
                    )}

                    {!isLoading && (
                        user ? (
                            <>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                        className={`p-2.5 rounded-full hover:bg-surface-hover transition-all relative ${isNotificationsOpen ? 'bg-surface-hover text-primary' : ''}`}
                                        aria-label="Notifications"
                                    >
                                        <Bell size={22} className="text-foreground" />
                                        {/* Todo: Real notification count */}
                                        {/* <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background pointer-events-none" /> */}
                                    </button>
                                    <Notifications isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
                                </div>

                                <Link
                                    href={`/profile/${profile?.username || 'user'}`}
                                    className="ml-1 md:ml-2 relative group"
                                    title={profile?.full_name || profile?.username || 'My Profile'}
                                >
                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary transition-all p-0.5">
                                        <img
                                            src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                            alt="Profile"
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 ml-2">
                                <Link
                                    href="/login"
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 hover:bg-surface-hover font-bold text-sm transition-all"
                                >
                                    <UserIcon size={18} />
                                    Log In
                                </Link>
                                <Link
                                    href="/register"
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
}
