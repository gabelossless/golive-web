'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Handle responsive auto-collapse
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsMobile(true);
                setIsSidebarCollapsed(true);
            } else {
                setIsMobile(false);
                setIsSidebarCollapsed(false);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const sidebarWidth = isMobile
        ? '0px' // Hidden on mobile unless we add a drawer (future)
        : isSidebarCollapsed
            ? 'var(--spacing-sidebar-collapsed)'
            : 'var(--spacing-sidebar)';

    return (
        <div className="min-h-screen sidebar-transition-wrapper" style={{ background: 'var(--color-background)' }}>
            <Navbar onMenuClick={toggleSidebar} />
            <div className="flex" style={{ paddingTop: 'var(--spacing-header)' }}>
                <Sidebar isCollapsed={isSidebarCollapsed} />
                <main
                    className="flex-1 p-4 md:p-6 pb-20 md:pb-6 transition-all duration-300 ease-in-out"
                    style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
                >
                    <div className="max-w-[1800px] mx-auto animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </div>
            <BottomNav />
            {/* Mobile sidebar overlay (optional for future, currently hidden on mobile main view) */}
            <style>{`
                :root {
                    --spacing-sidebar-collapsed: 72px;
                }
            `}</style>
        </div>
    );
}
