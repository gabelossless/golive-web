'use client';

import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, Radio, Gamepad2, Music2, Trophy, Flame, ChevronDown, Upload, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface SidebarProps {
    isCollapsed: boolean;
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Flame, label: 'Trending', path: '/trending' },
    { icon: PlaySquare, label: 'Subscriptions', path: '/subscriptions' },
];

const libraryItems = [
    { icon: History, label: 'History', path: '/history' },
    { icon: Clock, label: 'Watch Later', path: '/liked' },
    { icon: ThumbsUp, label: 'Liked Videos', path: '/liked' },
];

const exploreItems = [
    { icon: Radio, label: 'Live', path: '/studio/golive', color: 'text-red-500' },
    { icon: Gamepad2, label: 'Gaming', path: '/trending' },
    { icon: Music2, label: 'Music', path: '/trending' },
    { icon: Trophy, label: 'Sports', path: '/trending' },
];

function SidebarItem({ icon: Icon, label, path, isActive, color, collapsed }: {
    icon: any; label: string; path: string; isActive?: boolean; color?: string; collapsed?: boolean;
}) {
    return (
        <Link
            href={path}
            className={cn(
                'flex items-center gap-4 rounded-xl transition-all duration-200 group',
                collapsed ? 'flex-col gap-1 px-2 py-3 mx-1' : 'px-3 py-2',
                isActive ? 'bg-white/10 font-medium' : 'hover:bg-white/5'
            )}
        >
            <Icon size={collapsed ? 20 : 20} className={cn(isActive ? 'text-white' : 'text-gray-400 group-hover:text-white', color)} />
            {!collapsed && (
                <span className={cn('text-sm', isActive ? 'text-white' : 'text-gray-400 group-hover:text-white')}>
                    {label}
                </span>
            )}
            {collapsed && (
                <span className="text-[10px] text-gray-400 group-hover:text-white">{label}</span>
            )}
        </Link>
    );
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();

    if (isCollapsed) {
        return (
            <aside
                className="fixed top-14 left-0 bottom-0 z-40 flex flex-col items-center py-4 gap-2 bg-[#0f0f0f] border-r border-white/5 overflow-y-auto scrollbar-hide"
                style={{ width: 'var(--spacing-sidebar-mini)' }}
            >
                {menuItems.map((item) => (
                    <SidebarItem key={item.label} {...item} isActive={pathname === item.path} collapsed />
                ))}
                <hr className="w-10 border-white/10 my-1" />
                {libraryItems.map((item) => (
                    <SidebarItem key={item.label} {...item} isActive={pathname === item.path} collapsed />
                ))}
                <hr className="w-10 border-white/10 my-1" />
                {exploreItems.map((item) => (
                    <SidebarItem key={item.label} {...item} collapsed />
                ))}
                {user && (
                    <>
                        <hr className="w-10 border-white/10 my-1" />
                        <SidebarItem icon={Upload} label="Upload" path="/upload" collapsed />
                        <SidebarItem icon={Settings} label="Studio" path="/studio" collapsed />
                    </>
                )}
            </aside>
        );
    }

    return (
        <aside
            className="fixed top-14 left-0 bottom-0 z-40 flex flex-col py-4 overflow-y-auto scrollbar-hide bg-[#0f0f0f] border-r border-white/5"
            style={{ width: 'var(--spacing-sidebar)' }}
        >
            <div className="px-3 space-y-1">
                {menuItems.map((item) => (
                    <SidebarItem key={item.label} {...item} isActive={pathname === item.path} />
                ))}
            </div>

            <hr className="my-4 border-white/10 mx-4" />

            <div className="px-3 space-y-1">
                <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Library</h3>
                {libraryItems.map((item) => (
                    <SidebarItem key={item.label} {...item} isActive={pathname === item.path} />
                ))}
            </div>

            <hr className="my-4 border-white/10 mx-4" />

            <div className="px-3 space-y-1">
                <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Explore</h3>
                {exploreItems.map((item) => (
                    <SidebarItem key={item.label} {...item} />
                ))}
            </div>

            {user && (
                <>
                    <hr className="my-4 border-white/10 mx-4" />
                    <div className="px-3 space-y-1">
                        <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Creator</h3>
                        <SidebarItem icon={Upload} label="Upload Video" path="/upload" />
                        <SidebarItem icon={Settings} label="Creator Studio" path="/studio" />
                    </div>
                </>
            )}
        </aside>
    );
}
