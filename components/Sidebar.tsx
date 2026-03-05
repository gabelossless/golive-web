'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Home, Flame, Compass, PlaySquare, Clock, ThumbsUp,
    LayoutDashboard, History, Radio, ChevronRight, Users,
    Tv, Music, Gamepad2, BookOpen, ChevronDown
} from 'lucide-react';

interface SidebarProps { isCollapsed: boolean; }

interface LiveChannel {
    id: string; name: string; game: string; avatar: string; viewers: string;
}

const mainNav = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Flame, label: 'Trending', href: '/trending' },
    { icon: Compass, label: 'Subscriptions', href: '/subscriptions' },
];

const libraryNav = [
    { icon: LayoutDashboard, label: 'Studio', href: '/studio' },
    { icon: History, label: 'History', href: '/history' },
    { icon: PlaySquare, label: 'Your videos', href: '/history' },
    { icon: ThumbsUp, label: 'Liked videos', href: '/liked' },
];

const exploreNav = [
    { icon: Gamepad2, label: 'Gaming', href: '/trending?cat=Gaming' },
    { icon: Music, label: 'Music', href: '/trending?cat=Music' },
    { icon: Tv, label: 'Live', href: '/trending?cat=Live' },
    { icon: BookOpen, label: 'Learning', href: '/trending?cat=Learning' },
];

export default function Sidebar({ isCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
    const [showAllChannels, setShowAllChannels] = useState(false);

    useEffect(() => {
        fetchLive();
    }, []);

    const fetchLive = async () => {
        const { data } = await supabase
            .from('videos')
            .select('id, category, profiles(username, avatar_url)')
            .eq('is_live', true)
            .limit(8);
        if (data) {
            setLiveChannels(data.map((v: any) => ({
                id: v.id,
                name: (Array.isArray(v.profiles) ? v.profiles[0] : v.profiles)?.username || 'Unknown',
                game: v.category || 'Just Chatting',
                avatar: (Array.isArray(v.profiles) ? v.profiles[0] : v.profiles)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.id}`,
                viewers: `${Math.floor(Math.random() * 9000 + 100).toLocaleString()}`,
            })));
        }
    };

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);

    /* ── Mini (icon-only) mode ── */
    if (isCollapsed) {
        return (
            <aside className="yt-sidebar mini hidden-mobile">
                <div className="py-2 px-1.5 space-y-1">
                    {mainNav.map(({ icon: Icon, label, href }) => (
                        <Link key={href} href={href} aria-label={label}>
                            <div className={`sidebar-item-mini ${isActive(href) ? 'active' : ''}`}>
                                <Icon size={22} strokeWidth={isActive(href) ? 2.5 : 1.8} />
                                <span>{label === 'Subscriptions' ? 'Subs' : label}</span>
                            </div>
                        </Link>
                    ))}
                    <div className="sidebar-divider mx-2" />
                    {libraryNav.slice(0, 3).map(({ icon: Icon, label, href }) => (
                        <Link key={href} href={href} aria-label={label}>
                            <div className={`sidebar-item-mini ${isActive(href) ? 'active' : ''}`}>
                                <Icon size={22} strokeWidth={1.8} />
                                <span style={{ fontSize: 9 }}>{label.split(' ')[0]}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </aside>
        );
    }

    /* ── Expanded mode ── */
    return (
        <aside className="yt-sidebar expanded hidden-mobile">
            <div className="py-3 px-3 space-y-0.5">

                {mainNav.map(({ icon: Icon, label, href }) => (
                    <Link key={href} href={href}>
                        <div className={`sidebar-item ${isActive(href) ? 'active' : ''}`}>
                            <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 1.8} className="sidebar-icon" style={{ flexShrink: 0 }} />
                            {label}
                        </div>
                    </Link>
                ))}

                <div className="sidebar-divider" />

                <div className="sidebar-section-label">You</div>
                {libraryNav.map(({ icon: Icon, label, href }) => (
                    <Link key={label} href={href}>
                        <div className={`sidebar-item ${isActive(href) ? 'active' : ''}`}>
                            <Icon size={20} strokeWidth={1.8} className="sidebar-icon" style={{ flexShrink: 0 }} />
                            {label}
                        </div>
                    </Link>
                ))}

                <div className="sidebar-divider" />

                {/* Live Channels (Twitch-style) */}
                {liveChannels.length > 0 && (
                    <>
                        <div className="sidebar-section-label flex items-center justify-between">
                            <span>Live Channels</span>
                        </div>
                        {liveChannels.slice(0, showAllChannels ? 8 : 5).map((ch) => (
                            <Link key={ch.id} href={`/live/${ch.id}`}>
                                <div className="sidebar-item group">
                                    <div className="relative flex-shrink-0">
                                        <img src={ch.avatar} alt={ch.name} className="w-8 h-8 rounded-full object-cover" />
                                        <span className="live-indicator absolute -bottom-0.5 -right-0.5 border-2" style={{ borderColor: '#0f0f0f' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{ch.name}</p>
                                        <p className="text-xs text-[#aaa] truncate">{ch.game}</p>
                                    </div>
                                    <span className="text-xs text-[#aaa] flex-shrink-0">{ch.viewers}</span>
                                </div>
                            </Link>
                        ))}
                        {liveChannels.length > 5 && (
                            <button
                                onClick={() => setShowAllChannels(!showAllChannels)}
                                className="sidebar-item text-sm text-[#aaa] hover:text-white w-full"
                            >
                                <ChevronDown size={18} className={`transition-transform ${showAllChannels ? 'rotate-180' : ''}`} />
                                Show {showAllChannels ? 'less' : 'more'}
                            </button>
                        )}
                        <div className="sidebar-divider" />
                    </>
                )}

                <div className="sidebar-section-label">Explore</div>
                {exploreNav.map(({ icon: Icon, label, href }) => (
                    <Link key={href} href={href}>
                        <div className="sidebar-item">
                            <Icon size={20} strokeWidth={1.8} className="sidebar-icon" style={{ flexShrink: 0 }} />
                            {label}
                        </div>
                    </Link>
                ))}

                <div className="sidebar-divider" />
                <p className="text-xs px-4 py-3 leading-relaxed" style={{ color: '#717171' }}>
                    © 2025 GoLive Inc.
                </p>

            </div>
        </aside>
    );
}
