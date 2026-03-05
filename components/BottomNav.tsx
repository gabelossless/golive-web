'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusCircle, PlaySquare, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function BottomNav() {
    const pathname = usePathname();
    const { profile, user } = useAuth();

    const profileHref = profile?.username ? `/profile/${profile.username}` : '/login';

    const navItems = [
        { icon: Home, label: 'Home', href: '/' },
        { icon: Compass, label: 'Explore', href: '/trending' },
        { icon: PlusCircle, label: 'Create', href: '/upload', isPrimary: true },
        { icon: PlaySquare, label: 'Subs', href: '/subscriptions' },
        { icon: User, label: 'You', href: profileHref },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Frosted glass bar */}
            <div className="bg-[#0a0a0f]/90 backdrop-blur-2xl border-t border-white/6">
                <div className="flex items-center justify-around px-2 h-[60px] safe-area-inset-bottom">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 ${isActive ? 'text-violet-400' : 'text-muted-2 hover:text-foreground'}`}
                            >
                                {item.isPrimary ? (
                                    <div className="relative -mt-5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-500/40">
                                            <item.icon size={24} className="text-white" strokeWidth={2} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`relative flex items-center justify-center w-10 h-6 rounded-full transition-all ${isActive ? 'bg-violet-500/20' : ''}`}>
                                            <item.icon
                                                size={22}
                                                strokeWidth={isActive ? 2.5 : 1.8}
                                                fill={isActive ? 'currentColor' : 'none'}
                                            />
                                            {isActive && item.label === 'You' && user && (
                                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-background" />
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-medium tracking-wide transition-colors ${isActive ? 'text-violet-400' : 'text-muted'}`}>
                                            {item.label}
                                        </span>
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
