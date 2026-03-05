'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Plus, Menu, Mic, X, Upload, Video, LogOut, Settings, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface NavbarProps {
    onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const { user, profile, signOut, isLoading } = useAuth();
    const [query, setQuery] = useState('');
    const [mobileSearch, setMobileSearch] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const createMenuRef = useRef<HTMLDivElement>(null);

    // Close menus on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
            if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) setCreateMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (mobileSearch) searchRef.current?.focus();
    }, [mobileSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            setMobileSearch(false);
        }
    };

    /* ────────────── Mobile search overlay ────────────── */
    if (mobileSearch) {
        return (
            <div className="yt-navbar px-3 gap-2">
                <button onClick={() => setMobileSearch(false)} className="icon-btn" aria-label="Cancel search">
                    <X size={20} />
                </button>
                <form onSubmit={handleSearch} className="yt-search flex-1">
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="yt-search-input"
                    />
                    <button type="submit" className="yt-search-btn" aria-label="Submit search">
                        <Search size={18} />
                    </button>
                </form>
            </div>
        );
    }

    return (
        <nav className="yt-navbar">
            {/* Left — Logo */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={onMenuClick} className="icon-btn" aria-label="Menu">
                    <Menu size={20} />
                </button>
                <Link href="/" className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#212121] transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-[#9147ff] flex items-center justify-center flex-shrink-0">
                        <Sparkles size={15} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-[18px] text-white tracking-tight hidden sm:block">GoLive</span>
                </Link>
            </div>

            {/* Center — Search (desktop) */}
            <div className="flex-1 flex justify-center px-4 hidden md:flex">
                <form onSubmit={handleSearch} className="yt-search">
                    <input
                        type="text"
                        placeholder="Search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="yt-search-input"
                    />
                    <button type="submit" className="yt-search-btn" aria-label="Search">
                        <Search size={18} />
                    </button>
                </form>
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-1 ml-auto" style={{ flexShrink: 0 }}>
                {/* Mobile search */}
                <button onClick={() => setMobileSearch(true)} className="icon-btn md:hidden" aria-label="Search">
                    <Search size={20} />
                </button>

                {!isLoading && (
                    user ? (
                        <>
                            {/* Create */}
                            <div className="relative" ref={createMenuRef}>
                                <button
                                    onClick={() => setCreateMenuOpen(!createMenuOpen)}
                                    className="icon-btn"
                                    aria-label="Create"
                                >
                                    <Plus size={20} />
                                </button>
                                {createMenuOpen && (
                                    <div
                                        className="absolute right-0 top-12 py-1 rounded-xl shadow-xl z-50 min-w-[160px]"
                                        style={{ background: '#282828', border: '1px solid rgba(255,255,255,0.12)' }}
                                    >
                                        <Link
                                            href="/upload"
                                            onClick={() => setCreateMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3f3f3f] transition-colors"
                                        >
                                            <Upload size={16} /> Upload video
                                        </Link>
                                        <Link
                                            href="/studio/golive"
                                            onClick={() => setCreateMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3f3f3f] transition-colors"
                                        >
                                            <Video size={16} /> Go live
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Notifications */}
                            <button className="icon-btn relative" aria-label="Notifications">
                                <Bell size={20} />
                                <span
                                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                                    style={{ background: '#9147ff' }}
                                />
                            </button>

                            {/* Avatar / User menu */}
                            <div className="relative ml-1" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-transparent hover:ring-[#9147ff] transition-all"
                                    aria-label="Account"
                                >
                                    <img
                                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}&backgroundColor=9147ff&textColor=ffffff`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                                {userMenuOpen && (
                                    <div
                                        className="absolute right-0 top-11 py-2 rounded-xl shadow-xl z-50 min-w-[220px]"
                                        style={{ background: '#282828', border: '1px solid rgba(255,255,255,0.12)' }}
                                    >
                                        {/* Account info */}
                                        <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.1)] flex items-center gap-3">
                                            <img
                                                src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}&backgroundColor=9147ff&textColor=ffffff`}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{profile?.username || 'User'}</p>
                                                <p className="text-xs text-[#aaa] truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <Link href={`/profile/${profile?.username}`} onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3f3f3f]">
                                            <UserIcon size={16} /> Your channel
                                        </Link>
                                        <Link href="/studio" onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3f3f3f]">
                                            <Video size={16} /> GoLive Studio
                                        </Link>
                                        <Link href="/settings" onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3f3f3f]">
                                            <Settings size={16} /> Settings
                                        </Link>
                                        <div className="border-t border-[rgba(255,255,255,0.1)] my-1" />
                                        <button
                                            onClick={() => { signOut(); setUserMenuOpen(false); }}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#3f3f3f] w-full text-left"
                                        >
                                            <LogOut size={16} /> Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 ml-2">
                            <Link href="/login" className="btn btn-outline text-sm hidden sm:flex">
                                Sign in
                            </Link>
                            <Link href="/register" className="btn btn-primary text-sm">
                                Get started
                            </Link>
                        </div>
                    )
                )}
            </div>
        </nav>
    );
}
