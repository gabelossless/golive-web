'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Twitter, Facebook, Mail, Link as LinkIcon, Smartphone } from 'lucide-react';
import { Video } from '@/types';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: Video;
}

export default function ShareModal({ isOpen, onClose, video }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    
    // Fallback to window location if running client-side
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://vibestream.com/watch/${video.id}`;
    
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const shareOptions = [
        {
            name: "X (Twitter)",
            icon: <Twitter size={24} />,
            color: "bg-black hover:bg-[#222]",
            onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this video on VibeStream: ${video.title}`)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
        },
        {
            name: "Facebook",
            icon: <Facebook size={24} />,
            color: "bg-[#1877F2] hover:bg-[#166fe5]",
            onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
        },
        {
            name: "Email",
            icon: <Mail size={24} />,
            color: "bg-gray-600 hover:bg-gray-700",
            onClick: () => window.open(`mailto:?subject=${encodeURIComponent(video.title)}&body=${encodeURIComponent(`Watch this video on VibeStream: ${shareUrl}`)}`, '_blank')
        },
        {
            name: "WhatsApp",
            icon: <Smartphone size={24} />,
            color: "bg-[#25D366] hover:bg-[#20bd5a]",
            onClick: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${video.title} - ${shareUrl}`)}`, '_blank')
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <h3 className="text-lg font-black tracking-tight">Share</h3>
                                <button onClick={onClose} title="Close Share Modal" aria-label="Close Share Modal" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Social Grid */}
                                <div className="grid grid-cols-4 gap-4 mb-8">
                                    {shareOptions.map((opt) => (
                                        <div key={opt.name} className="flex flex-col items-center gap-2">
                                            <button 
                                                onClick={opt.onClick}
                                                title={opt.name}
                                                aria-label={opt.name}
                                                className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 shadow-lg ${opt.color}`}
                                            >
                                                {opt.icon}
                                            </button>
                                            <span className="text-[10px] font-bold text-gray-400 text-center">{opt.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Link Copy Box */}
                                <div className="bg-black/50 border border-white/10 rounded-xl p-2 flex items-center gap-2">
                                    <div className="p-2 bg-white/5 rounded-lg">
                                        <LinkIcon size={18} className="text-gray-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={shareUrl} 
                                        aria-label="Share URL"
                                        title="Share URL"
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-300 truncate font-medium" 
                                    />
                                    <button 
                                        onClick={handleCopy}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors ${copied ? 'bg-green-500/20 text-green-500' : 'bg-[#FFB800] text-black hover:bg-orange-500'}`}
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
