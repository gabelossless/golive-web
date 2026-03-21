'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UploadCloud, X, CheckCircle, AlertCircle, FileVideo, Image as ImageIcon, Loader2, Globe, Lock, EyeOff, Check, Plus, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

async function getVideoMetadata(file: File): Promise<{ width: number; height: number; duration: number }> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve({
                width: video.videoWidth,
                height: video.videoHeight,
                duration: video.duration
            });
        };
        video.onerror = () => reject(new Error('Failed to load video metadata'));
        video.src = URL.createObjectURL(file);
    });
}

// ── Validation constants ──────────────────────────────────────────────────────
const TITLE_MIN = 3;
const TITLE_MAX = 100;
const DESC_MAX = 5000;
const TAG_MAX_COUNT = 10;
const TAG_MAX_LEN = 30;
const VIDEO_MAX_MB = 2048; // 2 GB
const THUMB_MAX_MB = 10;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/hevc'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const TAG_RE = /^[a-zA-Z0-9_\-]+$/;
const CATEGORY_LIST = ['Gaming', 'Music', 'Education', 'Entertainment', 'Tech', 'News', 'Sports', 'Other'];

interface ValidationErrors {
    title?: string;
    description?: string;
    tags?: string;
    videoFile?: string;
    thumbnailFile?: string;
}

function validateForm(
    title: string,
    description: string,
    tags: string[],
    videoFile: File | null,
    thumbnailFile: File | null,
    hasAutoThumb: boolean,
    subscriptionTier: string = 'free',
    videoDuration: number = 0
): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!title.trim()) errors.title = 'Title is required.';
    else if (title.trim().length < TITLE_MIN) errors.title = `Title must be at least ${TITLE_MIN} characters.`;
    else if (title.length > TITLE_MAX) errors.title = `Title cannot exceed ${TITLE_MAX} characters.`;

    if (description.length > DESC_MAX) errors.description = `Description cannot exceed ${DESC_MAX} characters.`;

    if (tags.length > TAG_MAX_COUNT) errors.tags = `You can add up to ${TAG_MAX_COUNT} tags.`;
    else {
        const badTag = tags.find(t => !TAG_RE.test(t) || t.length > TAG_MAX_LEN);
        if (badTag) errors.tags = `Tag "${badTag}" is invalid.`;
    }

    if (!videoFile) {
        errors.videoFile = 'Please select a video file.';
    } else {
        if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) errors.videoFile = 'Unsupported video format.';
        else if (videoFile.size > VIDEO_MAX_MB * 1024 * 1024) errors.videoFile = `Video file must be under ${VIDEO_MAX_MB} MB.`;
        
        // Duration Check
        const limitSeconds = subscriptionTier === 'premium' ? 1800 : 60; // 30m vs 60s
        if (videoDuration > limitSeconds) {
            errors.videoFile = `Upload limit exceeded. ${subscriptionTier === 'premium' ? 'Premium' : 'Free'} users are limited to ${subscriptionTier === 'premium' ? '30 minutes' : '60 seconds'}.`;
        }
    }

    if (thumbnailFile) {
        if (!ALLOWED_IMAGE_TYPES.includes(thumbnailFile.type)) errors.thumbnailFile = 'Unsupported image format.';
        else if (thumbnailFile.size > THUMB_MAX_MB * 1024 * 1024) errors.thumbnailFile = `Thumbnail must be under ${THUMB_MAX_MB} MB.`;
    }

    return errors;
}

function parseTagInput(raw: string): string[] {
    return raw.split(/[\s,#]+/).map(t => t.replace(/^#+/, '').trim().toLowerCase()).filter(Boolean);
}

type ToastType = { id: number; message: string; type: 'info' | 'success' | 'error' | 'loading'; progress?: number };

import { TOP_50_TAGS } from '@/lib/tags';
import { useUpload } from '@/components/UploadProvider';

export default function UploadPage() {
    const { user, session, profile, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { startUpload } = useUpload();

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?message=Create an account to upload videos');
        }
    }, [user, authLoading, router]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [category, setCategory] = useState(CATEGORY_LIST[0]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [autoThumbnails, setAutoThumbnails] = useState<string[]>([]);
    const [selectedAutoThumb, setSelectedAutoThumb] = useState<number | null>(null);
    const [visibility, setVisibility] = useState<'Public' | 'Unlisted' | 'Private'>('Public');

    // Advanced Creator Options
    const [allowClipping, setAllowClipping] = useState(true);
    const [allowComments, setAllowComments] = useState(true);
    const [license, setLicense] = useState<'Standard' | 'Creative Commons'>('Standard');
    const [scheduledFor, setScheduledFor] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [toasts, setToasts] = useState<ToastType[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const [videoDuration, setVideoDuration] = useState(0);
    const [videoMeta, setVideoMeta] = useState<{width: number; height: number; duration: number} | null>(null);

    const addToast = (msg: string, type: ToastType['type'], progress?: number) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message: msg, type, progress }]);
        return id;
    };

    const updateToast = (id: number, updates: Partial<ToastType>) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const extractFrames = useCallback((file: File) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.src = url;
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;

        video.onloadeddata = async () => {
            const duration = video.duration || 0;
            if (duration === 0) return;
            const times = [duration * 0.2, duration * 0.5, duration * 0.8];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const generated: string[] = [];

            video.onseeked = () => {
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 360;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                generated.push(canvas.toDataURL('image/jpeg', 0.8));

                if (generated.length < times.length) {
                    video.currentTime = times[generated.length];
                } else {
                    URL.revokeObjectURL(url);
                    setAutoThumbnails(generated);
                    setSelectedAutoThumb(0);
                }
            };

            video.currentTime = times[0];
        };
        video.load();
    }, []);

    const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoFile(file);
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setAutoThumbnails([]);
        setSelectedAutoThumb(null);

        // Fetch duration immediately
        try {
            const meta = await getVideoMetadata(file);
            setVideoMeta(meta);
            setVideoDuration(meta.duration);
            if (touched) {
                setFieldErrors(prev => ({ 
                    ...prev, 
                    videoFile: validateForm(title, description, tags, file, null, false, profile?.subscription_tier, meta.duration).videoFile 
                }));
            }
        } catch (err) {
            console.error('Metadata error:', err);
        }

        extractFrames(file);

        if (!title) {
            const defaultTitle = file.name.split('.').slice(0, -1).join('.').replace(/[-_]/g, ' ');
            setTitle(defaultTitle.slice(0, TITLE_MAX));
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.startsWith("video/")) {
                setVideoFile(droppedFile);
                extractFrames(droppedFile);
                if (!title) {
                    const defaultTitle = droppedFile.name.split('.').slice(0, -1).join('.').replace(/[-_]/g, ' ');
                    setTitle(defaultTitle.slice(0, TITLE_MAX));
                }
            } else {
                alert("Please drop a valid video file.");
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setThumbnailFile(file);
        setSelectedAutoThumb(null);
        const reader = new FileReader();
        reader.onload = () => setThumbnailPreview(reader.result as string);
        reader.readAsDataURL(file);
        if (touched) setFieldErrors(prev => ({ ...prev, thumbnailFile: validateForm(title, description, tags, videoFile, file, false).thumbnailFile }));
    };

    const handleAutoThumbSelect = (index: number) => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setSelectedAutoThumb(index);
    };

    const onTitleChange = (val: string) => {
        setTitle(val);
        if (touched) setFieldErrors(prev => ({ ...prev, title: validateForm(val, description, tags, videoFile, thumbnailFile, selectedAutoThumb !== null, profile?.subscription_tier, videoDuration).title }));
    };

    const onDescChange = (val: string) => {
        setDescription(val);
        if (touched) setFieldErrors(prev => ({ ...prev, description: validateForm(title, val, tags, videoFile, thumbnailFile, selectedAutoThumb !== null, profile?.subscription_tier, videoDuration).description }));
    };

    const onTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ([',', ' ', 'Enter'].includes(e.key)) {
            e.preventDefault();
            commitTags(tagInput);
        } else if (e.key === 'Backspace' && !tagInput && tags.length) {
            const next = tags.slice(0, -1);
            setTags(next);
            if (touched) setFieldErrors(prev => ({ ...prev, tags: validateForm(title, description, next, videoFile, thumbnailFile, selectedAutoThumb !== null).tags }));
        }
    };

    const onTagInputChange = (val: string) => {
        setTagInput(val);
        if (val.trim()) {
            const filtered = TOP_50_TAGS.filter(t => 
                t.toLowerCase().startsWith(val.toLowerCase()) && !tags.includes(t)
            ).slice(0, 5);
            setTagSuggestions(filtered);
        } else {
            setTagSuggestions([]);
        }
    };

    const commitTags = (raw: string) => {
        const parsed = parseTagInput(raw);
        if (!parsed.length) { setTagInput(''); setTagSuggestions([]); return; }
        const next = [...new Set([...tags, ...parsed])];
        setTags(next);
        setTagInput('');
        setTagSuggestions([]);
        if (touched) setFieldErrors(prev => ({ ...prev, tags: validateForm(title, description, next, videoFile, thumbnailFile, selectedAutoThumb !== null).tags }));
    };

    const removeTag = (tag: string) => {
        const next = tags.filter(t => t !== tag);
        setTags(next);
        if (touched) setFieldErrors(prev => ({ ...prev, tags: validateForm(title, description, next, videoFile, thumbnailFile, selectedAutoThumb !== null).tags }));
    };

    const handleUpload = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setTouched(true);
        const hasAutoThumb = selectedAutoThumb !== null;
        const errors = validateForm(title, description, tags, videoFile, thumbnailFile, hasAutoThumb, profile?.subscription_tier, videoDuration);
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) return;
        if (!user || !videoFile) return;

        if (!session?.access_token) {
            addToast('Session expired. Please log in again.', 'error');
            return;
        }

        const finalDescription = visibility === 'Private' ? `${description}\n\n[PRIVATE_VIDEO_FLAG]` : description;
        const tagStr = tags.length ? `\n\nTags: ${tags.map(t => `#${t}`).join(' ')}` : '';
        const finalDescriptionWithCategory = `${finalDescription}\n\nCategory: ${category}${tagStr}`;

        let finalThumb = thumbnailFile;
        if (!finalThumb && hasAutoThumb && autoThumbnails[selectedAutoThumb]) {
            try {
                const res = await fetch(autoThumbnails[selectedAutoThumb]);
                const blob = await res.blob();
                finalThumb = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
            } catch (err) {
                console.warn('Failed to extract auto thumbnail');
            }
        }
        
        // Automatic Vertical Video Intelligence
        // A short must be strictly vertical (width < height) and <= 60 seconds
        const isShort = videoDuration <= 60 && (videoMeta ? videoMeta.width < videoMeta.height : false);

        startUpload(videoFile, finalThumb, {
            title: title.trim(),
            description: finalDescriptionWithCategory,
            category,
            isShort,
            userId: user.id,
            sessionToken: session.access_token
        });

        router.push('/studio/dashboard');
    };

    if (authLoading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 size={32} className="text-[#FFB800] animate-spin" /></div>;
    if (!user) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 p-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold">Sign in to Upload</h1>
            <p className="text-gray-400 max-w-xs">You need an account to upload videos to VibeStream.</p>
            <div className="flex gap-3">
                <Link href="/login" className="px-6 py-2.5 bg-[#FFB800] text-black rounded-full font-bold no-underline">Log In</Link>
                <Link href="/register" className="px-6 py-2.5 border border-white/10 text-white rounded-full font-bold no-underline hover:bg-white/5">Sign Up</Link>
            </div>
        </div>
    );

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 p-6">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle size={40} className="text-green-500" />
                </div>
                <h1 className="text-2xl font-bold">Video Published! 🎉</h1>
                <p className="text-gray-400 max-w-xs">Your video is now live and ready for the world to see.</p>
                <div className="flex gap-3 mt-2">
                    <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-[#FFB800] text-black rounded-full font-bold border-none cursor-pointer">Go to Home</button>
                    <button onClick={() => {
                        setSuccess(false); setVideoFile(null); setThumbnailFile(null); setThumbnailPreview(null);
                        setTitle(''); setDescription(''); setTags([]); setTagInput(''); setTouched(false);
                        setFieldErrors({}); setIsUploading(false); setAutoThumbnails([]); setSelectedAutoThumb(null); setUploadProgress(0);
                    }} className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-full font-bold cursor-pointer hover:bg-white/10">Upload Another</button>
                </div>
            </div>
        );
    }

    const visibilityOptions = [
        { id: "Public", icon: Globe, desc: "Anyone can see your video" },
        { id: "Unlisted", icon: EyeOff, desc: "Anyone with the link can see your video" },
        { id: "Private", icon: Lock, desc: "Only you and people you choose can see your video" },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 h-full overflow-y-auto scrollbar-hide relative z-0 pb-32">
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={cn("p-4 rounded-xl min-w-[300px] shadow-2xl backdrop-blur-md border animate-in slide-in-from-right-8 pointer-events-auto",
                        t.type === 'error' ? 'bg-red-500/95 border-red-500/30' :
                            t.type === 'success' ? 'bg-green-500/95 border-green-500/30' :
                                'bg-black/95 border-white/10'
                    )}>
                        <div className="flex items-center gap-3 font-semibold text-sm">
                            {t.type === 'loading' && <Loader2 size={18} className="animate-spin text-[#FFB800]" />}
                            {t.type === 'success' && <CheckCircle size={18} />}
                            {t.type === 'error' && <AlertCircle size={18} />}
                            <span className="flex-1">{t.message}</span>
                            <button onClick={() => removeToast(t.id)} className="bg-transparent border-none text-white/50 hover:text-white cursor-pointer" title="Dismiss notification"><X size={16} /></button>
                        </div>
                        {t.progress !== undefined && t.progress < 100 && (
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden mt-3">
                                <div className="h-full bg-[#FFB800] transition-all duration-300" style={{ width: `${t.progress}%` }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Identity Header */}
            {user && profile && (
                <motion.div 
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex items-center gap-4 mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl w-fit"
                >
                    <div className="relative">
                        <img 
                           src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
                           className="w-12 h-12 rounded-full border-2 border-[#FFB800]" 
                           alt="" 
                        />
                        <div className="absolute -bottom-1 -right-1 bg-[#FFB800] rounded-full p-0.5 border-2 border-[#1a1a1a]">
                            <CheckCircle size={12} className="text-black" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Uploading as</p>
                        <h3 className="text-lg font-black tracking-tight">{profile.username} <span className="text-[#FFB800] text-xs lowercase ml-1 font-medium italic opacity-60">Creator Studio</span></h3>
                    </div>
                </motion.div>
            )}

            <h1 className="text-4xl md:text-6xl font-black mb-12 italic font-premium text-gradient tracking-tighter uppercase">Publish Content</h1>

            {!videoFile ? (
                <div
                    className="glass-deep border-2 border-dashed border-white/5 rounded-[40px] p-12 flex flex-col items-center justify-center text-center hover:bg-white/[0.05] transition-all cursor-pointer min-h-[450px] group relative overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={handleVideoSelect} disabled={isUploading} title="Select video file" />
                    <div className="w-24 h-24 bg-white/[0.03] rounded-[32px] flex items-center justify-center mb-8 border border-white/5 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                        <UploadCloud size={48} className="text-[#FFB800] drop-shadow-[0_0_15px_rgba(255,184,0,0.4)]" />
                    </div>
                    <h2 className="text-2xl font-black mb-3 italic font-premium tracking-tight">Drop your masterpiece here</h2>
                    <p className="text-zinc-500 mb-8 font-bold uppercase tracking-widest text-[10px]">High-fidelity 4K & Vertical Shorts supported</p>
                    <button className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl shadow-white/5 hover:scale-105 active:scale-95">
                        Browse Files
                    </button>
                    {fieldErrors.videoFile && <p className="text-red-500 text-xs font-black uppercase tracking-widest mt-6 animate-pulse">{fieldErrors.videoFile}</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass-deep p-8 md:p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group/form">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FFB800]/20 to-transparent opacity-0 group-hover/form:opacity-100 transition-opacity" />
                            <h2 className="text-2xl font-black mb-8 italic font-premium tracking-tight">Metadata & Intelligence</h2>
                            <form onSubmit={handleUpload} className="space-y-8">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label htmlFor="video-title" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Title</label>
                                        <span className={cn("text-[10px] font-black", title.length > TITLE_MAX * 0.9 ? 'text-orange-500' : 'text-zinc-700')}>{title.length}/{TITLE_MAX}</span>
                                    </div>
                                    <input
                                        id="video-title"
                                        type="text"
                                        value={title}
                                        maxLength={TITLE_MAX}
                                        onChange={(e) => onTitleChange(e.target.value)}
                                        required
                                        disabled={isUploading}
                                        className={cn("w-full bg-white/[0.03] border rounded-2xl px-6 py-4 text-white font-bold focus:outline-none transition-all", fieldErrors.title ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-white/5 focus:border-[#FFB800]/50")}
                                        placeholder="Name your creation..."
                                        title="Video Title"
                                    />
                                    {fieldErrors.title && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{fieldErrors.title}</p>}
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label htmlFor="video-description" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Description</label>
                                        <span className={cn("text-[10px] font-black", description.length > DESC_MAX * 0.9 ? 'text-orange-500' : 'text-zinc-700')}>{description.length}/{DESC_MAX}</span>
                                    </div>
                                    <textarea
                                        id="video-description"
                                        rows={6}
                                        value={description}
                                        maxLength={DESC_MAX}
                                        onChange={(e) => onDescChange(e.target.value)}
                                        disabled={isUploading}
                                        className={cn("w-full bg-white/[0.03] border rounded-2xl px-6 py-4 text-white font-medium leading-relaxed focus:outline-none transition-all resize-none", fieldErrors.description ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-white/5 focus:border-[#FFB800]/50")}
                                        placeholder="Add context and tags..."
                                        title="Video Description"
                                    />
                                    {fieldErrors.description && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{fieldErrors.description}</p>}
                                </div>

                                {/* Thumbnail Selection */}
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Visual Identity (Thumbnail)</label>
                                        <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-tight">Select a high-impact frame or upload custom art</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div 
                                            onClick={() => !isUploading && thumbnailInputRef.current?.click()} 
                                            className={cn(
                                                "aspect-video border rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group/thumb", 
                                                thumbnailFile ? "border-[#FFB800] bg-[#FFB800]/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                                            )}
                                        >
                                            <input type="file" accept="image/*" className="hidden" ref={thumbnailInputRef} onChange={handleThumbnailSelect} disabled={isUploading} />
                                            {thumbnailPreview ? (
                                                <img src={thumbnailPreview} alt="Custom" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <ImageIcon size={20} className="text-zinc-600 mb-2 group-hover/thumb:text-[#FFB800] transition-colors" />
                                                    <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest group-hover/thumb:text-white transition-colors">Upload Custom</span>
                                                </>
                                            )}
                                        </div>
                                        {autoThumbnails.map((thumb, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => !isUploading && handleAutoThumbSelect(idx)}
                                                className={cn(
                                                    "aspect-video rounded-2xl overflow-hidden cursor-pointer border transition-all relative group/auto",
                                                    selectedAutoThumb === idx ? "border-[#FFB800] scale-[1.05] shadow-[0_0_25px_rgba(255,184,0,0.2)] z-10" : "border-white/5 opacity-40 hover:opacity-100 hover:border-white/20"
                                                )}
                                            >
                                                <img src={thumb} alt={`Auto frame ${idx + 1}`} className="w-full h-full object-cover" />
                                                {selectedAutoThumb === idx && (
                                                    <div className="absolute top-2 right-2 bg-[#FFB800] rounded-full p-1 shadow-lg ring-4 ring-black/20">
                                                        <Check size={10} className="text-black font-black" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {fieldErrors.thumbnailFile && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{fieldErrors.thumbnailFile}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label htmlFor="video-category" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic mb-2 block">Content Category</label>
                                        <div className="relative group/select">
                                            <select
                                                id="video-category"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                disabled={isUploading}
                                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#FFB800]/50 transition-all appearance-none cursor-pointer"
                                                aria-label="Video Category"
                                                title="Video Category"
                                            >
                                                {CATEGORY_LIST.map(cat => (
                                                    <option key={cat} value={cat} className="bg-[#0a0a0a] text-white py-4 capitalize">{cat}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 group-hover/select:text-[#FFB800] transition-colors">
                                                <Plus size={16} className="rotate-45" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic mb-2 block">Discovery Tags</label>
                                        <div className={cn("w-full bg-white/[0.03] border rounded-2xl px-4 py-3 text-white focus-within:border-[#FFB800]/50 transition-all flex flex-wrap gap-2 content-start min-h-[58px] relative", fieldErrors.tags ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-white/5")} onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
                                            <AnimatePresence>
                                                {tags.map(tag => (
                                                    <motion.span 
                                                        key={tag} 
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.8, opacity: 0 }}
                                                        className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/5 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl group/tag hover:border-[#FFB800]/30 transition-colors shadow-lg"
                                                    >
                                                        #{tag}
                                                        {!isUploading && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removeTag(tag)} 
                                                                className="bg-transparent border-none text-zinc-600 hover:text-[#FFB800] cursor-pointer p-0 ml-1 leading-none font-bold transition-colors"
                                                                title={`Remove tag ${tag}`}
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        )}
                                                    </motion.span>
                                                ))}
                                            </AnimatePresence>
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => onTagInputChange(e.target.value)}
                                                onKeyDown={onTagInputKeyDown}
                                                onBlur={() => setTimeout(() => setTagSuggestions([]), 200)}
                                                disabled={isUploading || tags.length >= TAG_MAX_COUNT}
                                                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-[11px] font-bold text-white placeholder-zinc-700 py-2 px-2"
                                                placeholder={tags.length === 0 ? "add tags..." : ""}
                                            />

                                            {/* Tag Suggestions Dropdown */}
                                            {tagSuggestions.length > 0 && (
                                                <div className="absolute left-0 right-0 top-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden p-1">
                                                    {tagSuggestions.map(s => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => commitTags(s)}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-[#FFB800] hover:text-black text-xs font-black uppercase tracking-widest transition-colors rounded-lg flex items-center justify-between group"
                                                        >
                                                            <span>#{s}</span>
                                                            <Plus size={14} className="opacity-0 group-hover:opacity-100" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {fieldErrors.tags && <p className="text-red-500 text-xs font-bold mt-1.5">{fieldErrors.tags}</p>}
                                    </div>
                                </div>



                                {/* Advanced Creator Studio Options */}
                                <div className="pt-8 border-t border-white/5 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Advanced Creator Options</h3>
                                            <p className="text-xs text-gray-500 font-medium">Configure advanced ecosystem & audience settings</p>
                                        </div>
                                        <div className="px-2 py-0.5 rounded bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] text-[10px] font-black uppercase tracking-tighter">Pro</div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold">Allow AI Clipping</span>
                                                <span className="text-[10px] text-gray-500 font-medium tracking-tight">Let others create Shorts from this video</span>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={allowClipping} 
                                                onChange={(e) => setAllowClipping(e.target.checked)}
                                                className="w-5 h-5 accent-[#FFB800] cursor-pointer"
                                            />
                                        </label>

                                        <label className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold">Allow Comments</span>
                                                <span className="text-[10px] text-gray-400 font-medium tracking-tight">Enable community discussion on this video</span>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={allowComments} 
                                                onChange={(e) => setAllowComments(e.target.checked)}
                                                className="w-5 h-5 accent-[#FFB800] cursor-pointer"
                                            />
                                        </label>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-bold text-gray-400">License & Distribution</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => setLicense('Standard')}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl border text-xs font-bold transition-all",
                                                    license === 'Standard' ? "bg-white/10 border-[#FFB800] text-white" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                                                )}
                                            >
                                                Standard License
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setLicense('Creative Commons')}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl border text-xs font-bold transition-all",
                                                    license === 'Creative Commons' ? "bg-white/10 border-[#FFB800] text-white" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                                                )}
                                            >
                                                Creative Commons
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 flex flex-col md:flex-row justify-end gap-6 items-center">
                                    {touched && Object.keys(fieldErrors).length > 0 && (
                                        <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mr-auto animate-pulse">Configuration error detected</p>
                                    )}
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => setVideoFile(null)}
                                            disabled={isUploading}
                                            className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all text-zinc-500 border-none bg-transparent cursor-pointer disabled:opacity-50"
                                        >
                                            Discard Draft
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="flex-1 md:flex-none px-12 py-5 bg-white text-black hover:bg-[#FFB800] disabled:opacity-50 disabled:cursor-not-allowed rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl shadow-white/5 border-none group/btn"
                                        >
                                            {isUploading ? (
                                                <span className="flex items-center gap-3">
                                                    <Loader2 size={16} className="animate-spin" /> 
                                                    Encrypting Content
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-3">
                                                    Broadcast Now
                                                    <ArrowUpRight size={18} className="translate-y-0.5 group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" />
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Preview & Progress Section */}
                    <div className="space-y-6">
                        <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden sticky top-20">
                            <div className="aspect-video bg-black flex items-center justify-center relative">
                                {thumbnailFile || selectedAutoThumb !== null ? (
                                    <img
                                        src={thumbnailPreview || autoThumbnails[selectedAutoThumb!]}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <FileVideo size={48} className="text-gray-600" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                    <span className="text-sm font-medium truncate text-white">{videoFile?.name || 'Uploading...'}</span>
                                </div>
                            </div>
                            <div className="p-4 bg-[#222]">
                                <div className="flex items-center justify-between text-sm mb-2 font-medium">
                                    <span className="text-gray-400">
                                        {isUploading ? "Uploading..." : "Pending"}
                                    </span>
                                    <span className="text-[#FFB800] font-bold">{isUploading ? `${uploadProgress}%` : ''}</span>
                                </div>
                                <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#FFB800]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </div>
                            </div>
                            <div className="p-4 border-t border-white/5 space-y-3 bg-[#1a1a1a]">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 font-medium">Video size</span>
                                    <span className="text-gray-300 font-bold ml-4">{((videoFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 font-medium">Visibility</span>
                                    <span className="text-gray-300 font-bold">{visibility}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
