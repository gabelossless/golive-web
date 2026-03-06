'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Upload, X, CheckCircle, AlertCircle, FileVideo, Image as ImageIcon, Loader2, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';

// ── Validation constants ──────────────────────────────────────────────────────
const TITLE_MIN = 3;
const TITLE_MAX = 100;
const DESC_MAX = 5000;
const TAG_MAX_COUNT = 10;
const TAG_MAX_LEN = 30;
const VIDEO_MAX_MB = 2048; // 2 GB
const THUMB_MAX_MB = 10;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const TAG_RE = /^[a-zA-Z0-9_\-]+$/;

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
): ValidationErrors {
    const errors: ValidationErrors = {};

    // Title
    if (!title.trim()) {
        errors.title = 'Title is required.';
    } else if (title.trim().length < TITLE_MIN) {
        errors.title = `Title must be at least ${TITLE_MIN} characters.`;
    } else if (title.length > TITLE_MAX) {
        errors.title = `Title cannot exceed ${TITLE_MAX} characters.`;
    }

    // Description
    if (description.length > DESC_MAX) {
        errors.description = `Description cannot exceed ${DESC_MAX} characters.`;
    }

    // Tags
    if (tags.length > TAG_MAX_COUNT) {
        errors.tags = `You can add up to ${TAG_MAX_COUNT} tags.`;
    } else {
        const badTag = tags.find(t => !TAG_RE.test(t) || t.length > TAG_MAX_LEN);
        if (badTag) {
            errors.tags = `Tag "${badTag}" is invalid. Tags may only contain letters, numbers, hyphens, and underscores (max ${TAG_MAX_LEN} chars).`;
        }
    }

    // Video file
    if (!videoFile) {
        errors.videoFile = 'Please select a video file.';
    } else if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
        errors.videoFile = 'Unsupported video format. Please use MP4, WebM, MOV, or AVI.';
    } else if (videoFile.size > VIDEO_MAX_MB * 1024 * 1024) {
        errors.videoFile = `Video file must be under ${VIDEO_MAX_MB} MB.`;
    }

    // Thumbnail file (optional)
    if (thumbnailFile) {
        if (!ALLOWED_IMAGE_TYPES.includes(thumbnailFile.type)) {
            errors.thumbnailFile = 'Unsupported image format. Please use JPG, PNG, WebP, or GIF.';
        } else if (thumbnailFile.size > THUMB_MAX_MB * 1024 * 1024) {
            errors.thumbnailFile = `Thumbnail must be under ${THUMB_MAX_MB} MB.`;
        }
    }

    return errors;
}

// ── Tag input helpers ─────────────────────────────────────────────────────────
function parseTagInput(raw: string): string[] {
    return raw
        .split(/[\s,#]+/)
        .map(t => t.replace(/^#+/, '').trim().toLowerCase())
        .filter(Boolean);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function UploadPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStep, setUploadStep] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Field-level validation errors (shown on submit attempt)
    const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState(false);

    // ── File handlers ────────────────────────────────────────────────────────────
    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoFile(file);
        if (touched) {
            setFieldErrors(prev => ({ ...prev, videoFile: validateForm(title, description, tags, file, thumbnailFile).videoFile }));
        }
    };

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setThumbnailFile(file);
        const reader = new FileReader();
        reader.onload = () => setThumbnailPreview(reader.result as string);
        reader.readAsDataURL(file);
        if (touched) {
            setFieldErrors(prev => ({ ...prev, thumbnailFile: validateForm(title, description, tags, videoFile, file).thumbnailFile }));
        }
    };

    const clearVideo = () => {
        setVideoFile(null);
        if (touched) setFieldErrors(prev => ({ ...prev, videoFile: 'Please select a video file.' }));
    };
    const clearThumbnail = () => { setThumbnailFile(null); setThumbnailPreview(null); setFieldErrors(prev => ({ ...prev, thumbnailFile: undefined })); };

    // ── Live field validation ────────────────────────────────────────────────────
    const onTitleChange = (val: string) => {
        setTitle(val);
        if (touched) setFieldErrors(prev => ({ ...prev, title: validateForm(val, description, tags, videoFile, thumbnailFile).title }));
    };

    const onDescChange = (val: string) => {
        setDescription(val);
        if (touched) setFieldErrors(prev => ({ ...prev, description: validateForm(title, val, tags, videoFile, thumbnailFile).description }));
    };

    // Tag input: finalise on comma, space, or Enter
    const onTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ([',', ' ', 'Enter'].includes(e.key)) {
            e.preventDefault();
            commitTags(tagInput);
        } else if (e.key === 'Backspace' && !tagInput && tags.length) {
            const next = tags.slice(0, -1);
            setTags(next);
            if (touched) setFieldErrors(prev => ({ ...prev, tags: validateForm(title, description, next, videoFile, thumbnailFile).tags }));
        }
    };

    const commitTags = (raw: string) => {
        const parsed = parseTagInput(raw);
        if (!parsed.length) { setTagInput(''); return; }
        const next = [...new Set([...tags, ...parsed])]; // deduplicate
        setTags(next);
        setTagInput('');
        if (touched) setFieldErrors(prev => ({ ...prev, tags: validateForm(title, description, next, videoFile, thumbnailFile).tags }));
    };

    const removeTag = (tag: string) => {
        const next = tags.filter(t => t !== tag);
        setTags(next);
        if (touched) setFieldErrors(prev => ({ ...prev, tags: validateForm(title, description, next, videoFile, thumbnailFile).tags }));
    };

    // ── Submit ───────────────────────────────────────────────────────────────────
    const handleUpload = async () => {
        setTouched(true);
        const errors = validateForm(title, description, tags, videoFile, thumbnailFile);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return; // stop if any field error

        if (!user || !videoFile) return;
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const uploadToR2 = async (file: File, folder: string): Promise<string> => {
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
                        if (event.lengthComputable && folder.includes('videos')) {
                            setUploadProgress(Math.round((event.loaded / event.total) * 80));
                        }
                    });
                    xhr.addEventListener('load', () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const baseUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');
                            resolve(`${baseUrl}/${path}`);
                        } else {
                            reject(new Error(`Storage upload failed: ${xhr.statusText} (${xhr.status})`));
                        }
                    });
                    xhr.addEventListener('error', () => reject(new Error(`Network error during upload. Check your connection.`)));
                    xhr.addEventListener('abort', () => reject(new Error('Upload aborted.')));
                    xhr.open('PUT', url);
                    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
                    xhr.send(file);
                });
            };

            setUploadStep('Uploading video to edge network...');
            const videoUrl = await uploadToR2(videoFile, `videos/${user.id}`);
            setUploadProgress(50);

            setUploadStep('Uploading thumbnail...');
            let thumbnailUrl = null;
            if (thumbnailFile) thumbnailUrl = await uploadToR2(thumbnailFile, `thumbnails/${user.id}`);
            setUploadProgress(75);

            const finalDescription = visibility === 'private'
                ? `${description}\n\n[PRIVATE_VIDEO_FLAG]`
                : description;

            // Embed tags in description as hashtags (avoids schema change)
            const tagStr = tags.length ? `\n\nTags: ${tags.map(t => `#${t}`).join(' ')}` : '';

            setUploadStep('Publishing...');
            const { error: dbError } = await supabase.from('videos').insert({
                user_id: user.id,
                title: title.trim(),
                description: finalDescription + tagStr,
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

    // ── Loading / auth guards ────────────────────────────────────────────────────
    if (authLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={32} style={{ color: '#9147ff', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '16px', padding: '24px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={36} style={{ color: '#ef4444' }} />
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Sign in to Upload</h1>
                <p style={{ color: '#9ca3af', margin: 0, maxWidth: '320px' }}>You need an account to upload videos to GoLive.</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href="/login" style={{ padding: '10px 24px', borderRadius: '20px', background: '#9147ff', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>Log In</Link>
                    <Link href="/register" style={{ padding: '10px 24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>Sign Up</Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '16px', padding: '24px' }}>
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={44} style={{ color: '#10b981' }} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Video Published! 🎉</h1>
                <p style={{ color: '#9ca3af', maxWidth: '320px', margin: 0 }}>Your video is now live and ready for the world to see.</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button onClick={() => router.push('/')} style={btnPrimary}>Go to Home</button>
                    <button onClick={() => { setSuccess(false); setVideoFile(null); setThumbnailFile(null); setThumbnailPreview(null); setTitle(''); setDescription(''); setTags([]); setTagInput(''); setTouched(false); setFieldErrors({}); setIsUploading(false); }} style={btnSecondary}>Upload Another</button>
                </div>
            </div>
        );
    }

    const isFormValid = Object.keys(validateForm(title, description, tags, videoFile, thumbnailFile)).length === 0;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button onClick={() => router.back()} aria-label="Go Back" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Upload Video</h1>
                    <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Share your content with the GoLive community</p>
                </div>
            </div>

            {/* Global error */}
            {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#f87171' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{error}</span>
                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><X size={15} /></button>
                </div>
            )}

            {/* Progress bar */}
            {isUploading && (
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ color: '#9ca3af' }}>{uploadStep}</span>
                        <span style={{ color: '#9147ff', fontWeight: 700 }}>{uploadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #9147ff, #7c3aed)', borderRadius: '3px', transition: 'width 0.4s ease', boxShadow: '0 0 10px rgba(145,71,255,0.5)' }} />
                    </div>
                </div>
            )}

            {/* Main card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '40px' }}>

                {/* ── Left: File drops ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Video drop */}
                    <div>
                        <div style={labelStyle}>Video File <span style={{ color: '#ef4444' }}>*</span></div>
                        <label style={{ ...dropzone, ...(videoFile ? dropzoneActive : {}), ...(fieldErrors.videoFile ? dropzoneError : {}) }}>
                            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoSelect} />
                            {videoFile ? (
                                <div style={{ textAlign: 'center', padding: '16px', position: 'relative', width: '100%' }}>
                                    <button onClick={e => { e.preventDefault(); clearVideo(); }} style={clearBtn}><X size={13} /></button>
                                    <FileVideo size={28} style={{ color: '#9147ff', margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: '12px', fontWeight: 700, wordBreak: 'break-all', padding: '0 24px', margin: 0 }}>{videoFile.name}</p>
                                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '16px' }}>
                                    <Upload size={28} style={{ color: '#6b7280', margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', margin: 0 }}>Click to select video</p>
                                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>MP4, WebM, MOV · up to {VIDEO_MAX_MB} MB</p>
                                </div>
                            )}
                        </label>
                        {fieldErrors.videoFile && <div style={errorText}>{fieldErrors.videoFile}</div>}
                    </div>

                    {/* Thumbnail drop */}
                    <div>
                        <div style={labelStyle}>Thumbnail <span style={{ color: '#6b7280', fontWeight: 400 }}>(optional)</span></div>
                        <label style={{ ...dropzone, aspectRatio: '16/9', ...(thumbnailFile ? dropzoneActive : {}), ...(fieldErrors.thumbnailFile ? dropzoneError : {}), overflow: 'hidden' }}>
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumbnailSelect} />
                            {thumbnailPreview ? (
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <img src={thumbnailPreview} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    <button onClick={e => { e.preventDefault(); clearThumbnail(); }} style={{ ...clearBtn, top: '8px', right: '8px', background: 'rgba(0,0,0,0.65)' }}><X size={13} style={{ color: '#fff' }} /></button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '16px' }}>
                                    <ImageIcon size={22} style={{ color: '#6b7280', margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', margin: 0 }}>Click to add thumbnail</p>
                                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>JPG, PNG, WebP · up to {THUMB_MAX_MB} MB</p>
                                </div>
                            )}
                        </label>
                        {fieldErrors.thumbnailFile && <div style={errorText}>{fieldErrors.thumbnailFile}</div>}
                    </div>
                </div>

                {/* ── Right: Metadata ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Title */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={labelStyle}>Title <span style={{ color: '#ef4444' }}>*</span></div>
                            <span style={{ fontSize: '11px', color: title.length > TITLE_MAX * 0.9 ? '#f59e0b' : '#6b7280' }}>{title.length}/{TITLE_MAX}</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Give your video a great title"
                            value={title}
                            maxLength={TITLE_MAX}
                            onChange={e => onTitleChange(e.target.value)}
                            style={{ ...inputStyle, ...(fieldErrors.title ? inputError : {}) }}
                        />
                        {fieldErrors.title && <div style={errorText}>{fieldErrors.title}</div>}
                    </div>

                    {/* Description */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={labelStyle}>Description</div>
                            <span style={{ fontSize: '11px', color: description.length > DESC_MAX * 0.9 ? '#f59e0b' : '#6b7280' }}>{description.length}/{DESC_MAX}</span>
                        </div>
                        <textarea
                            placeholder="Tell viewers about your video..."
                            value={description}
                            maxLength={DESC_MAX}
                            onChange={e => onDescChange(e.target.value)}
                            style={{ ...inputStyle, height: '130px', resize: 'none', ...(fieldErrors.description ? inputError : {}) }}
                        />
                        {fieldErrors.description && <div style={errorText}>{fieldErrors.description}</div>}
                    </div>

                    {/* Tags */}
                    <div>
                        <div style={labelStyle}><Tag size={13} style={{ display: 'inline', marginRight: '4px' }} />Tags <span style={{ color: '#6b7280', fontWeight: 400 }}>(up to {TAG_MAX_COUNT})</span></div>
                        <div style={{ ...inputStyle, display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px 12px', cursor: 'text', ...(fieldErrors.tags ? inputError : {}) }}
                            onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
                            {tags.map(tag => (
                                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(145,71,255,0.15)', border: '1px solid rgba(145,71,255,0.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', color: '#c4b5fd', fontWeight: 500 }}>
                                    #{tag}
                                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={onTagInputKeyDown}
                                onBlur={() => commitTags(tagInput)}
                                placeholder={tags.length === 0 ? 'e.g. gaming, tutorial (press Enter or comma)' : ''}
                                style={{ flex: 1, minWidth: '140px', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px' }}
                                disabled={tags.length >= TAG_MAX_COUNT}
                            />
                        </div>
                        {fieldErrors.tags
                            ? <div style={errorText}>{fieldErrors.tags}</div>
                            : <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Press Enter, comma, or space to add a tag. {TAG_MAX_COUNT - tags.length} remaining.</p>
                        }
                    </div>

                    {/* Visibility */}
                    <div>
                        <div style={labelStyle}>Visibility</div>
                        <select
                            value={visibility}
                            onChange={e => setVisibility(e.target.value as 'public' | 'private')}
                            aria-label="Video Visibility"
                            style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as any }}
                        >
                            <option value="public">Public — Anyone can see this video</option>
                            <option value="private">Private — Only you can see this video</option>
                        </select>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 'auto' }}>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>By publishing, you agree to GoLive&apos;s Terms.</p>
                        <button
                            disabled={isUploading}
                            onClick={handleUpload}
                            style={{
                                ...btnPrimary,
                                opacity: isUploading ? 0.6 : 1,
                                cursor: isUploading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}
                        >
                            {isUploading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Publishing...</> : <><Upload size={15} /> Publish</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Hint when form has errors after submit attempt */}
            {touched && !isFormValid && (
                <p style={{ textAlign: 'center', color: '#f87171', fontSize: '13px', marginTop: '16px' }}>
                    Please fix the errors above before publishing.
                </p>
            )}
        </div>
    );
}

// ── Shared style tokens ────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: '#e5e7eb', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' };
const errorText: React.CSSProperties = { fontSize: '12px', color: '#f87171', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' };
const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 13px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' };
const inputError: React.CSSProperties = { borderColor: 'rgba(239,68,68,0.5)', boxShadow: '0 0 0 2px rgba(239,68,68,0.1)' };
const dropzone: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '16/9', borderRadius: '14px', border: '2px dashed rgba(255,255,255,0.12)', cursor: 'pointer', transition: 'all 0.15s', background: 'rgba(255,255,255,0.02)' };
const dropzoneActive: React.CSSProperties = { borderColor: '#9147ff', background: 'rgba(145,71,255,0.05)' };
const dropzoneError: React.CSSProperties = { borderColor: 'rgba(239,68,68,0.4)' };
const clearBtn: React.CSSProperties = { position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' };
const btnPrimary: React.CSSProperties = { padding: '10px 24px', borderRadius: '20px', background: 'linear-gradient(135deg, #9147ff, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(145,71,255,0.35)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' };
const btnSecondary: React.CSSProperties = { padding: '10px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' };
