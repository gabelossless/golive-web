'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, PlaySquare, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function BottomNav() {
    const pathname = usePathname();
    const { profile } = useAuth();

    const navItems = [
        { icon: Home, label: 'Home', href: '/' },
        { icon: Compass, label: 'Explore', href: '/trending' },
        { icon: Plus, label: '', href: '/upload', isCreate: true },
        { icon: PlaySquare, label: 'Subs', href: '/subscriptions' },
        { icon: User, label: 'You', href: profile?.username ? `/profile/${profile.username}` : '/login' },
    ];

    return (
        <div className="bottom-nav md:hidden">
            {navItems.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                    <Link key={item.label || 'create'} href={item.href} className="flex-1">
                        {item.isCreate ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#9147ff' }}>
                                    <item.icon size={20} className="text-white" strokeWidth={2.5} />
                                </div>
                            </div>
                        ) : (
                            <div className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} fill={isActive ? 'currentColor' : 'none'} />
                                <span>{item.label}</span>
                            </div>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
