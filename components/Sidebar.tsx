'use client';

import { LayoutGrid, Zap, UserCheck, Clock, ThumbsUp, History, Bookmark, Film, Flame, Activity, Disc } from "lucide-react";
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
    const [subscriptions, setSubscriptions] = useState<{ id: string; username: string; avatar_url: string | null; is_live: boolean }[]>([]);
    const [recentVideos, setRecentVideos] = useState<{ id: string; title: string; thumbnail_url: string | null; profiles: { username: string } | null }[]>([]);

    useEffect(() => {
        async function loadSidebarData() {
            if (!user) return;
            // Load subscriptions
            const { data: subs } = await supabase
                .from('subscriptions')
                .select('channel_id, profiles!subscriptions_channel_id_fkey(id, username, avatar_url, is_live)')
                .eq('subscriber_id', user.id)
                .limit(6);
            if (subs) {
                setSubscriptions(subs.map((s: any) => ({
                    id: s.profiles?.id,
                    username: s.profiles?.username || 'Unknown',
                    avatar_url: s.profiles?.avatar_url,
                    is_live: s.profiles?.is_live || false,
                })).filter(s => s.id));
            }
            // Load recent public videos
            const { data: vids } = await supabase
                .from('videos')
                .select('id, title, thumbnail_url, profiles(username)')
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
            <aside className="hidden md:flex w-20 flex-col items-center py-4 gap-6 bg-[#0a0a0a] border-r border-white/5">
                {menuItems.map((item) => (
                    <Link key={item.label} href={item.path} title={item.label}
                        className={cn("flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/5 transition-colors", pathname === item.path ? "text-[#FFB800]" : "text-gray-400")}>
                        <item.icon size={20} />
                        <span className="text-[10px]">{item.label}</span>
                    </Link>
                ))}
                <hr className="w-8 border-white/10" />
                <div className="flex flex-col items-center gap-4">
                    {subscriptions.slice(0, 3).map(sub => (
                        <Link key={sub.id} href={`/profile/${sub.username}`} className="relative" title={sub.username}>
                            <img src={sub.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.username}`} className="w-8 h-8 rounded-full border border-white/10" alt={sub.username} />
                            {sub.is_live && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFB800] rounded-full border-2 border-[#0a0a0a]" />}
                        </Link>
                    ))}
                </div>
            </aside>
        );
    }

    return (
        <aside className="hidden md:flex w-64 flex-col py-4 overflow-y-auto scrollbar-hide bg-[#0a0a0a] border-r border-white/5 shrink-0">
            <div className="px-3 space-y-1">
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.label}
                        {...item}
                        isActive={pathname === item.path}
                    />
                ))}
            </div>

            <hr className="my-4 border-white/10 mx-4" />

            <div className="px-3">
                <h3 className="px-3 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Following</h3>
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
                                <span className="text-sm font-medium truncate text-gray-200 group-hover:text-white">{sub.username}</span>
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
                                <p className="text-[10px] text-gray-500 truncate">{video.profiles?.username || 'Unknown'}</p>
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
                <h3 className="px-3 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Explore</h3>
                <div className="space-y-1">
                    {exploreItems.map((item) => (
                        <SidebarItem key={item.label} {...item} />
                    ))}
                </div>
            </div>

            <hr className="my-4 border-white/10 mx-4" />

            <div className="px-3">
                <h3 className="px-3 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Library</h3>
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
                "flex items-center gap-4 px-3 py-2 rounded-xl transition-all duration-200 group",
                isActive ? "bg-white/10 font-medium" : "hover:bg-white/5"
            )}
        >
            <Icon size={20} className={cn(isActive ? "text-[#FFB800]" : "text-gray-400 group-hover:text-white", color)} />
            <span className={cn("text-sm", isActive ? "text-white" : "text-gray-400 group-hover:text-white")}>
                {label}
            </span>
        </Link>
    );
}
