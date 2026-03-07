'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UploadCloud, X, CheckCircle, AlertCircle, FileVideo, Image as ImageIcon, Loader2, Globe, Lock, EyeOff, Check } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
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
    hasAutoThumb: boolean
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

    if (!videoFile) errors.videoFile = 'Please select a video file.';
    else if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) errors.videoFile = 'Unsupported video format.';
    else if (videoFile.size > VIDEO_MAX_MB * 1024 * 1024) errors.videoFile = `Video file must be under ${VIDEO_MAX_MB} MB.`;

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

export default function UploadPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [category, setCategory] = useState(CATEGORY_LIST[0]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [autoThumbnails, setAutoThumbnails] = useState<string[]>([]);
    const [selectedAutoThumb, setSelectedAutoThumb] = useState<number | null>(null);
    const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public');

    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [toasts, setToasts] = useState<ToastType[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const addToast = (msg: string, type: ToastType['type'], progress?: number) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message: msg, type, progress }]);
        return id;
    };

    const updateToast = (id: number, updates: Partial<ToastType>) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
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

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoFile(file);
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setAutoThumbnails([]);
        setSelectedAutoThumb(null);

        extractFrames(file);

        if (!title) {
            const defaultTitle = file.name.split('.').slice(0, -1).join('.').replace(/[-_]/g, ' ');
            setTitle(defaultTitle.slice(0, TITLE_MAX));
        }
        if (touched) setFieldErrors(prev => ({ ...prev, videoFile: validateForm(title, description, tags, file, null, false).videoFile }));
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
        if (touched) setFieldErrors(prev => ({ ...prev, title: validateForm(val, description, tags, videoFile, thumbnailFile, selectedAutoThumb !== null).title }));
    };

    const onDescChange = (val: string) => {
        setDescription(val);
        if (touched) setFieldErrors(prev => ({ ...prev, description: validateForm(title, val, tags, videoFile, thumbnailFile, selectedAutoThumb !== null).description }));
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

    const commitTags = (raw: string) => {
        const parsed = parseTagInput(raw);
        if (!parsed.length) { setTagInput(''); return; }
        const next = [...new Set([...tags, ...parsed])];
        setTags(next);
        setTagInput('');
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
        const errors = validateForm(title, description, tags, videoFile, thumbnailFile, hasAutoThumb);
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) return;
        if (!user || !videoFile) return;

        setIsUploading(true);
        setUploadProgress(0);

        const uploadToast = addToast('Preparing media pipeline...', 'loading', 0);

        try {
            const { calculateVibeRank } = await import('@/lib/vibe-rank');

            const uploadToR2 = async (file: File, folder: string, onProgress: (p: number) => void): Promise<string> => {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream', folder }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to secure upload link');
                }

                const { url, path } = await response.json();

                return new Promise<string>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const p = Math.round((event.loaded / event.total) * 100);
                            onProgress(p);
                        }
                    });
                    xhr.addEventListener('load', () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(path); // Return the relative path for processing
                        } else {
                            reject(new Error(`Storage upload failed: ${xhr.statusText} (${xhr.status})`));
                        }
                    });
                    xhr.addEventListener('error', () => reject(new Error(`Network error during upload. Check your connection.`)));
                    xhr.addEventListener('abort', () => reject(new Error('Upload aborted.')));
                    xhr.open('PUT', url);
                    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
                    xhr.setRequestHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    xhr.send(file);
                });
            };

            // 1. RAW UPLOAD
            updateToast(uploadToast, { message: `Uploading raw video to R2 Edge...`, progress: 10 });
            const rawPath = await uploadToR2(videoFile, `temp/${user.id}`, (p) => {
                setUploadProgress(Math.floor(p * 0.7)); // Map to 0-70%
                updateToast(uploadToast, { progress: Math.floor(p * 0.7) });
            });

            // 2. BACKEND PROCESSING
            updateToast(uploadToast, { message: 'Optimizing for mobile & web playback...', progress: 75 });
            setUploadProgress(75);

            const processRes = await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawPath, userId: user.id }),
            });

            if (!processRes.ok) {
                const procError = await processRes.json().catch(() => ({}));
                throw new Error(procError.error || 'Video optimization failed.');
            }

            const { path: processedPath, duration, width, height } = await processRes.json();

            // Calculate initial Quality Score
            const { qualityScore } = calculateVibeRank({ width, height });

            const baseUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');
            const videoUrl = `${baseUrl}/${processedPath}`;

            // 3. THUMBNAIL UPLOAD
            let thumbnailUrl = null;
            updateToast(uploadToast, { message: 'Uploading thumbnail artwork...', progress: 90 });
            setUploadProgress(90);

            if (thumbnailFile) {
                const thumbPath = await uploadToR2(thumbnailFile, `thumbnails/${user.id}`, () => { });
                thumbnailUrl = `${baseUrl}/${thumbPath}`;
            } else if (selectedAutoThumb !== null && autoThumbnails[selectedAutoThumb]) {
                const res = await fetch(autoThumbnails[selectedAutoThumb]);
                const blob = await res.blob();
                const autoFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                const thumbPath = await uploadToR2(autoFile, `thumbnails/${user.id}`, () => { });
                thumbnailUrl = `${baseUrl}/${thumbPath}`;
            }

            // 4. DATABASE SYNC
            updateToast(uploadToast, { message: 'Syncing metadata...', progress: 98 });
            setUploadProgress(98);

            const finalDescription = visibility === 'Private' ? `${description}\n\n[PRIVATE_VIDEO_FLAG]` : description;
            const tagStr = tags.length ? `\n\nTags: ${tags.map(t => `#${t}`).join(' ')}` : '';
            const finalDescriptionWithCategory = `${finalDescription}\n\nCategory: ${category}${tagStr}`;

            const { error: dbError } = await supabase.from('videos').insert({
                user_id: user.id,
                title: title.trim(),
                description: finalDescriptionWithCategory,
                video_url: videoUrl,
                thumbnail_url: thumbnailUrl,
                duration: duration || '0:00',
                width,
                height,
                quality_score: qualityScore
            });

            if (dbError) throw dbError;

            updateToast(uploadToast, { message: 'Video published successfully!', type: 'success', progress: 100 });
            setUploadProgress(100);
            setTimeout(() => removeToast(uploadToast), 4000);
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            updateToast(uploadToast, { message: err.message || 'Upload failed.', type: 'error' });
            setTimeout(() => removeToast(uploadToast), 5000);
            setIsUploading(false);
            setUploadProgress(0);
        }
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
                            <button onClick={() => removeToast(t.id)} className="bg-transparent border-none text-white/50 hover:text-white cursor-pointer"><X size={16} /></button>
                        </div>
                        {t.progress !== undefined && t.progress < 100 && (
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden mt-3">
                                <div className="h-full bg-[#FFB800] transition-all duration-300" style={{ width: `${t.progress}%` }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <h1 className="text-3xl font-bold mb-8">Upload Video</h1>

            {!videoFile ? (
                <div
                    className="border-2 border-dashed border-white/20 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-[#1a1a1a] hover:bg-[#222] transition-colors cursor-pointer min-h-[400px]"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={handleVideoSelect} disabled={isUploading} />
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <UploadCloud size={48} className="text-[#FFB800]" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Drag and drop video files to upload</h2>
                    <p className="text-gray-400 mb-6 font-medium text-sm">Your videos will be private until you publish them.</p>
                    <button className="px-6 py-2.5 bg-[#FFB800] hover:bg-orange-500 text-black rounded-lg font-bold transition-colors border-none cursor-pointer">
                        Select Files
                    </button>
                    {fieldErrors.videoFile && <p className="text-red-500 text-sm mt-4 font-bold">{fieldErrors.videoFile}</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                            <h2 className="text-xl font-bold mb-6">Details</h2>
                            <form onSubmit={handleUpload} className="space-y-6">
                                <div>
                                    <div className="flex justify-between">
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Title (required)</label>
                                        <span className={cn("text-xs font-medium", title.length > TITLE_MAX * 0.9 ? 'text-orange-500' : 'text-gray-500')}>{title.length}/{TITLE_MAX}</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={title}
                                        maxLength={TITLE_MAX}
                                        onChange={(e) => onTitleChange(e.target.value)}
                                        required
                                        disabled={isUploading}
                                        className={cn("w-full bg-black/50 border rounded-lg px-4 py-2.5 text-white focus:outline-none transition-colors", fieldErrors.title ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#FFB800]")}
                                        placeholder="Add a title that describes your video"
                                    />
                                    {fieldErrors.title && <p className="text-red-500 text-xs font-bold mt-1.5">{fieldErrors.title}</p>}
                                </div>

                                <div>
                                    <div className="flex justify-between">
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
                                        <span className={cn("text-xs font-medium", description.length > DESC_MAX * 0.9 ? 'text-orange-500' : 'text-gray-500')}>{description.length}/{DESC_MAX}</span>
                                    </div>
                                    <textarea
                                        rows={4}
                                        value={description}
                                        maxLength={DESC_MAX}
                                        onChange={(e) => onDescChange(e.target.value)}
                                        disabled={isUploading}
                                        className={cn("w-full bg-black/50 border rounded-lg px-4 py-2.5 text-white focus:outline-none transition-colors resize-none", fieldErrors.description ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#FFB800]")}
                                        placeholder="Tell viewers about your video"
                                    />
                                    {fieldErrors.description && <p className="text-red-500 text-xs font-bold mt-1.5">{fieldErrors.description}</p>}
                                </div>

                                {/* Thumbnail Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-3">Thumbnail</label>
                                    <p className="text-xs text-gray-500 mb-3 font-medium">Select or upload a picture that shows what's in your video.</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div onClick={() => !isUploading && thumbnailInputRef.current?.click()} className={cn("aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden", thumbnailFile ? "border-[#FFB800] bg-[#FFB800]/10" : "border-white/10 hover:bg-white/5")}>
                                            <input type="file" accept="image/*" className="hidden" ref={thumbnailInputRef} onChange={handleThumbnailSelect} disabled={isUploading} />
                                            {thumbnailPreview ? (
                                                <img src={thumbnailPreview} alt="Custom" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <ImageIcon size={20} className="text-gray-500 mb-1" />
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Upload</span>
                                                </>
                                            )}
                                        </div>
                                        {autoThumbnails.map((thumb, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => !isUploading && handleAutoThumbSelect(idx)}
                                                className={cn(
                                                    "aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative",
                                                    selectedAutoThumb === idx ? "border-[#FFB800] scale-[1.02] shadow-[0_0_15px_rgba(255,184,0,0.3)]" : "border-transparent opacity-60 hover:opacity-100"
                                                )}
                                            >
                                                <img src={thumb} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                                {selectedAutoThumb === idx && (
                                                    <div className="absolute top-1.5 right-1.5 bg-[#FFB800] rounded-full p-0.5">
                                                        <Check size={12} className="text-black" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {fieldErrors.thumbnailFile && <p className="text-red-500 text-xs font-bold mt-2">{fieldErrors.thumbnailFile}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            disabled={isUploading}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#FFB800] transition-colors appearance-none cursor-pointer"
                                        >
                                            {CATEGORY_LIST.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Tags</label>
                                        <div className={cn("w-full bg-black/50 border rounded-lg px-3 py-2 text-white focus-within:border-[#FFB800] transition-colors flex flex-wrap gap-1.5 content-start min-h-[44px]", fieldErrors.tags ? "border-red-500" : "border-white/10")} onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
                                            {tags.map(tag => (
                                                <span key={tag} className="inline-flex items-center gap-1 bg-[#FFB800]/20 border border-[#FFB800]/40 text-[#FFB800] font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                    #{tag}
                                                    {!isUploading && <button type="button" onClick={() => removeTag(tag)} className="bg-transparent border-none text-[#FFB800] hover:text-white cursor-pointer p-0 ml-1 leading-none">&times;</button>}
                                                </span>
                                            ))}
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={onTagInputKeyDown}
                                                onBlur={() => commitTags(tagInput)}
                                                disabled={isUploading || tags.length >= TAG_MAX_COUNT}
                                                className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm text-white placeholder-gray-600"
                                                placeholder={tags.length === 0 ? "gaming, tutorial (Enter)" : ""}
                                            />
                                        </div>
                                        {fieldErrors.tags && <p className="text-red-500 text-xs font-bold mt-1.5">{fieldErrors.tags}</p>}
                                    </div>
                                </div>

                                {/* Visibility Selection */}
                                <div className="pt-4 border-t border-white/5">
                                    <h3 className="text-sm font-medium text-gray-400 mb-4">Visibility</h3>
                                    <div className="space-y-3">
                                        {visibilityOptions.map((option) => (
                                            <label
                                                key={option.id}
                                                className={cn(
                                                    "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                                                    visibility === option.id
                                                        ? "bg-[#FFB800]/10 border-[#FFB800]"
                                                        : "bg-white/5 border-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name="visibility"
                                                    className="hidden"
                                                    checked={visibility === option.id}
                                                    onChange={() => setVisibility(option.id as any)}
                                                    disabled={isUploading}
                                                />
                                                <div className={cn(
                                                    "p-2 rounded-lg shrink-0 transition-colors",
                                                    visibility === option.id ? "bg-[#FFB800] text-black" : "bg-white/10 text-gray-400"
                                                )}>
                                                    <option.icon size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-sm font-bold",
                                                        visibility === option.id ? "text-white" : "text-gray-300"
                                                    )}>{option.id}</span>
                                                    <span className="text-xs text-gray-500 font-medium mt-0.5">{option.desc}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3 mt-4">
                                    {touched && Object.keys(fieldErrors).length > 0 && (
                                        <p className="text-red-500 text-sm font-bold my-auto mr-auto">Please fix errors above.</p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setVideoFile(null)}
                                        disabled={isUploading}
                                        className="px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-white/5 transition-colors text-white border-none bg-transparent cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="px-8 py-2.5 bg-[#FFB800] text-black hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-extrabold transition-all active:scale-95 shadow-[0_4px_15px_rgba(255,184,0,0.3)] border-none"
                                    >
                                        {isUploading ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Processing</span> : 'Publish Video'}
                                    </button>
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
                                    <span className="text-sm font-medium truncate text-white">{videoFile.name}</span>
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
                                    <span className="text-gray-300 font-bold ml-4">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
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
