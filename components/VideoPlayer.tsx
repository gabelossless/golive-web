'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
}

function formatTime(time: number): string {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [buffered, setBuffered] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const showControlsTemporarily = useCallback(() => {
        setShowControls(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    }, [isPlaying]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
        setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100 || 0);
        if (videoRef.current.buffered.length > 0) {
            setBuffered((videoRef.current.buffered.end(0) / videoRef.current.duration) * 100 || 0);
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = pos * videoRef.current.duration;
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (videoRef.current) {
            videoRef.current.volume = v;
            videoRef.current.muted = v === 0;
            setIsMuted(v === 0);
        }
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/50 group"
            onMouseMove={showControlsTemporarily}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full object-contain cursor-pointer"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
                onEnded={() => setIsPlaying(false)}
                playsInline
            />

            {/* Play overlay */}
            <AnimatePresence>
                {!isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-20 h-20 bg-red-600/90 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] backdrop-blur-sm">
                            <Play size={36} className="text-white ml-2" fill="currentColor" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls overlay */}
            <div
                className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}
                style={{ pointerEvents: showControls ? 'auto' : 'none' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-4 pb-4 pt-12">
                    {/* Progress bar */}
                    <div
                        className="w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer relative group/progress"
                        onClick={handleProgressClick}
                    >
                        <div className="absolute top-0 left-0 h-full bg-white/30 rounded-full" style={{ width: `${buffered}%` }} />
                        <div className="absolute top-0 left-0 h-full bg-red-600 rounded-full" style={{ width: `${progress}%` }} />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                            style={{ left: `calc(${progress}% - 6px)` }}
                        />
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <button onClick={togglePlay} className="hover:text-[#9147ff] transition-colors" aria-label={isPlaying ? 'Pause' : 'Play'}>
                                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                            </button>
                            <div className="flex items-center gap-2 group/volume">
                                <button onClick={toggleMute} className="hover:text-[#9147ff] transition-colors" aria-label="Toggle mute">
                                    {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 h-1 cursor-pointer"
                                    aria-label="Volume"
                                />
                            </div>
                            <div className="text-sm font-medium">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="hover:text-[#9147ff] transition-colors text-white/70 hover:text-white" aria-label="Settings">
                                <Settings size={20} />
                            </button>
                            <button onClick={toggleFullscreen} className="hover:text-[#9147ff] transition-colors text-white/70 hover:text-white" aria-label="Fullscreen">
                                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
