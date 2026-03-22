'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, AlertCircle, Video as VideoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import pLimit from 'p-limit';

interface UploadState {
    isUploading: boolean;
    progress: number;
    message: string;
    isError: boolean;
}

interface UploadContextType {
    uploadState: UploadState;
    startUpload: (
        videoFile: File,
        thumbnailFile: File | null,
        metadata: {
            title: string;
            description: string;
            category: string;
            isShort: boolean;
            userId: string;
            sessionToken: string;
            duration: number;
        }
    ) => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
    const [uploadState, setUploadState] = useState<UploadState>({
        isUploading: false,
        progress: 0,
        message: '',
        isError: false,
    });

    const updateState = (updates: Partial<UploadState>) => {
        setUploadState(prev => ({ ...prev, ...updates }));
    };

    const startUpload = async (videoFile: File, thumbnailFile: File | null, meta: any) => {
        if (uploadState.isUploading) {
            console.warn('Upload already in progress');
            return;
        }

        updateState({ isUploading: true, progress: 0, message: 'Starting upload...', isError: false });

        try {
            // Helper function to upload to R2 with retries and hardening
            const uploadToR2 = async (file: File, folder: string, onProgress: (p: number) => void) => {
                const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                
                const createRes = await fetch('/api/upload/multipart', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${meta.sessionToken}`
                    },
                    body: JSON.stringify({ 
                        action: 'create', 
                        filename: uniqueFilename, 
                        contentType: file.type, 
                        folder,
                        fileSize: file.size,
                        isShort: meta.isShort,
                        duration: meta.duration
                    }),
                });

                if (!createRes.ok) throw new Error('Failed to initialize upload');
                const { uploadId, key, endpoints } = await createRes.json();

                const limit = pLimit(5); // Increased for faster high-bandwidth performance
                const chunkSize = 5 * 1024 * 1024;
                let uploadedBytes = 0;
                const startTime = Date.now();

                // Advanced retry wrapper for individual chunks
                const uploadWithRetry = async (endpoint: any, index: number, retries = 3): Promise<{ ETag: string; PartNumber: number }> => {
                    const { url, partNumber } = endpoint;
                    const start = index * chunkSize;
                    const end = Math.min(start + chunkSize, file.size);
                    const chunk = file.slice(start, end);

                    try {
                        return await new Promise<{ ETag: string; PartNumber: number }>((resolve, reject) => {
                            const xhr = new XMLHttpRequest();
                            xhr.upload.addEventListener('progress', (e) => {
                                // Sub-chunk progress could be tracked here for ultra-smooth UI if needed
                            });
                            xhr.addEventListener('load', () => {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    const eTagHeader = xhr.getResponseHeader('ETag');
                                    if (!eTagHeader) {
                                        reject(new Error(`No ETag returned for chunk ${partNumber}`));
                                        return;
                                    }
                                    uploadedBytes += chunk.size;
                                    
                                    // Progress + ETA Calculation
                                    const now = Date.now();
                                    const elapsed = (now - startTime) / 1000;
                                    const bps = uploadedBytes / elapsed;
                                    const remainingBytes = file.size - uploadedBytes;
                                    const eta = remainingBytes / bps;
                                    
                                    const progressPercent = Math.round((uploadedBytes / file.size) * 100);
                                    const etaSeconds = Math.round(eta);
                                    const etaMsg = etaSeconds > 60 
                                        ? `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s` 
                                        : `${etaSeconds}s`;

                                    onProgress(progressPercent);
                                    if (progressPercent < 100) {
                                        updateState({ message: `Uploading... ${progressPercent}% (${etaMsg} remaining)` });
                                    }
                                    
                                    resolve({ ETag: eTagHeader.replace(/"/g, ''), PartNumber: partNumber });
                                } else {
                                    reject(new Error(`Chunk upload failed with status ${xhr.status}`));
                                }
                            });
                            xhr.addEventListener('error', () => reject(new Error('Network error')));
                            xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
                            xhr.open('PUT', url);
                            xhr.send(chunk);
                        });
                    } catch (err) {
                        if (retries > 0) {
                            console.warn(`Retrying chunk ${partNumber}... Attempts left: ${retries}`);
                            // Small backoff before retry
                            await new Promise(r => setTimeout(r, 1000 * (4 - retries)));
                            return uploadWithRetry(endpoint, index, retries - 1);
                        }
                        throw err;
                    }
                };

                try {
                    const uploadChunks = endpoints.map((endpoint: any, i: number) => {
                        return limit(() => uploadWithRetry(endpoint, i));
                    });

                    const parts = await Promise.all(uploadChunks);

                    updateState({ message: 'Finalizing secure storage...' });
                    const completeRes = await fetch('/api/upload/multipart', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${meta.sessionToken}`
                        },
                        body: JSON.stringify({ action: 'complete', uploadId, key, parts }),
                    });

                    if (!completeRes.ok) throw new Error('Failed to finalize upload');
                    const { path } = await completeRes.json();
                    return path;

                } catch (err) {
                    // CRITICAL: Abort on server to clean up orphaned parts
                    console.error('Multipart upload failed. Aborting...', err);
                    await fetch('/api/upload/multipart', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'abort', uploadId, key }),
                    }).catch(e => console.error('Cleanup fail:', e));
                    throw err;
                }
            };

            // 1. Upload Thumbnail (if any)
            let thumbnailUrl = null;
            if (thumbnailFile) {
                updateState({ message: 'Uploading thumbnail...', progress: 5 });
                thumbnailUrl = await uploadToR2(thumbnailFile, `thumbnails/${meta.userId}`, () => {});
            }

            // 2. Upload Video
            updateState({ message: 'Uploading video...', progress: 10 });
            const finalPath = await uploadToR2(videoFile, `videos/${meta.userId}`, (p) => {
                const combined = Math.floor(p * 0.8) + 10;
                updateState({ progress: combined, message: `Uploading video to edge... ${combined}%` });
            });

            // 3. Process HLS
            updateState({ message: 'Optimizing for adaptive streaming...', progress: 92 });
            let videoUrlPath = finalPath;

            try {
                const processRes = await fetch('/api/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        rawPath: finalPath, 
                        userId: meta.userId,
                        title: meta.title 
                    }),
                });

                if (processRes.ok) {
                    const data = await processRes.json();
                    if (data.provider === 'livepeer') {
                        updateState({ message: 'Professional Transcoding (Livepeer)...', progress: 95 });
                        // For Livepeer, we store the playbackId
                        const { error: dbError } = await supabase
                            .from('videos')
                            .insert([{
                                user_id: meta.userId,
                                title: meta.title,
                                description: meta.description || null,
                                video_url: finalPath, // Fallback to raw R2
                                thumbnail_url: thumbnailUrl || null,
                                is_short: meta.isShort,
                                category: meta.category,
                                duration: meta.duration,
                                playback_id: data.playbackId // CRITICAL: Store Livepeer ID
                            }]);
                        
                        if (dbError) throw dbError;
                        updateState({ message: 'Livepeer Optimization Complete!', progress: 100 });
                    } else {
                        const { path: hlsPath } = data;
                        videoUrlPath = hlsPath;
                        updateState({ message: 'HLS Optimization complete!', progress: 95 });
                        
                        // Standard Save
                        const { error: dbError } = await supabase
                            .from('videos')
                            .insert([{
                                user_id: meta.userId,
                                title: meta.title,
                                description: meta.description || null,
                                video_url: videoUrlPath,
                                thumbnail_url: thumbnailUrl || null,
                                is_short: meta.isShort,
                                category: meta.category,
                                duration: meta.duration
                            }]);
                        if (dbError) throw dbError;
                    }
                } else {
                    // Fallback save if process fails but upload succeeded
                    const { error: dbError } = await supabase
                        .from('videos')
                        .insert([{
                            user_id: meta.userId,
                            title: meta.title,
                            description: meta.description || null,
                            video_url: finalPath,
                            thumbnail_url: thumbnailUrl || null,
                            is_short: meta.isShort,
                            category: meta.category,
                            duration: meta.duration
                        }]);
                    if (dbError) throw dbError;
                }
            } catch (e) {
                console.warn('HLS Processing/Save Error:', e);
                // Last ditch save
                await supabase.from('videos').insert([{
                    user_id: meta.userId,
                    title: meta.title,
                    video_url: finalPath,
                    is_short: meta.isShort,
                    duration: meta.duration
                }]);
            }

            updateState({ message: 'Video published!', progress: 100 });
            
            // Hide toast after 3 seconds
            setTimeout(() => {
                setUploadState({ isUploading: false, progress: 0, message: '', isError: false });
            }, 3000);

        } catch (err: any) {
            console.error('Upload failed:', err);
            updateState({ isError: true, message: `Upload failed: ${err.message || 'Unknown error'}` });
            setTimeout(() => setUploadState({ isUploading: false, progress: 0, message: '', isError: false }), 5000);
        }
    };

    return (
        <UploadContext.Provider value={{ uploadState, startUpload }}>
            {children}
            {/* Global Toast */}
            <AnimatePresence>
                {uploadState.isUploading && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="fixed bottom-6 right-6 z-[100] w-[320px] bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-black/50 pointer-events-auto flex flex-col"
                    >
                        <div className="p-4 flex items-start gap-4">
                            <div className="mt-1">
                                {uploadState.isError ? (
                                    <AlertCircle className="text-red-500" size={20} />
                                ) : uploadState.progress === 100 ? (
                                    <CheckCircle2 className="text-green-500" size={20} />
                                ) : (
                                    <Loader2 className="text-[#FFB800] animate-spin" size={20} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white mb-1">
                                    {uploadState.isError ? 'Upload Error' : uploadState.progress === 100 ? 'Upload Complete' : 'Uploading...'}
                                </h4>
                                <p className="text-xs text-gray-400 font-medium line-clamp-2">
                                    {uploadState.message}
                                </p>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        {!uploadState.isError && uploadState.progress < 100 && (
                            <div className="h-1 bg-white/5 w-full">
                                <motion.div 
                                    className="h-full bg-[#FFB800]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadState.progress}%` }}
                                    transition={{ ease: "linear", duration: 0.2 }}
                                />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </UploadContext.Provider>
    );
}

export function useUpload() {
    const context = useContext(UploadContext);
    if (!context) {
        throw new Error('useUpload must be used within an UploadProvider');
    }
    return context;
}
