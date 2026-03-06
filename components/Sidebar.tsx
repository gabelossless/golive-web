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
    { icon: Radio, label: 'Live', path: '/live', color: '#ef4444' },
    { icon: Gamepad2, label: 'Gaming', path: '/gaming' },
    { icon: Music2, label: 'Music', path: '/music' },
    { icon: Trophy, label: 'Sports', path: '/sports' },
];

const sidebarBase: React.CSSProperties = {
    position: 'fixed',
    top: '56px',
    left: 0,
    bottom: 0,
    zIndex: 40,
    background: '#0f0f0f',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '12px',
    scrollbarWidth: 'none',
};

const divider: React.CSSProperties = {
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
    margin: '12px 16px',
};

const sectionLabel: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    padding: '0 12px 8px 12px',
};

interface SidebarProps { isCollapsed: boolean; }

export default function Sidebar({ isCollapsed }: SidebarProps) {
    const pathname = usePathname();

    if (isCollapsed) {
        return (
            <aside style={{ ...sidebarBase, width: '72px', alignItems: 'center', paddingTop: '8px' }}>
                {menuItems.map(item => {
                    const active = pathname === item.path;
                    return (
                        <Link key={item.label} href={item.path} title={item.label} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            padding: '12px 8px', width: '100%', textDecoration: 'none',
                            color: active ? '#fff' : '#9ca3af',
                            background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                            borderRadius: '12px', margin: '1px 4px',
                        }}>
                            <item.icon size={20} />
                            <span style={{ fontSize: '10px', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
                        </Link>
                    );
                })}
                <div style={divider} />
                {exploreItems.map(item => (
                    <Link key={item.label} href={item.path} title={item.label} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        padding: '12px 8px', width: '100%', textDecoration: 'none',
                        color: item.color || '#9ca3af', borderRadius: '12px', margin: '1px 4px',
                    }}>
                        <item.icon size={20} color={item.color || '#9ca3af'} />
                        <span style={{ fontSize: '10px', textAlign: 'center', lineHeight: 1.2, color: '#9ca3af' }}>{item.label}</span>
                    </Link>
                ))}
            </aside>
        );
    }

    return (
        <aside style={{ ...sidebarBase, width: '240px' }}>
            {/* Main nav */}
            <div style={{ padding: '0 12px' }}>
                {menuItems.map(item => <SidebarItem key={item.label} {...item} isActive={pathname === item.path} />)}
            </div>

            <div style={divider} />

            {/* Following */}
            <div style={{ padding: '0 12px' }}>
                <div style={sectionLabel}>Following</div>
                <button style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', width: '100%', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', borderRadius: '12px', fontSize: '14px' }}>
                    <ChevronDown size={18} />
                    <span>Show channels</span>
                </button>
            </div>

            <div style={divider} />

            {/* Explore */}
            <div style={{ padding: '0 12px' }}>
                <div style={sectionLabel}>Explore</div>
                {exploreItems.map(item => <SidebarItem key={item.label} {...item} isActive={false} />)}
            </div>

            <div style={divider} />

            {/* Library */}
            <div style={{ padding: '0 12px' }}>
                <div style={sectionLabel}>Library</div>
                {libraryItems.map(item => <SidebarItem key={item.label} {...item} isActive={pathname === item.path} />)}
            </div>
        </aside>
    );
}

function SidebarItem({ icon: Icon, label, path, isActive, color }: any) {
    return (
        <Link href={path} style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '8px 12px', borderRadius: '12px', textDecoration: 'none',
            color: isActive ? '#fff' : '#9ca3af',
            background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            fontWeight: isActive ? 600 : 400,
            margin: '2px 0',
            transition: 'background 0.15s',
        }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
            <Icon size={20} color={isActive ? '#fff' : (color || '#9ca3af')} />
            <span style={{ fontSize: '14px' }}>{label}</span>
        </Link>
    );
}
