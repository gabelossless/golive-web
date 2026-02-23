'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Home, TrendingUp, Users, PlaySquare, Clock, ThumbsUp, Radio, ChevronRight, LayoutDashboard, Compass, Flame, Video } from 'lucide-react';
import { Video as VideoType } from '@/types';

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
    { icon: LayoutDashboard, label: 'Dashboard', href: '/studio' },
    { icon: PlaySquare, label: 'Library', href: '/library' },
    { icon: Clock, label: 'History', href: '/history' },
    { icon: ThumbsUp, label: 'Liked Videos', href: '/liked' },
];

export default function Sidebar({ isCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const [liveChannels, setLiveChannels] = useState<LiveChannelUI[]>([]);

    useEffect(() => {
        fetchLiveChannels();

        // Subscribe to changes in videos table (e.g. when someone goes live)
        const channel = supabase
            .channel('public:videos')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => {
                fetchLiveChannels();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchLiveChannels = async () => {
        const { data } = await supabase
            .from('videos')
            .select(`
                id,
                title,
                category,
                profiles (username, avatar_url)
            `)
            .eq('is_live', true)
            .limit(5);

        if (data) {
            // Transform for UI
            const formatted: LiveChannelUI[] = data.map((v: any) => ({ // Type assertion needed for joined data until strict rpc/types
                id: v.id,
                name: v.profiles?.username || 'Unknown',
                game: v.category || 'Live',
                avatar: v.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown',
                viewers: '12K', // Mock viewer count for now
                live: true
            }));
            setLiveChannels(formatted);
        }
    };

    const NavItem = ({ item, collapsed }: { item: any; collapsed: boolean }) => {
        const isActive = pathname === item.href;
        return (
            <Link
                href={item.href}
                className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-300 group relative mb-1 ${isActive
                    ? 'bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(145,71,255,0.15)] glow-border'
                    : 'text-muted hover:bg-surface-hover hover:text-foreground'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : ''}
            >
                {/* Active Indicator Glow (Enhanced) */}
                {isActive && (
                    <div className="absolute inset-0 bg-primary/10 blur-md rounded-xl" />
                )}
                {/* Left Border for Active (Full mode only) */}
                {isActive && !collapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}

                <div className="relative z-10">
                    <item.icon
                        size={collapsed ? 24 : 20}
                        className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`}
                        strokeWidth={isActive ? 2.5 : 2}
                    />
                </div>

                {!collapsed && (
                    <span className={`text-sm font-medium z-10 transition-colors duration-200 ${isActive ? 'font-bold' : ''}`}>
                        {item.label}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <aside
            className={`fixed left-0 bottom-0 z-40 glass border-r border-border overflow-y-auto no-scrollbar hidden lg:flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[72px]' : 'w-[240px]'
                }`}
            style={{ top: 'var(--spacing-header)' }}
        >
            <div className="flex flex-col py-4 flex-1">
                {/* Main Navigation */}
                <div className="px-3 mb-2">
                    {mainNav.map((item) => (
                        <NavItem key={item.label} item={item} collapsed={isCollapsed} />
                    ))}
                </div>

                {/* Divider */}
                <div className={`mx-4 border-t border-border/50 my-2 ${isCollapsed ? 'mx-2' : ''}`} />

                {/* Library */}
                <div className="px-3 mb-2">
                    {!isCollapsed && (
                        <h3 className="px-3 py-2 text-xs font-bold text-muted uppercase tracking-wider animate-in fade-in">
                            Library
                        </h3>
                    )}
                    {libraryNav.map((item) => (
                        <NavItem key={item.label} item={item} collapsed={isCollapsed} />
                    ))}
                </div>

                {/* Divider */}
                <div className={`mx-4 border-t border-border/50 my-2 ${isCollapsed ? 'mx-2' : ''}`} />

                {/* Recommended Live Channels — Only show in full mode for cleanlyness, or avatars in mini mode */}
                <div className="px-3 flex-1">
                    {!isCollapsed ? (
                        <>
                            <div className="flex items-center justify-between px-3 py-2 mb-1 animate-in fade-in">
                                <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Live Channels</h3>
                                <div className="live-badge scale-90 origin-right">
                                    <span className="live-dot" />
                                    Live
                                </div>
                            </div>
                            <div className="space-y-1">
                                {liveChannels.length === 0 && (
                                    <p className="text-xs text-muted px-3 py-2 italic text-center opacity-50">No channels live</p>
                                )}
                                {liveChannels.map((channel) => (
                                    <Link
                                        key={channel.id}
                                        href={`/live/${channel.id}`}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-hover transition-colors group"
                                    >
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={channel.avatar}
                                                alt={channel.name}
                                                className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/50 transition-all"
                                            />
                                            {channel.live && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                {channel.name}
                                            </p>
                                            <p className="text-xs text-muted truncate">{channel.game}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            {channel.viewers}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            {liveChannels.length > 5 && (
                                <button className="flex items-center gap-1 px-3 py-3 text-xs text-primary hover:text-primary-hover transition-colors font-bold uppercase tracking-wide">
                                    Show more <ChevronRight size={14} />
                                </button>
                            )}
                        </>
                    ) : (
                        // Mini mode: just show avatars of live channels
                        <div className="flex flex-col gap-3 items-center mt-2">
                            {liveChannels.map((channel) => (
                                <Link
                                    key={channel.id}
                                    href={`/live/${channel.id}`}
                                    className="relative group w-10 h-10"
                                    title={`${channel.name} playing ${channel.game}`}
                                >
                                    <img
                                        src={channel.avatar}
                                        alt={channel.name}
                                        className="w-full h-full rounded-full object-cover ring-2 ring-transparent hover:ring-destructive transition-all"
                                    />
                                    <div className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full border-2 border-background" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
