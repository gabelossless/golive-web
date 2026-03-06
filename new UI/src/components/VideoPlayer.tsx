import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, MessageSquare, MessageSquareOff } from 'lucide-react';
import { Video } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface VideoPlayerProps {
  video: Video;
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showChatOverlay, setShowChatOverlay] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Using a reliable sample video for demonstration
  const videoSrc = "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && !video.isLive) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
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

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/50 group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={video.thumbnail}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        playsInline
      />

      {/* Play/Pause Overlay Animation */}
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

      {/* Chat Overlay */}
      <AnimatePresence>
        {showChatOverlay && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 bottom-20 w-64 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-3 flex flex-col overflow-hidden z-20"
          >
            <div className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider border-b border-white/10 pb-2">Live Chat Overlay</div>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 flex flex-col-reverse">
              {/* Mock Chat Messages */}
              <div className="text-sm"><span className="font-bold text-[#9147ff]">NinjaFan:</span> This is epic! 🔥</div>
              <div className="text-sm"><span className="font-bold text-green-400">GamerGuy99:</span> POGGERS</div>
              <div className="text-sm"><span className="font-bold text-blue-400">TechGeek:</span> What specs are those?</div>
              <div className="text-sm"><span className="font-bold text-yellow-400">StreamMod:</span> Welcome to the stream!</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end transition-opacity duration-300 z-10",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="px-4 pb-4 pt-12">
          {/* Progress Bar */}
          {!video.isLive && (
            <div 
              className="w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer relative group/progress"
              onClick={handleProgressClick}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
                style={{ width: `${progress}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
          )}

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="hover:text-[#9147ff] transition-colors">
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>

              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="hover:text-[#9147ff] transition-colors">
                  {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 accent-white h-1 cursor-pointer"
                />
              </div>

              <div className="text-sm font-medium flex items-center gap-2">
                {video.isLive ? (
                  <div className="flex items-center gap-2 text-red-500 font-bold">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </div>
                ) : (
                  <>
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-white/50">/</span>
                    <span className="text-white/50">{formatTime(duration)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {video.isLive && (
                <button 
                  onClick={() => setShowChatOverlay(!showChatOverlay)}
                  className={cn(
                    "transition-colors",
                    showChatOverlay ? "text-[#9147ff]" : "hover:text-white text-white/70"
                  )}
                  title="Toggle Chat Overlay"
                >
                  {showChatOverlay ? <MessageSquare size={20} /> : <MessageSquareOff size={20} />}
                </button>
              )}
              <button className="hover:text-[#9147ff] transition-colors text-white/70 hover:text-white">
                <Settings size={20} />
              </button>
              <button onClick={toggleFullscreen} className="hover:text-[#9147ff] transition-colors text-white/70 hover:text-white">
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
