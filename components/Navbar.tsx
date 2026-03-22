'use client';

import { Menu, Search, Zap, Bell, User, Mic, PlusCircle, LogIn, CheckCircle2, Shield, Flame } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from '@/components/AuthProvider';
import { TOP_50_TAGS } from '@/lib/tags';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface NavbarProps {
    onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    
    const router = useRouter();
    const { user, profile } = useAuth();

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.trim().length > 0) {
                try {
                    // Fetch creators and videos matching the query
                    const [{ data: creators }, { data: videos }] = await Promise.all([
                        supabase
                            .from('profiles')
                            .select('username, display_name, channel_name')
                            .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,channel_name.ilike.%${searchQuery}%`)
                            .limit(4),
                        supabase
                            .from('videos')
                            .select('title')
                            .ilike('title', `%${searchQuery}%`)
                            .limit(4)
                    ]);

                    const combined = [
                        ...(creators || []).map((c: any) => c.channel_name || c.display_name || c.username),
                        ...(videos || []).map((v: any) => v.title)
                    ];
                    
                    const unique = Array.from(new Set(combined));
                    
                    // Fallback to tags if we don't have enough results
                    if (unique.length < 8) {
                        const tags = TOP_50_TAGS.filter(tag => 
                            tag.toLowerCase().includes(searchQuery.toLowerCase())
                        ).slice(0, 8 - unique.length);
                        setSuggestions([...unique, ...tags].slice(0, 8));
                    } else {
                        setSuggestions(unique.slice(0, 8));
                    }
                    setShowSuggestions(true);
                } catch (err) {
                    console.error('Error fetching suggestions:', err);
                    const filtered = TOP_50_TAGS.filter(tag => 
                        tag.toLowerCase().startsWith(searchQuery.toLowerCase())
                    ).slice(0, 8);
                    setSuggestions(filtered);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
            setSelectedIndex(-1);
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            const selected = suggestions[selectedIndex];
            setSearchQuery(selected);
            router.push(`/search?q=${encodeURIComponent(selected)}`);
            setShowSuggestions(false);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <nav className="sticky top-0 z-[1000] flex items-center justify-between px-4 md:px-8 py-3 glass-floating h-20 min-h-[80px] shrink-0 md:mx-6 md:mt-4 md:rounded-[32px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] backdrop-blur-3xl transition-all duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors hidden md:block"
                    title="Menu"
                >
                    <Menu size={24} />
                </button>
                <Link href="/" className="flex items-center gap-2 group shrink-0" title="Zenith Home">
                    <div className="relative">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#FFB800] to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20 group-hover:scale-110 transition-transform">
                            <Flame size={24} className="text-black" fill="currentColor" />
                        </div>
                    </div>
                    <span className="text-xl font-black tracking-tighter font-premium hidden xs:block sm:block uppercase italic">
                        Zenith
                    </span>
                </Link>
            </div>

            <div
                className="flex-1 max-w-2xl mx-4 hidden md:flex flex-col relative"
                onBlur={(e) => {
                    // Close suggestions after a short delay to allow clicking
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                        setTimeout(() => setShowSuggestions(false), 200);
                    }
                }}
            >
                <form
                    onSubmit={handleSearch}
                    className="flex items-center w-full group/search"
                >
                    <div className="flex flex-1 items-center bg-white/[0.04] border-premium rounded-2xl px-6 py-3 focus-within:bg-black/80 focus-within:border-[#FFB800]/60 focus-within:ring-4 focus-within:ring-[#FFB800]/5 transition-all duration-700 shadow-[inner_0_2px_4px_rgba(0,0,0,0.4)]">
                        <Search className="text-zinc-500 group-focus-within/search:text-[#FFB800] group-focus-within/search:scale-110 transition-all duration-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search creators, videos, lives..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                            className="w-full bg-transparent outline-none text-base placeholder:text-zinc-600 ml-4 font-bold text-white tracking-tight"
                            title="Search"
                        />
                    </div>
                    <button type="button" className="ml-5 p-3.5 bg-white/[0.04] border border-white/5 rounded-2xl hover:bg-[#FFB800] hover:text-black hover:scale-110 transition-all duration-500 shadow-lg" title="Search with your voice">
                        <Mic size={20} />
                    </button>
                </form>

                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-14 mt-1 bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[1001] py-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={suggestion}
                                onClick={() => {
                                    setSearchQuery(suggestion);
                                    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                                    setShowSuggestions(false);
                                }}
                                className={cn(
                                    "w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors",
                                    index === selectedIndex ? "bg-white/10 text-[#FFB800]" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Search size={14} className={index === selectedIndex ? "text-[#FFB800]" : "text-gray-600"} />
                                <span className="font-bold">{suggestion}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

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
                                className="px-6 py-2 rounded-2xl bg-gradient-to-br from-[#FFB800] via-[#FF8A00] to-orange-700 text-black font-black uppercase text-[11px] tracking-[0.2em] hover:scale-105 hover:shadow-[0_10px_20px_rgba(255,184,0,0.3)] transition-all hidden lg:flex items-center gap-2 border border-white/10"
                                title="Get Premium"
                            >
                                <Zap size={14} fill="currentColor" />
                                Premium
                            </Link>
                        )}
                        <button className="relative p-3 rounded-2xl bg-white/[0.04] border border-white/5 hover:bg-white/10 transition-all group" title="View Notifications">
                            <Bell size={22} className="group-hover:rotate-12 transition-transform" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FFB800] rounded-full shadow-[0_0_10px_#FFB800]" />
                        </button>
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex flex-col items-end mr-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB800] leading-none mb-1 opacity-80">
                                        {profile?.subscription_tier === 'premium' ? '👑 ELITE' : 'ZENITH CREATOR'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-white max-w-[140px] truncate font-premium">
                                            {profile?.channel_name || profile?.display_name || profile?.username}
                                        </span>
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
                                <Link href="/studio/dashboard" className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFB800] to-orange-600 p-[2px] cursor-pointer hover:scale-110 transition-transform shadow-xl overflow-hidden" title="Creator Studio">
                                    <div className="w-full h-full rounded-2xl bg-[#0a0a0a] overflow-hidden">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-[#FFB800]">
                                                <User size={24} />
                                            </div>
                                        )}
                                    </div>
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
