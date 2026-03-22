'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { ChevronDown, Filter, X, Zap } from 'lucide-react';
import CategoryBar from './CategoryBar';
import { cn } from '@/lib/utils';

interface PullMenuProps {
    onCategorySelect: (cat: string) => void;
    activeCategory: string;
}

export default function PullMenu({ onCategorySelect, activeCategory }: PullMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const y = useMotionValue(0);
    const controls = useAnimation();

    // Pull threshold to trigger open
    const threshold = 80;

    // Transform Y drag to rotation/opacity of a "Pull to Refine" indicator
    const pullOpacity = useTransform(y, [0, threshold], [0, 1]);
    const pullScale = useTransform(y, [0, threshold], [0.8, 1.2]);
    const pullRotate = useTransform(y, [0, threshold], [0, 180]);

    const handleDragEnd = (_: any, info: { offset: { y: number } }) => {
        if (info.offset.y > threshold) {
            setIsOpen(true);
            controls.start({ y: 0 });
        } else {
            controls.start({ y: 0 });
        }
    };

    return (
        <div className="relative z-[900]">
            {/* Desktop View: Always show refined category bar */}
            <div className="hidden md:block">
                <CategoryBar onSelect={onCategorySelect} activeCategory={activeCategory} />
            </div>

            {/* Mobile View: Pull to Access */}
            <div className="md:hidden w-full relative">
                {/* Pull Trigger Area (Invisible but detectable) */}
                {!isOpen && (
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: threshold + 40 }}
                        onDragEnd={handleDragEnd}
                        style={{ y }}
                        className="h-4 w-full cursor-grab active:cursor-grabbing flex flex-col items-center justify-start overflow-visible pt-1"
                    >
                        {/* Pull Indicator */}
                        <motion.div 
                            style={{ 
                                opacity: pullOpacity,
                                scale: pullScale,
                                rotate: pullRotate,
                            }}
                            className="bg-[#FFB800] p-2 rounded-full shadow-lg shadow-[#FFB800]/20 flex items-center justify-center -mt-2"
                        >
                            <ChevronDown className="text-black w-4 h-4" />
                        </motion.div>
                        
                        {/* Tonal "Filters" indicator that peeks slightly */}
                        <div className="mt-1 flex items-center gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-1 bg-white/20 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Pull to Refine</span>
                            <div className="w-8 h-1 bg-white/20 rounded-full" />
                        </div>
                    </motion.div>
                )}

                {/* The Refined Menu (Full Width) */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="absolute top-0 left-0 w-full glass-deep border-b border-white/10 shadow-2xl z-[1001] py-4"
                        >
                            <div className="flex items-center justify-between px-6 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#FFB800] rounded-xl">
                                        <Filter className="text-black w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest italic font-premium">Refine Content</h3>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                                    title="Close Menu"
                                >
                                    <X className="text-white w-4 h-4" />
                                </button>
                            </div>

                            <CategoryBar 
                                onSelect={(cat) => {
                                    onCategorySelect(cat);
                                    // Optionally close on select, or keep it open for multi-filtering
                                    // setIsOpen(false); 
                                }} 
                                activeCategory={activeCategory}
                                className="sticky top-0 bg-transparent border-none shadow-none md:mx-0 md:my-0 md:rounded-none px-4"
                            />

                            <div className="mt-4 px-6 grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/5">
                                    <Zap className="w-3 h-3 text-[#FFB800]" />
                                    Live Only
                                </button>
                                <button className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-white/5">
                                    <ChevronDown className="w-3 h-3" />
                                    Sort: Newest
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
