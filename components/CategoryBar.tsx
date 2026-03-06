'use client';

import { useState } from 'react';

const CATEGORIES = [
    'All', 'Gaming', 'Technology', 'Music', 'Live', 'Education', 'Entertainment', 'Just Chatting', 'Sports',
];

interface CategoryBarProps {
    onCategoryChange?: (cat: string) => void;
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

export default function CategoryBar({ onCategoryChange }: CategoryBarProps) {
    const [active, setActive] = useState('All');

    const handleClick = (cat: string) => {
        setActive(cat);
        onCategoryChange?.(cat);
    };

    return (
        <div className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur-sm px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-white/5">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    onClick={() => handleClick(cat)}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0',
                        active === cat
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
