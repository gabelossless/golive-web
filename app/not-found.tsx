'use client';

import Link from 'next/link';
import { Home, Frown } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
            <div className="w-24 h-24 bg-surface rounded-3xl flex items-center justify-center animate-bounce">
                <Frown size={48} className="text-primary" />
            </div>
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter">404</h1>
                <h2 className="text-xl font-bold text-muted">Page Not Found</h2>
            </div>
            <p className="text-muted max-w-md">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                href="/"
                className="btn btn-primary px-8 py-3 rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform"
            >
                <Home size={18} />
                GO HOME
            </Link>
        </div>
    );
}
