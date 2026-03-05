'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Home, TrendingUp, Users, PlaySquare, Clock, ThumbsUp, Radio, ChevronRight, LayoutDashboard, Compass, Flame, Video, Radio as LiveIcon } from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
}

interface LiveChannelUI {
    id: string;
    name: string;
    game: string;
    avatar: string;
    viewers: string;
    live: boolean;
}

const mainNav = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Video, label: 'Shorts', href: '/shorts' },
    { icon: Flame, label: 'Trending', href: '/trending' },
    { icon: Compass, label: 'Following', href: '/subscriptions' },
];

const libraryNav = [
    { icon: LayoutDashboard, label: 'Studio', href: '/studio' },
    { icon: PlaySquare, label: 'History', href: '/history' },
    { icon: ThumbsUp, label: 'Liked', href: '/liked' },
];

export default function Sidebar({ isCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const [liveChannels, setLiveChannels] = useState<LiveChannelUI[]>([]);

    useEffect(() => {
        fetchLiveChannels();
        const channel = supabase
            .channel('public:videos:live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, fetchLiveChannels)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchLiveChannels = async () => {
        const { data } = await supabase
            .from('videos')
            .select('id, title, category, profiles(username, avatar_url)')
            .eq('is_live', true)
            .limit(5);

        if (data) {
            setLiveChannels(data.map((v: any) => ({
                id: v.id,
                name: v.profiles?.username || 'Unknown',
                game: v.category || 'Live',
                avatar: v.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.profiles?.username}`,
                viewers: '12K',
                live: true,
            })));
        }
    };

    const NavItem = ({ item, collapsed }: { item: any; collapsed: boolean }) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
            <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
            >
                <item.icon
                    size={collapsed ? 22 : 20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    fill={isActive ? 'currentColor' : 'none'}
                />
                {!collapsed && <span>{item.label}</span>}
            </Link>
        );
    };

    return (
        <aside
            className={`fixed left-0 bottom-0 z-40 border-r border-border overflow-y-auto scrollbar-hide hidden lg:flex flex-col transition-all duration-300 ease-in-out bg-[#0a0a0f]/80 backdrop-blur-xl ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}`}
            style={{ top: 'var(--spacing-header)' }}
        >
            <div className="flex flex-col py-4 flex-1 gap-1">

                {/* Main Nav */}
                <div className="px-3">
                    {!isCollapsed && <p className="px-3 py-2 text-[11px] font-semibold text-muted uppercase tracking-wider">Menu</p>}
                    {mainNav.map((item) => <NavItem key={item.label} item={item} collapsed={isCollapsed} />)}
                </div>

                <div className={`border-t border-border/40 my-3 ${isCollapsed ? 'mx-3' : 'mx-4'}`} />

                {/* Library */}
                <div className="px-3">
                    {!isCollapsed && <p className="px-3 py-2 text-[11px] font-semibold text-muted uppercase tracking-wider">Library</p>}
                    {libraryNav.map((item) => <NavItem key={item.label} item={item} collapsed={isCollapsed} />)}
                </div>

                <div className={`border-t border-border/40 my-3 ${isCollapsed ? 'mx-3' : 'mx-4'}`} />

                {/* Live Channels */}
                <div className="px-3 flex-1">
                    {!isCollapsed ? (
                        <>
                            <div className="flex items-center justify-between px-3 py-2 mb-1">
                                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Live Now</p>
                                <span className="flex items-center gap-1 text-[10px] text-live font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
                                    Live
                                </span>
                            </div>
                            {liveChannels.length === 0 ? (
                                <p className="text-[12px] text-muted px-3 py-2 opacity-60">No live streams</p>
                            ) : (
                                <div className="space-y-0.5">
                                    {liveChannels.map((ch) => (
                                        <Link key={ch.id} href={`/live/${ch.id}`}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="relative flex-shrink-0">
                                                <img src={ch.avatar} alt={ch.name}
                                                    className="w-8 h-8 rounded-full object-cover ring-1 ring-border group-hover:ring-live/50 transition-all" />
                                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-live rounded-full border-2 border-background animate-pulse" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-medium text-foreground truncate group-hover:text-violet-300 transition-colors">{ch.name}</p>
                                                <p className="text-[11px] text-muted truncate">{ch.game}</p>
                                            </div>
                                            <span className="text-[11px] text-muted-2 font-medium">{ch.viewers}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col gap-2 items-center mt-2">
                            {liveChannels.map((ch) => (
                                <Link key={ch.id} href={`/live/${ch.id}`} title={ch.name} className="relative">
                                    <img src={ch.avatar} alt={ch.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-border hover:ring-live/60 transition-all" />
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-live rounded-full border-2 border-background animate-pulse" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
