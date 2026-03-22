'use client';

import { useState } from "react";

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

const CATEGORIES = [
    "All",
    "Gaming",
    "Music",
    "Live",
    "Trending",
    "Shorts",
    "Tech",
    "Web Dev",
    "Design",
    "Podcasts",
    "Recent",
];

interface CategoryBarProps {
    onSelect?: (cat: string) => void;
    activeCategory?: string;
    className?: string;
}

export default function CategoryBar({ onSelect, activeCategory = "All", className }: CategoryBarProps) {
    const [active, setActive] = useState(activeCategory);

    const handleSelect = (cat: string) => {
        setActive(cat);
        if (onSelect) onSelect(cat);
    };

    return (
        <div className={cn(
            "sticky top-[64px] md:top-[80px] z-40 glass-deep px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar scrollbar-hide border-b border-white/5 shrink-0 transition-all md:mx-2 md:my-2 md:rounded-2xl",
            className
        )}>
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    onClick={() => handleSelect(cat)}
                    className={cn(
                        "px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap border",
                        active === cat
                            ? "bg-white text-black border-white shadow-xl shadow-white/10 scale-105"
                            : "bg-white/[0.03] text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white"
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
