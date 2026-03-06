'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const AUTH_ROUTES = ['/login', '/register', '/auth/callback'];

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Auth pages: no navbar/sidebar
    if (AUTH_ROUTES.includes(pathname)) {
        return (
            <div className="min-h-screen" style={{ background: 'var(--background)' }}>
                {children}
            </div>
        );
    }

    return (
        <LayoutWithNav isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
            {children}
        </LayoutWithNav>
    );
}

function LayoutWithNav({
    children,
    isCollapsed,
    setIsCollapsed,
}: {
    children: React.ReactNode;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
}) {
    useEffect(() => {
        const handler = () => setIsCollapsed(window.innerWidth < 1280);
        handler();
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const sidebarWidth = isCollapsed
        ? 'var(--spacing-sidebar-mini)'
        : 'var(--spacing-sidebar)';

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
            <Navbar onMenuClick={() => setIsCollapsed(!isCollapsed)} />

            <div className="flex" style={{ paddingTop: 'var(--spacing-header)' }}>
                <Sidebar isCollapsed={isCollapsed} />
                <main
                    className="flex-1 min-w-0 pb-16 md:pb-6 overflow-x-hidden"
                    style={{
                        marginLeft: sidebarWidth,
                        transition: 'margin-left 0.2s ease',
                        minHeight: 'calc(100vh - var(--spacing-header))',
                    }}
                >
                    {children}
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
