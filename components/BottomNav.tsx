'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusCircle, PlaySquare, User } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: 'Home', href: '/' },
        { icon: Compass, label: 'Shorts', href: '/shorts' },
        { icon: PlusCircle, label: 'Create', href: '/upload', isPrimary: true },
        { icon: PlaySquare, label: 'Subs', href: '/subscriptions' },
        { icon: User, label: 'You', href: '/profile/FragMaster' }, // Mock user
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[60px] bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2 z-50 md:hidden">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 active:scale-90 transition-transform ${isActive ? 'text-primary' : 'text-muted hover:text-foreground'
                            }`}
                    >
                        {item.isPrimary ? (
                            <div className="bg-primary text-background p-1.5 rounded-full mb-1 shadow-lg shadow-primary/40">
                                <item.icon size={28} strokeWidth={2.5} />
                            </div>
                        ) : (
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} />
                        )}
                        {!item.isPrimary && (
                            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
