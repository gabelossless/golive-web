import { useParams, Link } from "react-router-dom";
import { MOCK_VIDEOS, MOCK_USERS } from "../constants";
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, Bell, CheckCircle2 } from "lucide-react";
import Chat from "../components/Chat";
import VideoCard from "../components/VideoCard";
import VideoPlayer from "../components/VideoPlayer";
import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function Watch() {
  const { id } = useParams();
  const video = MOCK_VIDEOS.find((v) => v.id === id) || MOCK_VIDEOS[0];
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likes, setLikes] = useState(124000);
  const [isLiked, setIsLiked] = useState(false);

  const currentUser = MOCK_USERS[0]; // Ninja for demo

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide">
        <div className="max-w-[1280px] mx-auto space-y-4">
          {/* Video Player */}
          <VideoPlayer video={video} />

          <div className="space-y-4">
            <h1 className="text-xl font-bold leading-tight md:text-2xl">
              {video.title}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link to={`/channel/${video.creator.id}`} className="flex-shrink-0">
                  <img
                    src={video.creator.avatar}
                    alt={video.creator.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className="flex flex-col min-w-0">
                  <Link to={`/channel/${video.creator.id}`} className="font-bold flex items-center gap-1 hover:text-[#9147ff] transition-colors">
                    {video.creator.name}
                    <CheckCircle2 size={14} className="text-gray-400" />
                  </Link>
                  <span className="text-xs text-gray-400">
                    {video.creator.followers?.toLocaleString() || "1.2M"} subscribers
                  </span>
                </div>
                <button 
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={cn(
                    "ml-4 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95",
                    isSubscribed 
                      ? "bg-white/10 text-white hover:bg-white/20" 
                      : "bg-white text-black hover:bg-gray-200"
                  )}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
                {isSubscribed && (
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Bell size={20} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <div className="flex items-center bg-white/10 rounded-full overflow-hidden">
                  <button 
                    onClick={() => {
                      setIsLiked(!isLiked);
                      setLikes(prev => isLiked ? prev - 1 : prev + 1);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors border-r border-white/10",
                      isLiked && "text-[#9147ff]"
                    )}
                  >
                    <ThumbsUp size={18} fill={isLiked ? "currentColor" : "none"} />
                    <span className="text-sm font-bold">{(likes / 1000).toFixed(1)}K</span>
                  </button>
                  <button className="px-4 py-2 hover:bg-white/10 transition-colors">
                    <ThumbsDown size={18} />
                  </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <Share2 size={18} />
                  <span className="text-sm font-bold">Share</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors hidden sm:flex">
                  <Download size={18} />
                  <span className="text-sm font-bold">Download</span>
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 text-sm hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex gap-3 font-bold mb-1">
                <span>{video.views} views</span>
                <span>{video.uploadedAt}</span>
                {video.tags?.map(tag => (
                  <span key={tag} className="text-[#9147ff]">#{tag}</span>
                ))}
              </div>
              <p className="whitespace-pre-wrap text-gray-300">
                {video.description}
              </p>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Recommendations */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Recommended</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_VIDEOS.filter(v => v.id !== id).map(v => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Twitch-style Chat Sidebar */}
      <Chat roomId={video.id} currentUser={currentUser} />
    </div>
  );
}
