'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, AlertCircle, Video as VideoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
            // Helper function to upload to R2
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

                const chunkSize = 5 * 1024 * 1024;
                const totalChunks = Math.ceil(file.size / chunkSize);
                const parts: { ETag: string; PartNumber: number }[] = [];
                let uploadedBytes = 0;

                for (let i = 0; i < endpoints.length; i++) {
                    const { url, partNumber } = endpoints[i];
                    const start = i * chunkSize;
                    const end = Math.min(start + chunkSize, file.size);
                    const chunk = file.slice(start, end);

                    const etag = await new Promise<string>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.upload.addEventListener('progress', (e) => {
                            if (e.lengthComputable) {
                                const currentUploaded = uploadedBytes + e.loaded;
                                onProgress(Math.round((currentUploaded / file.size) * 100));
                            }
                        });
                        xhr.addEventListener('load', () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                const eTagHeader = xhr.getResponseHeader('ETag');
                                if (!eTagHeader) {
                                    reject(new Error(`No ETag returned for chunk ${partNumber}`));
                                    return;
                                }
                                uploadedBytes += chunk.size;
                                resolve(eTagHeader.replace(/"/g, ''));
                            } else {
                                reject(new Error(`Chunk upload failed: ${xhr.statusText}`));
                            }
                        });
                        xhr.addEventListener('error', () => reject(new Error(`Network error`)));
                        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
                        xhr.open('PUT', url);
                        xhr.send(chunk);
                    });

                    parts.push({ ETag: etag, PartNumber: partNumber });
                }

                updateState({ message: 'Finalizing upload...' });
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
                    body: JSON.stringify({ rawPath: finalPath, userId: meta.userId }),
                });

                if (processRes.ok) {
                    const { path: hlsPath } = await processRes.json();
                    videoUrlPath = hlsPath;
                    updateState({ message: 'Optimization complete!', progress: 95 });
                }
            } catch (e) {
                console.warn('HLS Processing Error:', e);
            }

            // 4. Save to Database
            updateState({ message: 'Publishing to channel...', progress: 98 });
            
            // Assume default duration if we didn't extract it for simplicity right now
            // For production, we would extract duration from File object or Process API result
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
