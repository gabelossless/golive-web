'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AUTH_ROUTES = ['/login', '/register', '/auth/callback'];

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuth = AUTH_ROUTES.includes(pathname);

    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const check = () => setIsCollapsed(window.innerWidth < 1280);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (isAuth) {
        return <>{children}</>;
    }

    const sidebarW = isCollapsed ? 72 : 240;

    return (
        <div style={{ background: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>
            <Navbar onMenuClick={() => setIsCollapsed(c => !c)} />
            <Sidebar isCollapsed={isCollapsed} />
            <main
                style={{
                    marginTop: '56px',
                    marginLeft: `${sidebarW}px`,
                    minHeight: 'calc(100vh - 56px)',
                    transition: 'margin-left 0.2s ease',
                }}
            >
                {children}
            </main>
        </div>
    );
}
