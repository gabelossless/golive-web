'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls, { HlsConfig } from 'hls.js';
import * as Player from '@livepeer/react/player';
import TipButton from './TipButton';
import { getDecentralizedUrl, getLivepeerPlaybackUrl } from '@/lib/cdn';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    onActiveWatch?: () => void;
    creator?: {
        id: string;
        username: string;
        wallet_address?: string;
        solana_wallet_address?: string;
    };
    isLive?: boolean;
    playbackId?: string;
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

function formatTime(time: number): string {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function VideoPlayer(props: VideoPlayerProps) {
    const { src, poster, title, onActiveWatch, creator, isLive, playbackId } = props;
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isAmbientMode, setIsAmbientMode] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [buffered, setBuffered] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState(16 / 9);
    const [isVertical, setIsVertical] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const hasTriggeredWatch = useRef(false);
    const activeWatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // HLS.js Configuration (2025-2026 optimized)
    const hlsConfig: Partial<HlsConfig> = useMemo(() => ({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        capLevelToPlayerSize: true,
        autoStartLoad: true
    }), []);

    const isLivepeerEmbed = !!playbackId;

    const finalSrc = useMemo(() => {
        if (playbackId) return `https://lvpr.tv?v=${playbackId}`;
        return getDecentralizedUrl(src);
    }, [src, playbackId]);

    // Cleanup HLS instance
    const destroyHls = useCallback(() => {
        if (hlsRef.current) {
            hlsRef.current.stopLoad();
            hlsRef.current.detachMedia();
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

    // Initialize HLS or native playback (only for non-Livepeer sources)
    useEffect(() => {
        const video = videoRef.current;
        if (!video || isLivepeerEmbed) return;
        if (!src && !finalSrc) return;

        // Reset state for new source
        setError(null);
        hasTriggeredWatch.current = false;
        
        const isHls = src.includes('.m3u8') || finalSrc.includes('.m3u8');
        
        if (isHls && Hls.isSupported()) {
            destroyHls();
            const hls = new Hls(hlsConfig);
            hlsRef.current = hls;

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('HLS Network Error, attempting recovery...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('HLS Media Error, attempting recovery...');
                            hls.recoverMediaError();
                            break;
                        default:
                            setError('Fatal HLS Error: ' + data.details);
                            destroyHls();
                            break;
                    }
                }
            });

            hls.loadSource(finalSrc);
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native Safari HLS
            video.src = finalSrc;
        } else {
            // Standard MP4 Fallback
            video.src = finalSrc;
        }

        return () => destroyHls();
    }, [src, finalSrc, isLivepeerEmbed, hlsConfig, destroyHls]);

    // Strict view counting logic
    useEffect(() => {
        if (isPlaying && !hasTriggeredWatch.current) {
            // Start the 5-second timer for active watch
            activeWatchTimer.current = setTimeout(() => {
                hasTriggeredWatch.current = true;
                if (props.onActiveWatch) {
                    props.onActiveWatch();
                }
            }, 5000);
        } else {
            // Cancel timer if paused before 5 seconds
            if (activeWatchTimer.current) {
                clearTimeout(activeWatchTimer.current);
                activeWatchTimer.current = null;
            }
        }
        
        return () => {
            if (activeWatchTimer.current) {
                clearTimeout(activeWatchTimer.current);
            }
        };
    }, [isPlaying, props.onActiveWatch]);

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
        
        // Handle buffered progress across multiple buffered ranges (common in HLS)
        if (videoRef.current.buffered.length > 0) {
            const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
            setBuffered((bufferedEnd / videoRef.current.duration) * 100 || 0);
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

    useEffect(() => {
        if (!isAmbientMode || !isPlaying || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        let frameId: number;
        let timeoutId: ReturnType<typeof setTimeout>;

        const updateAmbient = () => {
            if (video.paused || video.ended) return;
            
            // Draw low-res frame for sampling
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Smoother refresh for a liquid feel
            const delay = window.innerWidth < 768 ? 150 : 60; 
            
            timeoutId = setTimeout(() => {
                frameId = requestAnimationFrame(updateAmbient);
            }, delay);
        };

        updateAmbient();
        return () => {
            cancelAnimationFrame(frameId);
            clearTimeout(timeoutId);
        };
    }, [isAmbientMode, isPlaying]);

    const toggleTheaterMode = () => {
        setIsTheaterMode(!isTheaterMode);
        window.dispatchEvent(new CustomEvent('theaterModeToggle', { detail: { enabled: !isTheaterMode } }));
    };

    // If this is a Livepeer stream, use the official Livepeer React Player SDK
    if (isLivepeerEmbed) {
        return (
            <div
                ref={containerRef}
                className={cn(
                    "relative bg-black shadow-[0_0_100px_rgba(0,0,0,0.8)] group transition-all duration-700 mx-auto aspect-video overflow-hidden",
                    isTheaterMode ? "w-[125%] -mx-[12.5%] rounded-none lg:rounded-[60px]" : "w-full rounded-[48px]"
                )}
            >
                <Player.Root playbackId={playbackId} src={null} autoPlay={false}>
                    <Player.Container className="w-full h-full bg-black">
                        <Player.Video 
                            title={title || 'Livepeer Video'}
                            poster={poster}
                            className="w-full h-full object-contain"
                        />

                        {/* Controls overlay */}
                        <Player.Controls className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="px-10 pb-10 pt-20 w-full flex flex-col">
                                <Player.Seek className="w-full relative flex items-center h-4 group/seek mb-6 cursor-pointer touch-none">
                                    <Player.Track className="relative h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                        <Player.SeekBuffer className="absolute h-full bg-white/40" />
                                        <Player.Range className="absolute h-full bg-[#FFB800]" />
                                    </Player.Track>
                                    <Player.Thumb className="block w-4 h-4 bg-white rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800]" />
                                </Player.Seek>
                                
                                <div className="flex items-center justify-between text-white w-full">
                                    <div className="flex items-center gap-4">
                                        <Player.PlayPauseTrigger className="hover:text-[#FFB800] transition-colors flex items-center justify-center -ml-1">
                                            <Player.PlayingIndicator matcher={false}>
                                                <Play size={24} fill="currentColor" />
                                            </Player.PlayingIndicator>
                                            <Player.PlayingIndicator matcher={true}>
                                                <Pause size={24} fill="currentColor" />
                                            </Player.PlayingIndicator>
                                        </Player.PlayPauseTrigger>

                                        <div className="flex items-center gap-2 group/volume relative mb-0">
                                            <Player.MuteTrigger className="hover:text-[#9147ff] transition-colors flex items-center justify-center">
                                                <Player.VolumeIndicator matcher={false}>
                                                    <VolumeX size={22} />
                                                </Player.VolumeIndicator>
                                                <Player.VolumeIndicator matcher={true}>
                                                    <Volume2 size={22} />
                                                </Player.VolumeIndicator>
                                            </Player.MuteTrigger>
                                            <Player.Volume className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 h-1 cursor-pointer flex items-center touch-none">
                                                <Player.Track className="relative h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                                    <Player.Range className="absolute h-full bg-[#FFB800]" />
                                                </Player.Track>
                                                <Player.Thumb className="block w-3 h-3 bg-white rounded-full shadow focus:outline-none" />
                                            </Player.Volume>
                                        </div>

                                        <div className="text-sm font-medium">
                                            <Player.Time />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        {(creator?.wallet_address || creator?.solana_wallet_address) && (
                                            <TipButton creator={creator} />
                                        )}
                                        
                                        <Player.FullscreenTrigger className="hover:text-[#FFB800] transition-colors">
                                            <Player.FullscreenIndicator matcher={false}>
                                                <Maximize size={20} />
                                            </Player.FullscreenIndicator>
                                            <Player.FullscreenIndicator matcher={true}>
                                                <Minimize size={20} />
                                            </Player.FullscreenIndicator>
                                        </Player.FullscreenTrigger>
                                    </div>
                                </div>
                            </div>
                        </Player.Controls>

                        <Player.LoadingIndicator className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 w-full h-full pointer-events-none">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFB800]"></div>
                        </Player.LoadingIndicator>
                        
                        <Player.ErrorIndicator matcher="all" className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 text-white flex-col p-4 text-center w-full h-full pointer-events-none">
                            <div className="text-red-500 mb-2">
                                <Settings size={32} />
                            </div>
                            <h3 className="text-lg font-bold">Processing Video...</h3>
                            <p className="text-sm text-gray-400">This asset might still be processing on Livepeer. Please refresh in a moment.</p>
                        </Player.ErrorIndicator>
                    </Player.Container>
                </Player.Root>
                
                {/* Live Badge Overlay */}
                {isLive && (
                    <div className="absolute top-4 left-4 z-20 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse flex items-center gap-1 shadow-lg pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        LIVE
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative bg-black overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] group transition-all duration-700 mx-auto aspect-dynamic border-premium font-premium",
                isTheaterMode 
                    ? "w-[125%] -mx-[12.5%] rounded-none lg:rounded-[60px]" 
                    : "w-full rounded-[48px]"
            )}
            style={{ 
                //@ts-ignore
                '--player-aspect': aspectRatio,
                '--player-max-h': isVertical ? '80vh' : 'auto',
                '--player-max-w': isVertical ? `calc(80vh * ${aspectRatio})` : 'none'
            } as React.CSSProperties}
            onMouseMove={showControlsTemporarily}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={() => {
                togglePlay();
                setShowSettings(false);
            }}
        >
            {/* Ambient Background */}
            {isAmbientMode && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden origin-center scale-[1.5] opacity-70 select-none transition-opacity duration-1000">
                    <canvas
                        ref={canvasRef}
                        width={64}
                        height={Math.round(64 / aspectRatio)}
                        className="w-full h-full blur-[140px] saturate-[2.5] brightness-90 transition-opacity duration-1000"
                    />
                </div>
            )}

            <video
                ref={videoRef}
                poster={getDecentralizedUrl(poster)}
                className="relative w-full h-full object-contain cursor-pointer z-10"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                    setError(null);
                    if (videoRef.current) {
                        setDuration(videoRef.current.duration);
                        const width = videoRef.current.videoWidth;
                        const height = videoRef.current.videoHeight;
                        const ar = width / height;
                        if (ar > 0) {
                            setAspectRatio(ar);
                            setIsVertical(ar < 1);
                        }
                    }
                }}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onVolumeChange={(e) => {
                    const v = (e.target as HTMLVideoElement).volume;
                    setVolume(v);
                    setIsMuted((e.target as HTMLVideoElement).muted || v === 0);
                }}
                onError={() => {
                    if (hlsRef.current) return; // Ignore native errors if HLS.js is handling it
                    const isMov = finalSrc?.toLowerCase().endsWith('.mov');
                    if (isMov) {
                        setError('This video is in .MOV/HEVC format. For best performance, use Safari or wait for the system to finish processing the HD version.');
                    } else {
                        setError('Failed to load video. Please check your connection or try again later.');
                    }
                }}
                playsInline
            />

            {/* Play overlay */}
            <AnimatePresence>
                {!isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                    >
                        <button 
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="w-32 h-32 bg-black/20 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(255,184,0,0.15)] hover:scale-110 hover:bg-black/40 transition-all pointer-events-auto group/play relative"
                            title={isPlaying ? "Pause" : "Play"}
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFB800]/20 to-transparent opacity-0 group-hover/play:opacity-100 transition-opacity" />
                            <Play size={56} className="text-[#FFB800] ml-3 drop-shadow-[0_0_15px_rgba(255,184,0,0.6)] group-hover/play:scale-110 transition-transform relative z-10" fill="currentColor" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Overlay */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm z-30"
                    >
                        <div className="text-center max-w-sm">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <Settings size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Playback Error</h3>
                            <p className="text-sm text-gray-400 mb-6">{error}</p>
                            <div className="flex gap-3 justify-center">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); location.reload(); }}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Retry
                                </button>
                                <a 
                                    href={src} 
                                    download 
                                    className="px-4 py-2 bg-[#FFB800] text-black rounded-lg text-xs font-bold no-underline hover:bg-orange-500 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Download Video
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls overlay */}
            <div
                className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end transition-all duration-700 pointer-events-none ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} z-20`}
                style={{ pointerEvents: showControls ? 'auto' : 'none' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-10 pb-10 pt-20">
                    <div
                        className="w-full h-1.5 bg-white/10 rounded-full mb-6 cursor-pointer relative group/progress overflow-visible touch-none"
                        onClick={handleProgressClick}
                        onTouchMove={(e) => {
                            if (!videoRef.current) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const touch = e.touches[0];
                            const pos = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                            videoRef.current.currentTime = pos * videoRef.current.duration;
                            setProgress(pos * 100);
                        }}
                    >
                        <div className="absolute top-0 left-0 h-full bg-white/20" style={{ width: `${buffered}%` }} />
                        <div className="absolute top-0 left-0 h-full bg-[#FFB800]" style={{ width: `${progress}%` }} />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 h-full bg-white/40 opacity-0 md:group-hover/progress:opacity-100 transition-opacity"
                            style={{ left: `${progress}%`, width: '2px' }}
                        />
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <button onClick={togglePlay} className="hover:text-[#FFB800] transition-colors" aria-label={isPlaying ? 'Pause' : 'Play'}>
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
                                    className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 h-1 cursor-pointer accent-[#FFB800]"
                                    aria-label="Volume Control"
                                    title="Volume Control"
                                />
                            </div>
                            <div className="text-sm font-medium">
                                {isLive ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                                        <span className="font-black uppercase tracking-widest text-[10px]">Live</span>
                                    </div>
                                ) : (
                                    `${formatTime(currentTime)} / ${formatTime(duration)}`
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {(creator?.wallet_address || creator?.solana_wallet_address) && (
                                <TipButton 
                                    creator={creator} 
                                />
                            )}
                            <div className="relative">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} 
                                    className="hover:text-[#FFB800] transition-colors text-white/70 hover:text-white" 
                                    title="Settings"
                                    aria-label="Settings"
                                >
                                    <Settings size={20} className={showSettings ? "text-[#FFB800] rotate-45" : "transition-transform duration-300"} />
                                </button>
                                
                                {/* Settings Menu */}
                                <AnimatePresence>
                                    {showSettings && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute bottom-full right-0 mb-4 w-56 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 p-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-3 py-2 border-b border-white/5 mb-1">
                                                Player Settings
                                            </div>
                                            <button 
                                                onClick={() => setIsAmbientMode(!isAmbientMode)}
                                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg transition-colors group"
                                            >
                                                <span className="text-xs font-bold text-gray-300 group-hover:text-white">Ambient Mode</span>
                                                <div className={cn(
                                                    "w-8 h-4 rounded-full transition-colors relative",
                                                    isAmbientMode ? "bg-[#FFB800]" : "bg-white/10"
                                                )}>
                                                    <div className={cn(
                                                        "absolute top-1 w-2 h-2 bg-white rounded-full transition-all",
                                                        isAmbientMode ? "right-1" : "left-1"
                                                    )} />
                                                </div>
                                            </button>
                                            <button 
                                                onClick={() => { toggleTheaterMode(); setShowSettings(false); }}
                                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg transition-colors group"
                                            >
                                                <span className="text-xs font-bold text-gray-300 group-hover:text-white">Theater Mode</span>
                                                <div className={cn(
                                                    "w-4 h-3 border-2 rounded-sm transition-colors",
                                                    isTheaterMode ? "border-[#FFB800] bg-[#FFB800]/20" : "border-gray-500"
                                                )} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button onClick={toggleFullscreen} className="hover:text-[#FFB800] transition-colors text-white/70 hover:text-white" aria-label="Fullscreen">
                                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
