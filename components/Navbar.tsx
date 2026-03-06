'use client';

import { Menu, Search, Video, Bell, Camera, Mic, User, Upload, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface NavbarProps {
    onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <nav className="glass fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 h-14">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={22} />
                </button>
                <Link href="/" className="flex items-center gap-1 group">
                    <div className="relative">
                        <Video className="text-red-600 group-hover:scale-110 transition-transform" size={26} fill="currentColor" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#9147ff] rounded-full animate-pulse" />
                    </div>
                    <span className="text-[18px] font-bold tracking-tight hidden sm:block ml-1">
                        Go<span className="text-[#9147ff]">Live</span>
                    </span>
                </Link>
            </div>

            {/* Center: Search (YouTube-style pill) */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 hidden md:flex items-center">
                <div className="flex flex-1 items-center bg-[#121212] border border-[#3f3f3f] rounded-l-full px-4 py-1.5 focus-within:border-blue-500 transition-colors">
                    <Search className="text-gray-400 mr-2 flex-shrink-0" size={16} />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-[#222] border border-l-0 border-[#3f3f3f] px-5 py-1.5 rounded-r-full hover:bg-[#333] transition-colors"
                    aria-label="Search"
                >
                    <Search size={16} />
                </button>
                <button
                    type="button"
                    className="ml-3 p-2 bg-[#181818] rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Voice search"
                >
                    <Mic size={16} />
                </button>
            </form>

            {/* Right: Icons + User */}
            <div className="flex items-center gap-1 sm:gap-2">
                {user ? (
                    <>
                        <Link
                            href="/upload"
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 hover:bg-white/12 border border-white/10 text-sm font-medium transition-colors"
                        >
                            <Upload size={15} />
                            <span className="hidden lg:block">Upload</span>
                        </Link>
                        <button className="p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block" aria-label="Camera">
                            <Camera size={20} />
                        </button>
                        <button className="p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block" aria-label="Notifications">
                            <Bell size={20} />
                        </button>
                        {/* User avatar dropdown */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9147ff] to-red-600 flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden"
                                aria-label="User menu"
                            >
                                <User size={16} />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 top-10 w-48 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                                    style={{ background: '#181818' }}>
                                    <Link
                                        href="/studio"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                                    >
                                        Studio
                                    </Link>
                                    <Link
                                        href="/settings"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                                    >
                                        Settings
                                    </Link>
                                    <hr className="border-white/10" />
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors text-left"
                                    >
                                        <LogOut size={15} />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#9147ff] text-[#9147ff] hover:bg-[#9147ff]/10 text-sm font-medium transition-colors"
                    >
                        <User size={15} />
                        Sign in
                    </Link>
                )}
            </div>
        </nav>
    );
}
