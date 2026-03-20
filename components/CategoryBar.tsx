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
        <div className="sticky top-[80px] z-40 glass-deep px-6 py-4 flex gap-3 overflow-x-auto scrollbar-hide border-b border-white/5 shrink-0 transition-all mx-2 my-2 rounded-3xl">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    onClick={() => handleSelect(cat)}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap border border-white/5",
                        active === cat
                            ? "bg-white text-black shadow-xl shadow-white/10 scale-105"
                            : "bg-white/[0.03] text-zinc-500 hover:bg-white/10 hover:text-white"
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
