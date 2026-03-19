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
        <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-white/5 shrink-0 transition-all">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    onClick={() => handleSelect(cat)}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap",
                        active === cat
                            ? "bg-white text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
