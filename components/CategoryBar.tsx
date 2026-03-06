'use client';

import { useState } from 'react';

const CATEGORIES = [
    'All', 'Gaming', 'Technology', 'Music', 'Live',
    'Education', 'Entertainment', 'Just Chatting', 'Sports',
];

interface CategoryBarProps {
    onSelect?: (cat: string) => void;
}

export default function CategoryBar({ onSelect }: CategoryBarProps) {
    const [active, setActive] = useState('All');

    const handleClick = (cat: string) => {
        setActive(cat);
        onSelect?.(cat);
    };

    return (
        <div style={{
            position: 'sticky',
            top: '56px',
            zIndex: 40,
            background: 'rgba(15,15,15,0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '12px 16px',
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            scrollbarWidth: 'none',
        }}>
            {CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => handleClick(cat)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        border: 'none',
                        background: active === cat ? '#fff' : 'rgba(255,255,255,0.1)',
                        color: active === cat ? '#000' : '#fff',
                        transition: 'all 0.15s',
                    }}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
