'use client';

import { useState } from "react";

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

const CATEGORIES = [
    "All",
    "Gaming",
    "Music",
    "Sports",
    "Tech",
    "React",
    "TypeScript",
    "Design",
    "Web Dev",
    "Podcasts",
    "Live",
    "Recent",
];

export default function CategoryBar({ onSelect }: { onSelect?: (cat: string) => void }) {
    const [active, setActive] = useState("All");

    const handleSelect = (cat: string) => {
        setActive(cat);
        if (onSelect) onSelect(cat);
    };

    return (
        <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm px-2 sm:px-4 py-2 sm:py-3 flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide border-b border-white/5 shrink-0">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    onClick={() => handleSelect(cat)}
                    className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                        active === cat
                            ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
