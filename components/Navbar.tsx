'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Plus, X, Menu, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import Notifications from './Notifications';

interface NavbarProps {
    onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const { user, profile, isLoading } = useAuth();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const pathname = usePathname();
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (searchOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [searchOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery('');
        }
    };

    return (
        <>
            <nav className="glass fixed top-0 left-0 right-0 z-50" style={{ height: 'var(--spacing-header)' }}>
                <div className="flex items-center justify-between h-full px-4 md:px-6 gap-4">

                    {/* Left: Logo + Menu */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            onClick={onMenuClick}
                            className="btn btn-ghost btn-icon hidden md:flex"
                            aria-label="Toggle Menu"
                        >
                            <Menu size={20} />
                        </button>
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                                <Sparkles size={16} className="text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-display text-xl text-white font-bold tracking-tight hidden sm:block">
                                Go<span className="gradient-text">Live</span>
                            </span>
                        </Link>
                    </div>

                    {/* Center: Search - Desktop */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:block">
                        <div className="search-container flex items-center h-10 px-4 gap-3">
                            <Search size={15} className="text-muted flex-shrink-0" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search videos, creators..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-foreground placeholder-muted focus:outline-none"
                            />
                        </div>
                    </form>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Mobile search toggle */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="btn btn-ghost btn-icon md:hidden"
                            aria-label="Search"
                        >
                            <Search size={20} />
                        </button>

                        {!isLoading && (
                            user ? (
                                <>
                                    <Link
                                        href="/upload"
                                        className="btn btn-primary btn-sm hidden sm:flex gap-1.5 shadow-lg shadow-violet-500/25"
                                    >
                                        <Plus size={15} strokeWidth={2.5} />
                                        Create
                                    </Link>

                                    <div className="relative">
                                        <button
                                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                            className="btn btn-ghost btn-icon relative"
                                            aria-label="Notifications"
                                        >
                                            <Bell size={20} />
                                            <span className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full border-2 border-background" />
                                        </button>
                                        <Notifications isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
                                    </div>

                                    <Link
                                        href={`/profile/${profile?.username || 'me'}`}
                                        className="relative group ml-1"
                                    >
                                        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-violet-500/60 transition-all">
                                            <img
                                                src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}&backgroundColor=7c3aed&textColor=ffffff`}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-background rounded-full" />
                                    </Link>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/login" className="btn btn-ghost btn-sm hidden sm:flex">
                                        Sign In
                                    </Link>
                                    <Link href="/register" className="btn btn-primary btn-sm shadow-lg shadow-violet-500/25">
                                        Get Started
                                    </Link>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Search Overlay */}
            {searchOpen && (
                <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl md:hidden flex flex-col">
                    <div className="flex items-center gap-3 p-4 border-b border-border">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="search-container flex items-center h-12 px-4 gap-3">
                                <Search size={18} className="text-muted flex-shrink-0" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Search videos, creators..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent text-base text-foreground placeholder-muted focus:outline-none"
                                    autoFocus
                                />
                            </div>
                        </form>
                        <button
                            onClick={() => setSearchOpen(false)}
                            className="btn btn-ghost btn-icon"
                            aria-label="Close Search"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-muted font-medium mb-3">Popular Searches</p>
                        {['Gaming', 'Music', 'Tech', 'Trending'].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => { setSearchQuery(tag); router.push(`/search?q=${tag}`); setSearchOpen(false); }}
                                className="category-pill mr-2 mb-2"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
