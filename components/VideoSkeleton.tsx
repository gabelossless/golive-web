'use client';

import { motion } from 'motion/react';

export default function VideoSkeleton() {
    return (
        <div className="flex flex-col gap-3 animate-pulse">
            {/* Thumbnail */}
            <div className="aspect-video rounded-xl bg-white/5" />
            
            <div className="flex gap-3 mt-1">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-white/5 shrink-0" />
                
                <div className="flex-1 space-y-2">
                    {/* Title */}
                    <div className="h-4 bg-white/10 rounded w-[90%]" />
                    <div className="h-4 bg-white/10 rounded w-[60%]" />
                    
                    {/* Meta */}
                    <div className="flex gap-2 mt-2">
                        <div className="h-3 bg-white/5 rounded w-16" />
                        <div className="h-3 bg-white/5 rounded w-12" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ShortsSkeleton() {
    return (
        <div className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />
    );
}
