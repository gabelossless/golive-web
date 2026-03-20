'use client';

import { LayoutGrid, Zap, UserCheck, Clock, ThumbsUp, History, Bookmark, Film, Flame, Activity, Disc, LayoutDashboard, Sparkles, Plus, User } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

interface SidebarProps {
    isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const [subscriptions, setSubscriptions] = useState<{ id: string; username: string; displayName: string; avatar_url: string | null; is_live: boolean }[]>([]);
    const [recentVideos, setRecentVideos] = useState<{ id: string; title: string; thumbnail_url: string | null; profiles: { username: string; channel_name?: string; display_name?: string } | null }[]>([]);

    useEffect(() => {
        async function loadSidebarData() {
            if (!user) return;
            // Load subscriptions
            const { data: subs } = await supabase
                .from('subscriptions')
                .select('channel_id, profiles:channel_id!inner(id, username, avatar_url, is_live, channel_name, display_name)')
                .eq('subscriber_id', user.id);
            if (subs) {
                setSubscriptions(subs.map((s: any) => ({
                    id: s.profiles?.id,
                    username: s.profiles?.username || 'Unknown',
                    displayName: s.profiles?.channel_name || s.profiles?.display_name || s.profiles?.username || 'Unknown',
                    avatar_url: s.profiles?.avatar_url,
                    is_live: s.profiles?.is_live || false,
                })).filter(s => s.id));
            }
            // Load recent public videos
            const { data: vids } = await supabase
                .from('videos')
                .select('id, title, thumbnail_url, profiles(username, channel_name, display_name)')
                .order('created_at', { ascending: false })
                .limit(5);
            if (vids) {
                setRecentVideos(vids.map((v: any) => ({
                    ...v,
                    profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
                })));
            }
        }
        loadSidebarData();
    }, [user]);

    const menuItems = [
        { icon: LayoutGrid, label: "Home", path: "/" },
        { icon: Film, label: "Shorts", path: "/shorts" },
        { icon: Zap, label: "Explore", path: "/trending" },
        { icon: UserCheck, label: "Following", path: "/subscriptions" },
    ];

    const studioItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/studio/dashboard" },
        { icon: Sparkles, label: "AI Studio", path: "/studio/ai-studio" },
        { icon: Plus, label: "Upload", path: "/upload" },
        { icon: User, label: "Settings", path: "/studio/settings" },
    ];

    const libraryItems = [
        { icon: History, label: "History", path: "/history" },
        { icon: Clock, label: "Watch Later", path: "/watch-later" },
        { icon: ThumbsUp, label: "Liked", path: "/liked" },
        { icon: Bookmark, label: "Saved", path: "/saved" },
    ];

    const exploreItems = [
        { icon: Activity, label: "Live", path: "/live", color: "text-[#FFB800]" },
        { icon: Flame, label: "Trending", path: "/trending" },
        { icon: Disc, label: "Music", path: "/search?category=Music" },
    ];

    if (!isOpen) {
        return (
            <aside className="hidden md:flex w-24 flex-col items-center py-6 gap-8 glass-deep border border-white/5 mx-2 my-2 rounded-3xl h-[calc(100vh-16px)]">
                {menuItems.map((item) => (
                    <Link key={item.label} href={item.path} title={item.label}
                        className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 w-16 group", pathname === item.path ? "text-[#FFB800] bg-white/[0.03] shadow-lg shadow-[#FFB800]/5" : "text-gray-400")}>
                        <item.icon size={22} className={cn("transition-transform group-hover:scale-110", pathname === item.path ? "stroke-[2.5px]" : "stroke-2")} />
                        <span className="text-[9px] font-black uppercase tracking-tighter opacity-60 group-hover:opacity-100">{item.label}</span>
                    </Link>
                ))}
                <hr className="w-8 border-white/10" />
                <div className="flex flex-col items-center gap-6">
                    {subscriptions.slice(0, 4).map(sub => (
                        <Link key={sub.id} href={`/profile/${sub.username}`} className="relative group" title={sub.username}>
                            <img src={sub.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.username}`} className="w-10 h-10 rounded-2xl border border-white/10 group-hover:border-[#FFB800]/40 transition-all" alt={sub.username} />
                            {sub.is_live && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#FFB800] rounded-full border-2 border-[#111] animate-pulse" />}
                        </Link>
                    ))}
                </div>
            </aside>
        );
    }

    return (
        <aside className="hidden md:flex w-72 flex-col py-6 overflow-y-auto scrollbar-hide glass-deep border border-white/5 mx-2 my-2 rounded-[40px] h-[calc(100vh-100px)] sticky top-20">
            <div className="px-3 space-y-1">
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.label}
                        {...item}
                        isActive={pathname === item.path}
                    />
                ))}
            </div>

            {user && (
                <>
                    <hr className="my-4 border-white/10 mx-4" />
                    <div className="px-3">
                        <h3 className="px-3 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Studio</h3>
                        <div className="space-y-1">
                            {studioItems.map((item) => (
                                <SidebarItem
                                    key={item.label}
                                    {...item}
                                    isActive={pathname === item.path}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}

            <hr className="my-4 border-white/10 mx-4" />

            <div className="px-3">
                <h3 className="px-4 mb-3 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center justify-between">
                    <span>Following</span>
                    <div className="w-8 h-[1px] bg-white/10" />
                </h3>
                <div className="space-y-1">
                    {subscriptions.length === 0 ? (
                        <p className="px-3 text-xs text-gray-600 py-2">No subscriptions yet.</p>
                    ) : subscriptions.map((sub) => (
                        <Link key={sub.id} href={`/profile/${sub.username}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group">
                            <div className="relative">
                                <img src={sub.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.username}`} alt={sub.username}
                                    className="w-7 h-7 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                                {sub.is_live && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFB800] rounded-full border-2 border-[#0a0a0a]" />}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium truncate text-gray-200 group-hover:text-white">
                                    {sub.displayName}
                                </span>
                                {sub.is_live && <span className="text-[10px] text-[#FFB800] font-bold">LIVE</span>}
                            </div>
                            {sub.is_live && <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />}
                        </Link>
                    ))}
                </div>
            </div>

            <hr className="my-4 border-white/10 mx-4" />

            <div className="px-3">
                <h3 className="px-3 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Recents</h3>
                <div className="space-y-3 px-3">
                    {recentVideos.length === 0 ? (
                        <p className="text-xs text-gray-600 py-2">No videos yet — upload to get started!</p>
                    ) : recentVideos.map((video) => (
                        <Link key={video.id} href={`/watch/${video.id}`} title={video.title || ''} className="flex gap-3 group">
                            <div className="relative w-20 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                {video.thumbnail_url
                                    ? <img src={video.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={video.title || ''} />
                                    : <div className="w-full h-full flex items-center justify-center text-gray-600 text-lg">🎬</div>}
                            </div>
                            <div className="flex flex-col min-w-0 justify-center">
                                <h4 className="text-xs font-semibold line-clamp-2 text-gray-300 group-hover:text-white">{video.title}</h4>
                                <p className="text-[10px] text-gray-500 truncate">
                                    {video.profiles?.channel_name || video.profiles?.display_name || video.profiles?.username || 'Unknown'}
                                </p>
                            </div>
                        </Link>
                    ))}
                    <Link href="/history" title="View full history" className="flex items-center gap-3 py-1 text-xs font-bold text-[#FFB800] hover:underline">
                        <History size={14} /> Full History
                    </Link>
                </div>
            </div>

            <hr className="my-4 border-white/10 mx-4" />

            <div className="px-3">
                <h3 className="px-4 mb-3 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center justify-between">
                    <span>Explore</span>
                    <div className="w-8 h-[1px] bg-white/10" />
                </h3>
                <div className="space-y-1">
                    {exploreItems.map((item) => (
                        <SidebarItem key={item.label} {...item} />
                    ))}
                </div>
            </div>

            <hr className="my-4 border-white/10 mx-4 opacity-50" />

            <div className="px-3 pb-8">
                <h3 className="px-4 mb-3 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center justify-between">
                    <span>Library</span>
                    <div className="w-8 h-[1px] bg-white/10" />
                </h3>
                <div className="space-y-1">
                    {libraryItems.map((item) => (
                        <SidebarItem key={item.label} {...item} />
                    ))}
                </div>
            </div>
        </aside>
    );
}

function SidebarItem({ icon: Icon, label, path, isActive, color }: any) {
    return (
        <Link
            href={path}
            title={label}
            className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                isActive ? "bg-white/[0.04] shadow-inner" : "hover:bg-white/[0.02]"
            )}
        >
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FFB800] rounded-r-full shadow-[0_0_10px_#FFB800]" />}
            <Icon size={20} className={cn("transition-all duration-300 group-hover:scale-110", isActive ? "text-[#FFB800] drop-shadow-[0_0_5px_rgba(255,184,0,0.5)]" : "text-zinc-500 group-hover:text-white", color)} strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn("text-sm font-bold tracking-tight transition-colors", isActive ? "text-white" : "text-zinc-400 group-hover:text-white")}>
                {label}
            </span>
            {isActive && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#FFB800]" />}
        </Link>
    );
}
