'use client';

import { Menu, Search, Zap, Bell, User, Mic, PlusCircle, LogIn, CheckCircle2, Shield } from "lucide-react";
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
        <nav className="sticky top-0 z-[1000] flex items-center justify-between px-4 md:px-6 py-2 glass-deep h-16 min-h-[64px] shrink-0 md:mx-2 md:mt-2 md:rounded-3xl border-b md:border border-white/5 shadow-2xl">
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
                    <span className="text-xl font-black tracking-tighter font-premium hidden xs:block sm:block uppercase italic">
                        Vibe<span className="text-[#FFB800] text-gradient">Stream</span>
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
                    <div className="flex flex-1 items-center bg-white/[0.03] border-premium rounded-2xl px-5 py-2 focus-within:bg-black/40 focus-within:border-[#FFB800]/40 transition-all duration-500 shadow-inner">
                        <Search className="text-zinc-600 group-focus-within/search:text-[#FFB800] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search creators, videos, lives..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                            className="w-full bg-transparent outline-none text-sm placeholder:text-zinc-700 ml-3 font-medium text-white"
                            title="Search"
                        />
                    </div>
                    <button type="button" className="ml-4 p-2.5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/10 transition-all text-zinc-400 hover:text-white" title="Search with your voice">
                        <Mic size={18} />
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
