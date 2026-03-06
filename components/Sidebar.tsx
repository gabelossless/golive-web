'use client';

import { Home, Compass, PlaySquare, History, Clock, ThumbsUp, Radio, Gamepad2, Music2, Trophy, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Compass, label: 'Explore', path: '/trending' },
    { icon: PlaySquare, label: 'Subscriptions', path: '/subscriptions' },
];

const libraryItems = [
    { icon: History, label: 'History', path: '/history' },
    { icon: Clock, label: 'Watch Later', path: '/watch-later' },
    { icon: ThumbsUp, label: 'Liked Videos', path: '/liked' },
];

const exploreItems = [
    { icon: Radio, label: 'Live', path: '/live', color: 'text-red-500' },
    { icon: Gamepad2, label: 'Gaming', path: '/gaming' },
    { icon: Music2, label: 'Music', path: '/music' },
    { icon: Trophy, label: 'Sports', path: '/sports' },
];

interface SidebarProps {
    isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
    const pathname = usePathname();

    if (isCollapsed) {
        return (
            <aside
                className="fixed top-14 left-0 bottom-0 z-40 flex flex-col items-center py-3 gap-2 bg-[#0f0f0f] border-r border-white/5 overflow-y-auto scrollbar-hide"
                style={{ width: '72px' }}
            >
                {menuItems.map(item => (
                    <Link
                        key={item.label}
                        href={item.path}
                        className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl w-full hover:bg-white/5 transition-colors ${pathname === item.path ? 'bg-white/10' : ''}`}
                    >
                        <item.icon size={20} className={pathname === item.path ? 'text-white' : 'text-gray-400'} />
                        <span className="text-[10px] text-gray-400 text-center leading-tight">{item.label}</span>
                    </Link>
                ))}
                <hr className="w-8 border-white/10 my-1" />
                {exploreItems.map(item => (
                    <Link
                        key={item.label}
                        href={item.path}
                        className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl w-full hover:bg-white/5 transition-colors"
                    >
                        <item.icon size={20} className={`${item.color || 'text-gray-400'}`} />
                        <span className="text-[10px] text-gray-400 text-center leading-tight">{item.label}</span>
                    </Link>
                ))}
            </aside>
        );
    }

    return (
        <aside
            className="fixed top-14 left-0 bottom-0 z-40 flex flex-col py-3 bg-[#0f0f0f] border-r border-white/5 overflow-y-auto scrollbar-hide"
            style={{ width: '240px' }}
        >
            {/* Main nav */}
            <div className="px-3 space-y-0.5">
                {menuItems.map(item => (
                    <SidebarItem key={item.label} {...item} isActive={pathname === item.path} />
                ))}
            </div>

            <hr className="my-3 border-white/10 mx-4" />

            {/* Following (placeholder) */}
            <div className="px-3">
                <h3 className="px-3 mb-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Following</h3>
                <button className="w-full flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <ChevronDown size={18} />
                    <span className="text-sm">Show channels</span>
                </button>
            </div>

            <hr className="my-3 border-white/10 mx-4" />

            {/* Explore */}
            <div className="px-3">
                <h3 className="px-3 mb-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Explore</h3>
                <div className="space-y-0.5">
                    {exploreItems.map(item => (
                        <SidebarItem key={item.label} {...item} isActive={false} />
                    ))}
                </div>
            </div>

            <hr className="my-3 border-white/10 mx-4" />

            {/* Library */}
            <div className="px-3">
                <h3 className="px-3 mb-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Library</h3>
                <div className="space-y-0.5">
                    {libraryItems.map(item => (
                        <SidebarItem key={item.label} {...item} isActive={pathname === item.path} />
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
            className={`flex items-center gap-4 px-3 py-2 rounded-xl transition-all duration-150 group ${isActive ? 'bg-white/10 font-medium' : 'hover:bg-white/5'}`}
        >
            <Icon size={20} className={isActive ? 'text-white' : `text-gray-400 group-hover:text-white ${color || ''}`} />
            <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{label}</span>
        </Link>
    );
}
