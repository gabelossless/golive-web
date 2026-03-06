'use client';

import { LayoutGrid, Zap, UserCheck, Clock, ThumbsUp, History, Users, Activity, Ghost, Disc, Dribbble, Flame, ChevronDown, Bookmark } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

interface SidebarProps {
    isOpen: boolean;
}

// Temporary Mock Data Mapping until real data is requested
const MOCK_USERS = [
    { id: "1", name: "Ninja", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ninja", isLive: true },
    { id: "2", name: "Valkyrae", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Valkyrae", isLive: false },
    { id: "3", name: "SypherPK", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SypherPK", isLive: true },
];

const MOCK_VIDEOS = [
    {
        id: "v1",
        title: "100 Players Simulate CIVILIZATION in Minecraft",
        thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop",
        creator: { name: "MrBeast Gaming" }
    },
    {
        id: "v2",
        title: "I Built a Secret Room in My House!",
        thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop",
        creator: { name: "Dude Perfect" }
    },
    {
        id: "v3",
        title: "Testing Viral TikTok Gadgets",
        thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2672&auto=format&fit=crop",
        creator: { name: "Marques Brownlee" }
    }
];

export default function Sidebar({ isOpen }: SidebarProps) {
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutGrid, label: "Home", path: "/" },
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
        { icon: Ghost, label: "Gaming", path: "/gaming" },
        { icon: Disc, label: "Music", path: "/music" },
        { icon: Dribbble, label: "Sports", path: "/sports" },
    ];

    const recentlyViewed = MOCK_VIDEOS.slice(0, 3);

    if (!isOpen) {
        return (
            <aside className="hidden md:flex w-20 flex-col items-center py-4 gap-6 bg-[#0a0a0a] border-r border-white/5">
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.path}
                        title={item.label}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/5 transition-colors",
                            pathname === item.path ? "text-[#FFB800]" : "text-gray-400"
                        )}
                    >
                        <item.icon size={20} />
                        <span className="text-[10px]">{item.label}</span>
                    </Link>
                ))}
                <hr className="w-8 border-white/10" />
                <div className="flex flex-col items-center gap-4">
                    {MOCK_USERS.slice(0, 3).map(user => (
                        <Link key={user.id} href={`/profile/${user.name}`} className="relative" title={user.name}>
                            <img src={user.avatar} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                            {user.isLive && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFB800] rounded-full border-2 border-[#0a0a0a]" />}
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
                    {MOCK_USERS.map((user) => (
                        <Link
                            key={user.id}
                            href={`/profile/${user.name}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                            <div className="relative">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-7 h-7 rounded-full object-cover border border-white/10"
                                    referrerPolicy="no-referrer"
                                />
                                {user.isLive && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFB800] rounded-full border-2 border-[#0a0a0a]" />
                                )}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium truncate text-gray-200 group-hover:text-white">{user.name}</span>
                                {user.isLive && <span className="text-[10px] text-[#FFB800] font-bold">LIVE</span>}
                            </div>
                            {user.isLive && (
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />
                                    <span className="text-[10px] text-gray-400">45K</span>
                                </div>
                            )}
                        </Link>
                    ))}
                    <button title="Show more" className="w-full flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <ChevronDown size={18} />
                        <span className="text-sm">Show 12 more</span>
                    </button>
                </div>
            </div>

            <hr className="my-4 border-white/10 mx-4" />

            <div className="px-3">
                <h3 className="px-3 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Recents</h3>
                <div className="space-y-3 px-3">
                    {recentlyViewed.map((video) => (
                        <Link
                            key={video.id}
                            href={`/watch/${video.id}`}
                            title={video.title}
                            className="flex gap-3 group"
                        >
                            <div className="relative w-20 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                            </div>
                            <div className="flex flex-col min-w-0 justify-center">
                                <h4 className="text-xs font-semibold line-clamp-1 text-gray-300 group-hover:text-white">{video.title}</h4>
                                <p className="text-[10px] text-gray-500 truncate">{video.creator.name}</p>
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
