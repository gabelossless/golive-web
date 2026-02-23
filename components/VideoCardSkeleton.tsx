'use client';

import React from 'react';

export function VideoCardSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="bg-surface rounded-xl" style={{ aspectRatio: '16/9' }} />
            <div className="flex gap-3 mt-3 px-0.5">
                <div className="w-9 h-9 rounded-full bg-surface flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 bg-surface rounded-md w-full" />
                    <div className="h-3.5 bg-surface rounded-md w-3/4" />
                    <div className="h-3 bg-surface rounded-md w-1/2" />
                </div>
            </div>
        </div>
    );
}
