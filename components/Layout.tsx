'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const handler = () => {
            setIsCollapsed(window.innerWidth < 1280);
        };
        handler();
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const sidebarWidth = isCollapsed
        ? 'var(--spacing-sidebar-mini)'
        : 'var(--spacing-sidebar)';

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
            <Navbar onMenuClick={() => setIsCollapsed((c) => !c)} />

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
