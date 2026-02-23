'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-[400px] group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-muted group-focus-within:text-primary transition-colors" />
            </div>
            <input
                type="text"
                placeholder="Search..."
                className="w-full bg-surface border border-border/50 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium placeholder:font-normal"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="sr-only">Search</button>
        </form>
    );
}
