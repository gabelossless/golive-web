'use client';

import { Menu, Search, Zap, Bell, User, Mic, PlusCircle, LogIn, CheckCircle2, Shield } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from "react";
import { useAuth } from '@/components/AuthProvider';

interface NavbarProps {
    onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const { user, profile } = useAuth();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-[#0a0a0a] glass h-14 min-h-[56px] shrink-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors hidden md:block"
                    title="Menu"
                >
                    <Menu size={24} />
                </button>
                <Link href="/" className="flex items-center gap-1 group shrink-0" title="VibeStream Home">
                    <div className="relative">
                        <Zap className="text-[#FFB800] group-hover:scale-110 transition-transform" size={28} fill="currentColor" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                    <span className="text-xl font-black tracking-tighter font-display hidden xs:block sm:block">
                        VIBE<span className="text-[#FFB800]">STREAM</span>
                    </span>
                </Link>
            </div>

            <form
                onSubmit={handleSearch}
                className="flex-1 max-w-2xl mx-4 hidden md:flex items-center"
            >
                <div className="flex flex-1 items-center bg-[#121212] border border-white/5 rounded-l-full px-4 py-1.5 focus-within:border-[#FFB800]/50 transition-colors">
                    <Search className="text-gray-400 mr-2" size={18} />
                    <input
                        type="text"
                        placeholder="Search creators, videos, lives..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm placeholder:text-gray-600"
                        title="Search"
                    />
                </div>
                <button className="bg-[#1a1a1a] border border-l-0 border-white/5 px-5 py-1.5 rounded-r-full hover:bg-[#222222] transition-colors" title="Search">
                    <Search size={18} />
                </button>
                <button type="button" className="ml-4 p-2.5 bg-[#121212] rounded-full hover:bg-white/10 transition-colors" title="Search with your voice">
                    <Mic size={18} />
                </button>
            </form>

            <div className="flex items-center gap-2 sm:gap-4">
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors md:hidden shrink-0" title="Search">
                    <Search size={22} />
                </button>
                <Link href="/upload" className="p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block" title="Create Video">
                    <PlusCircle size={22} />
                </Link>
                {user && (
                    <Link 
                        href="/premium" 
                        className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFB800] to-orange-600 text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all hidden lg:flex items-center gap-1"
                        title="Get Premium"
                    >
                        <CheckCircle2 size={12} />
                        Get Premium
                    </Link>
                )}
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block" title="View Notifications">
                    <Bell size={22} />
                </button>
                {user ? (
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end mr-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] leading-none mb-0.5">
                                {profile?.subscription_tier === 'premium' ? 'Premium' : 'Creator'}
                            </span>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-white max-w-[120px] truncate">
                                    {profile?.channel_name || profile?.display_name || profile?.username}
                                </span>
                                {(profile?.is_verified || profile?.subscription_tier === 'premium') && (
                                    <CheckCircle2 size={12} className="text-[#FFB800]" fill="currentColor" />
                                )}
                            </div>
                        </div>
                        {profile?.is_admin && (
                            <Link 
                                href="/admin/dashboard" 
                                className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                title="Admin Panel"
                            >
                                <Shield size={18} />
                            </Link>
                        )}
                        <Link href="/studio/dashboard" className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB800] to-orange-600 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" title="Creator Studio">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                            ) : (
                                <User size={18} className="text-black" />
                            )}
                        </Link>
                    </div>
                ) : (
                    <Link href="/login" className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFB800]/40 text-[#FFB800] hover:bg-[#FFB800]/10 transition-colors font-medium text-sm">
                        <LogIn size={16} /> <span className="hidden sm:inline">Sign in</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}
