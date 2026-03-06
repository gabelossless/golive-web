'use client';

import { Menu, Search, Video, Bell, User, Mic, Camera, Upload, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

interface NavbarProps {
    onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="glass sticky top-0 z-50 flex items-center justify-between px-4 py-2 h-14">
            {/* Left */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Toggle menu"
                >
                    <Menu size={24} />
                </button>
                <Link href="/" className="flex items-center gap-1 group">
                    <div className="relative">
                        <Video className="text-red-600 group-hover:scale-110 transition-transform" size={28} fill="currentColor" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#9147ff] rounded-full animate-pulse" />
                    </div>
                    <span className="text-xl font-bold tracking-tighter font-display hidden sm:block">
                        Go<span className="text-[#9147ff]">Live</span>
                    </span>
                </Link>
            </div>

            {/* Search */}
            <form
                onSubmit={handleSearch}
                className="flex-1 max-w-2xl mx-4 hidden md:flex items-center"
            >
                <div className="flex flex-1 items-center bg-[#121212] border border-[#3f3f3f] rounded-l-full px-4 py-1.5 focus-within:border-[#9147ff] transition-colors">
                    <Search className="text-gray-400 mr-2 flex-shrink-0" size={18} />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
                        aria-label="Search videos"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-[#222222] border border-l-0 border-[#3f3f3f] px-5 py-1.5 rounded-r-full hover:bg-[#333333] transition-colors"
                    aria-label="Search"
                >
                    <Search size={18} />
                </button>
                <button type="button" className="ml-4 p-2.5 bg-[#181818] rounded-full hover:bg-white/10 transition-colors" aria-label="Voice search">
                    <Mic size={18} />
                </button>
            </form>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3">
                {user ? (
                    <>
                        <Link
                            href="/upload"
                            className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
                            aria-label="Upload video"
                        >
                            <Upload size={16} />
                            <span className="hidden lg:block">Upload</span>
                        </Link>
                        <button className="p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block" aria-label="Notifications">
                            <Bell size={22} />
                        </button>
                        <div className="relative group">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9147ff] to-red-600 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                <User size={18} />
                            </div>
                            {/* Dropdown */}
                            <div className="absolute right-0 top-10 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 py-2">
                                <Link href={user ? `/profile/${user.email?.split('@')[0]}` : '/login'} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-sm transition-colors">
                                    <User size={16} />
                                    Your Channel
                                </Link>
                                <Link href="/studio" className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-sm transition-colors">
                                    <Camera size={16} />
                                    Creator Studio
                                </Link>
                                <hr className="border-white/10 my-1" />
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-sm transition-colors text-left text-red-400"
                                >
                                    <LogOut size={16} />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <Link
                        href="/login"
                        className="px-4 py-1.5 border border-[#3f3f3f] hover:bg-white/10 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <User size={16} />
                        Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
}
