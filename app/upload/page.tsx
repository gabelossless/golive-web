'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Upload, X, CheckCircle, AlertCircle, FileVideo, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStep, setUploadStep] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setVideoFile(file);
    };

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            const reader = new FileReader();
            reader.onload = () => setThumbnailPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const clearVideo = () => setVideoFile(null);
    const clearThumbnail = () => { setThumbnailFile(null); setThumbnailPreview(null); };

    const handleUpload = async () => {
        if (!user || !videoFile || !title) return;
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            // 1. Upload Video
            setUploadStep('Uploading video...');
            const videoPath = `${user.id}/${Date.now()}_${videoFile.name}`;
            const { error: videoError } = await supabase.storage
                .from('videos')
                .upload(videoPath, videoFile);

            if (videoError) throw videoError;
            setUploadProgress(50);

            // 2. Upload Thumbnail (Optional)
            setUploadStep('Uploading thumbnail...');
            let thumbnailUrl = null;
            if (thumbnailFile) {
                const thumbPath = `${user.id}/${Date.now()}_${thumbnailFile.name}`;
                const { error: thumbError } = await supabase.storage
                    .from('thumbnails')
                    .upload(thumbPath, thumbnailFile);

                if (thumbError) throw thumbError;

                const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(thumbPath);
                thumbnailUrl = publicUrl;
            }
            setUploadProgress(75);

            // 3. Get Video Public URL
            const { data: { publicUrl: videoUrl } } = supabase.storage.from('videos').getPublicUrl(videoPath);

            // 4. Create DB Record
            setUploadStep('Publishing...');
            const { error: dbError } = await supabase.from('videos').insert({
                user_id: user.id,
                title,
                description,
                video_url: videoUrl,
                thumbnail_url: thumbnailUrl,
            });

            if (dbError) throw dbError;
            setUploadProgress(100);
            setUploadStep('');
            setSuccess(true);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Upload failed. Please try again.');
            setIsUploading(false);
        }
    };

    // Auth Loading
    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-2">
                    <AlertCircle size={36} className="text-destructive" />
                </div>
                <h1 className="text-2xl font-black">Sign in to Upload</h1>
                <p className="text-muted max-w-sm">You need an account to upload videos to GoLive.</p>
                <div className="flex gap-3 mt-2">
                    <Link href="/login" className="btn btn-primary px-6 py-2.5 rounded-full font-bold">Log In</Link>
                    <Link href="/register" className="btn btn-secondary px-6 py-2.5 rounded-full font-bold border border-border">Sign Up</Link>
                </div>
            </div>
        );
    }

    // Success State
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                    <CheckCircle size={48} className="text-green-500" />
                </div>
                <h1 className="text-2xl font-black">Video Published! 🎉</h1>
                <p className="text-muted max-w-sm">Your video is now live and ready for the world to see.</p>
                <div className="flex gap-3 mt-4">
                    <button onClick={() => router.push('/')} className="btn btn-primary px-6 py-2.5 rounded-full font-bold">
                        Go to Home
                    </button>
                    <button onClick={() => { setSuccess(false); setVideoFile(null); setThumbnailFile(null); setThumbnailPreview(null); setTitle(''); setDescription(''); setIsUploading(false); }} className="btn btn-secondary px-6 py-2.5 rounded-full font-bold border border-border">
                        Upload Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-surface transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black">Upload Video</h1>
                    <p className="text-sm text-muted">Share your content with the GoLive community</p>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-medium">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
                </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
                <div className="mb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted font-medium">{uploadStep}</span>
                        <span className="text-primary font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(145,71,255,0.5)]"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: File Selection */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Video File */}
                    <div>
                        <label className="text-sm font-bold block mb-2">Video File *</label>
                        <label className={`block aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${videoFile ? 'border-primary bg-primary/5' : 'border-border hover:border-muted hover:bg-surface'}`}>
                            <input type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                            {videoFile ? (
                                <div className="text-center p-4 relative w-full">
                                    <button onClick={(e) => { e.preventDefault(); clearVideo(); }} className="absolute top-2 right-2 p-1 bg-surface rounded-full hover:bg-destructive/20 transition-colors"><X size={14} /></button>
                                    <FileVideo size={28} className="text-primary mx-auto mb-2" />
                                    <p className="text-xs font-bold break-all px-4">{videoFile.name}</p>
                                    <p className="text-[10px] text-muted mt-1">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                </div>
                            ) : (
                                <div className="text-center p-4">
                                    <Upload size={28} className="text-muted mx-auto mb-2" />
                                    <p className="text-sm font-bold text-muted">Click to select video</p>
                                    <p className="text-[10px] text-muted/50 mt-1">MP4, WebM, MOV</p>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Thumbnail */}
                    <div>
                        <label className="text-sm font-bold block mb-2">Thumbnail (Optional)</label>
                        <label className={`block aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${thumbnailFile ? 'border-primary' : 'border-border hover:border-muted hover:bg-surface'}`}>
                            <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailSelect} />
                            {thumbnailPreview ? (
                                <div className="relative w-full h-full">
                                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                                    <button onClick={(e) => { e.preventDefault(); clearThumbnail(); }} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-destructive/80 transition-colors"><X size={14} className="text-white" /></button>
                                </div>
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon size={24} className="text-muted mx-auto mb-2" />
                                    <p className="text-xs font-bold text-muted">Click to add thumbnail</p>
                                    <p className="text-[10px] text-muted/50 mt-1">JPG, PNG</p>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Right: Details Form */}
                <div className="lg:col-span-3 space-y-5">
                    <div>
                        <label className="text-sm font-bold block mb-2">Title *</label>
                        <input
                            type="text"
                            className="w-full bg-surface border border-border rounded-xl p-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium placeholder-muted/40"
                            placeholder="Give your video a title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                        />
                        <p className="text-[10px] text-muted text-right mt-1">{title.length}/100</p>
                    </div>
                    <div>
                        <label className="text-sm font-bold block mb-2">Description</label>
                        <textarea
                            className="w-full h-40 bg-surface border border-border rounded-xl p-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium placeholder-muted/40 resize-none"
                            placeholder="Tell viewers about your video (tags, links, credits...)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={5000}
                        />
                        <p className="text-[10px] text-muted text-right mt-1">{description.length}/5000</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        <p className="text-xs text-muted">By publishing, you agree to GoLive's Terms of Service.</p>
                        <button
                            disabled={!videoFile || !title || isUploading}
                            onClick={handleUpload}
                            className="btn btn-primary px-8 py-3 rounded-full text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center gap-2"
                        >
                            {isUploading ? (
                                <><Loader2 size={16} className="animate-spin" /> Publishing...</>
                            ) : (
                                <><Upload size={16} /> Publish</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
