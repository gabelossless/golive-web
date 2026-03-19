'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface SearchFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    filters: {
        date: string;
        duration: string;
        sortBy: string;
    };
    onFilterChange: (key: string, value: string) => void;
}

const DATE_OPTIONS = [
    { label: 'Any time', value: 'all' },
    { label: 'Last hour', value: 'hour' },
    { label: 'Today', value: 'today' },
    { label: 'This week', value: 'week' },
    { label: 'This month', value: 'month' },
    { label: 'This year', value: 'year' },
];

const DURATION_OPTIONS = [
    { label: 'Any duration', value: 'all' },
    { label: 'Short (< 4m)', value: 'short' },
    { label: 'Medium (4-20m)', value: 'medium' },
    { label: 'Long (> 20m)', value: 'long' },
];

const SORT_OPTIONS = [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Upload date', value: 'date' },
    { label: 'View count', value: 'views' },
    { label: 'Rating', value: 'rating' },
];

export default function SearchFilters({ isOpen, onClose, filters, onFilterChange }: SearchFiltersProps) {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/5 mb-8"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 py-6">
                {/* Upload Date */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Upload Date</h3>
                    <div className="flex flex-col gap-2">
                        {DATE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => onFilterChange('date', opt.value)}
                                className={`text-sm text-left hover:text-white transition-colors ${
                                    filters.date === opt.value ? 'text-white font-bold' : 'text-gray-400 font-medium'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Duration</h3>
                    <div className="flex flex-col gap-2">
                        {DURATION_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => onFilterChange('duration', opt.value)}
                                className={`text-sm text-left hover:text-white transition-colors ${
                                    filters.duration === opt.value ? 'text-white font-bold' : 'text-gray-400 font-medium'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort By */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Sort By</h3>
                    <div className="flex flex-col gap-2">
                        {SORT_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => onFilterChange('sortBy', opt.value)}
                                className={`text-sm text-left hover:text-white transition-colors ${
                                    filters.sortBy === opt.value ? 'text-white font-bold' : 'text-gray-400 font-medium'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Features (Future) */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Features</h3>
                    <div className="flex flex-col gap-2 opacity-30 cursor-not-allowed">
                        <span className="text-sm text-gray-400">Live</span>
                        <span className="text-sm text-gray-400">4K</span>
                        <span className="text-sm text-gray-400">Subtitles</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
