'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Video } from '@/types';
import { useRouter } from 'next/navigation';
import { 
    Save, 
    ArrowLeft, 
    Eye, 
    Lock, 
    Globe, 
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

export default function EditVideoClient({ video }: { video: Video }) {
    const router = useRouter();
    const [title, setTitle] = useState(video.title);
    const [description, setDescription] = useState(video.description || '');
    const [visibility, setVisibility] = useState(video.visibility || 'public');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const { error: updateError } = await supabase
                .from('videos')
                .update({
                    title,
                    description,
                    visibility,
                    updated_at: new Date().toISOString()
                })
                .eq('id', video.id);

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            
            // Redirect back to dashboard after a short delay if success
            // Or just stay here to allow more edits
        } catch (err: any) {
            console.error('Save failed:', err);
            setError(err.message || 'Failed to update video');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link 
                            href="/studio/dashboard" 
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
                        >
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter m-0">Edit Video</h1>
                            <p className="text-gray-500 font-medium m-0">Video Details & Settings</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FFB800] to-[#FF8A00] text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-all shadow-xl shadow-[#FFB800]/20 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Editor */}
                    <div className="lg:col-span-2 space-y-8">
                        <form onSubmit={handleSave} className="space-y-8">
                            {/* Title */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Video Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Add a title that catches the vibe"
                                    className="w-full bg-[#111111] border border-white/5 rounded-2xl px-6 py-5 text-lg font-bold outline-none focus:border-[#FFB800]/50 transition-all placeholder:text-gray-700"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell your viewers about your video..."
                                    rows={8}
                                    className="w-full bg-[#111111] border border-white/5 rounded-2xl px-6 py-5 text-sm font-medium outline-none focus:border-[#FFB800]/50 transition-all placeholder:text-gray-700 resize-none"
                                />
                            </div>

                            {/* Visibility */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Visibility</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <VisibilityOption 
                                        selected={visibility === 'public'}
                                        onClick={() => setVisibility('public')}
                                        icon={Globe}
                                        label="Public"
                                        description="Everyone can see this video"
                                    />
                                    <VisibilityOption 
                                        selected={visibility === 'unlisted'}
                                        onClick={() => setVisibility('unlisted')}
                                        icon={Eye}
                                        label="Unlisted"
                                        description="Only people with the link"
                                    />
                                    <VisibilityOption 
                                        selected={visibility === 'private'}
                                        onClick={() => setVisibility('private')}
                                        icon={Lock}
                                        label="Private"
                                        description="Only you can see this"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Preview & Status */}
                    <div className="space-y-8">
                        {/* Video Preview Card */}
                        <div className="bg-[#111111] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="aspect-video bg-white/5 relative group">
                                {video.thumbnail_url ? (
                                    <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                        <Eye size={32} className="text-white/20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Link href={`/watch/${video.id}`} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm border border-white/20 text-xs font-black uppercase tracking-widest transition-all">
                                        Preview Video
                                    </Link>
                                </div>
                            </div>
                            <div className="p-8 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Video Link</p>
                                    <p className="text-xs font-bold text-[#FFB800] break-all truncate underline opacity-80 hover:opacity-100 cursor-pointer" onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/watch/${video.id}`);
                                        alert('Link copied!');
                                    }}>
                                        {window.location.origin}/watch/{video.id}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Filename</p>
                                        <p className="text-xs font-bold truncate">{video.video_url.split('/').pop()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Video ID</p>
                                        <p className="text-xs font-bold truncate">{video.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Messages */}
                        <AnimatePresence>
                            {success && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 shrink-0">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight text-green-500">Changes Saved</h4>
                                        <p className="text-[10px] font-medium text-green-500/80">Your video has been updated successfully.</p>
                                    </div>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 shrink-0">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight text-red-500">Save Failed</h4>
                                        <p className="text-[10px] font-medium text-red-500/80">{error}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

function VisibilityOption({ selected, onClick, icon: Icon, label, description }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex flex-col items-start gap-3 p-5 rounded-2xl border transition-all text-left
                ${selected 
                    ? 'bg-[#FFB800]/10 border-[#FFB800]/40 shadow-xl shadow-[#FFB800]/5' 
                    : 'bg-[#111111] border-white/5 hover:border-white/20'}
            `}
        >
            <div className={`p-2 rounded-xl ${selected ? 'bg-[#FFB800] text-black' : 'bg-white/5 text-gray-500'}`}>
                <Icon size={18} />
            </div>
            <div>
                <p className={`text-xs font-black uppercase tracking-tight ${selected ? 'text-white' : 'text-gray-400'}`}>{label}</p>
                <p className="text-[10px] font-medium text-gray-600 line-clamp-1">{description}</p>
            </div>
        </button>
    );
}
