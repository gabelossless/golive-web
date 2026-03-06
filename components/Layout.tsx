'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const AUTH_ROUTES = ['/login', '/register', '/auth/callback'];

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuth = AUTH_ROUTES.includes(pathname);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isAuth) {
        return <>{children}</>;
    }

    if (!hydrated) {
        return <div className="min-h-screen bg-[#0a0a0a]" />; // Empty state until hydration to prevent flash
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0a] text-white pb-16 md:pb-0">
            <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} />

                <main className="flex-1 overflow-y-auto scrollbar-hide relative">
                    {children}
                </main>
            </div>

            <MobileNav />
        </div>
    );
}
