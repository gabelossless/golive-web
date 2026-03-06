'use client';

import { Menu, Search, Video, Bell, User, Mic, Camera } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface NavbarProps {
    onMenuClick: () => void;
}

const s = {
    nav: {
        position: 'fixed' as const,
        top: 0, left: 0, right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        height: '56px',
        background: 'rgba(15,15,15,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
    },
    iconBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '8px', borderRadius: '50%', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
    },
};

export default function Navbar({ onMenuClick }: NavbarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    };

    return (
        <nav style={s.nav}>
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={onMenuClick} title="Menu" style={s.iconBtn}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Menu size={24} />
                </button>
                <Link href="/" title="GoLive Home" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#fff' }}>
                    <div style={{ position: 'relative' }}>
                        <Video style={{ color: '#dc2626' }} size={28} fill="currentColor" />
                        <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '7px', height: '7px', background: '#9147ff', borderRadius: '50%' }} />
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', marginLeft: '4px' }}>
                        Go<span style={{ color: '#9147ff' }}>Live</span>
                    </span>
                </Link>
            </div>

            {/* Center: Search */}
            <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '640px', margin: '0 16px', display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', background: '#121212', border: '1px solid #3f3f3f', borderRadius: '20px 0 0 20px', padding: '6px 16px', gap: '8px' }}>
                    <Search size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        title="Search"
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '14px' }}
                    />
                </div>
                <button type="submit" title="Search"
                    style={{ background: '#222', border: '1px solid #3f3f3f', borderLeft: 'none', borderRadius: '0 20px 20px 0', padding: '6px 20px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Search size={18} />
                </button>
                <button type="button" title="Search with your voice"
                    style={{ marginLeft: '12px', background: '#181818', border: 'none', borderRadius: '50%', padding: '10px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic size={18} />
                </button>
            </form>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link href="/upload" title="Upload" style={{ ...s.iconBtn, textDecoration: 'none' }}>
                    <Camera size={22} />
                </Link>
                <button title="Notifications" style={s.iconBtn}>
                    <Bell size={22} />
                </button>
                {user ? (
                    <Link href="/studio" title="Studio"
                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #9147ff, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff' }}>
                        <User size={18} />
                    </Link>
                ) : (
                    <Link href="/login" title="Sign in"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '20px', border: '1px solid #9147ff', color: '#9147ff', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                        <User size={15} /> Sign in
                    </Link>
                )}
            </div>
        </nav>
    );
}
