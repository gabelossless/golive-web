'use client';

import { LayoutGrid, Zap, UserCheck, Bookmark, PlusCircle } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

export default function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        { label: "Home", icon: LayoutGrid, path: "/" },
        { label: "Explore", icon: Zap, path: "/trending" },
        { label: "Create", icon: PlusCircle, path: "/upload", isAction: true },
        { label: "Following", icon: UserCheck, path: "/subscriptions" },
        { label: "Saved", icon: Bookmark, path: "/liked" },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-white/5 px-2 py-1 z-50 flex items-center justify-around h-16 shrink-0">
            {navItems.map((item) => {
                const isActive = pathname === item.path;

                if (item.isAction) {
                    return (
                        <Link
                            key={item.label}
                            href={item.path}
                            className="flex flex-col items-center justify-center p-2 text-white"
                        >
                            <item.icon size={32} className="text-[#FFB800] drop-shadow-[0_0_10px_rgba(255,184,0,0.3)]" />
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.label}
                        href={item.path}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 gap-1 transition-all duration-300",
                            isActive ? "text-[#FFB800] scale-110" : "text-gray-500"
                        )}
                    >
                        <item.icon size={20} fill={isActive && !item.isAction ? "currentColor" : "none"} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
