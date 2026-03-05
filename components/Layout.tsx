'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const handler = () => {
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            } else if (window.innerWidth < 1280) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };
        handler();
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const sidebarWidth = isCollapsed
        ? 'var(--spacing-sidebar-mini)'
        : 'var(--spacing-sidebar)';

    return (
        <div style={{ background: 'var(--color-background)', minHeight: '100vh' }}>
            <Navbar onMenuClick={() => setIsCollapsed((c) => !c)} />

            <div style={{ display: 'flex', paddingTop: 'var(--spacing-header)' }}>
                <Sidebar isCollapsed={isCollapsed} />
                <main
                    className="flex-1 min-w-0 pb-16 md:pb-6"
                    style={{
                        marginLeft: sidebarWidth,
                        transition: 'margin-left 0.2s ease',
                    }}
                >
                    <div
                        className="mx-auto page-content"
                        style={{ maxWidth: 1600, padding: '12px 16px 24px' }}
                    >
                        {children}
                    </div>
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
