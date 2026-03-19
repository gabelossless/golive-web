'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    Users, 
    Video, 
    ShieldAlert, 
    BarChart3, 
    Settings, 
    ArrowLeft,
    Zap
} from 'lucide-react';

const ADMIN_MENU = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Zap, label: 'Bots', path: '/admin/bots' },
    { icon: Video, label: 'Videos', path: '/admin/videos' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings-admin' },
    { icon: Zap, label: 'Stimulus', path: '/admin/stimulus' },
    { icon: ShieldAlert, label: 'Documentation', path: '/admin/help' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-[#050505] text-white">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#050505] flex flex-col shrink-0">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2 mb-8 group overflow-hidden">
                        <div className="relative">
                            <Zap className="text-[#FFB800] group-hover:rotate-12 transition-transform" size={24} fill="currentColor" />
                            <div className="absolute -inset-1 bg-[#FFB800]/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-lg font-black tracking-tighter">
                            VIBE<span className="text-[#FFB800]">ADMIN</span>
                        </span>
                    </Link>

                    <nav className="space-y-1">
                        {ADMIN_MENU.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.path}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                                        ${isActive 
                                            ? 'bg-[#FFB800] text-black font-bold' 
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                                    `}
                                >
                                    <item.icon size={20} className={isActive ? 'text-black' : 'group-hover:text-[#FFB800]'} />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 space-y-4">
                    <div className="p-4 rounded-2xl bg-[#FFB800]/5 border border-[#FFB800]/10">
                        <div className="flex items-center gap-2 text-[#FFB800] mb-2">
                            <ShieldAlert size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FFB800]">Admin Access</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                            High-privilege zone. All actions are logged for security.
                        </p>
                    </div>

                    <Link 
                        href="/" 
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to App
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
                    <h1 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">
                        {ADMIN_MENU.find(m => m.path === pathname)?.label || 'Administration'}
                    </h1>
                    
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-500 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            System Online
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
