import React from "react";
import { Link } from "react-router-dom";
import { Video } from "../types";
import { MoreVertical, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 group cursor-pointer"
    >
      <Link to={`/watch/${video.id}`} className="relative aspect-video rounded-xl overflow-hidden bg-white/5">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
          {video.duration}
        </div>
        {video.isLive && (
          <div className="absolute top-2 left-2 live-badge flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Live
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <div className="text-xs font-medium text-white/90">Click to watch</div>
        </div>
      </Link>

      <div className="flex gap-3">
        <Link to={`/channel/${video.creator.id}`} className="flex-shrink-0">
          <div className="relative">
            <img
              src={video.creator.avatar}
              alt={video.creator.name}
              className="w-9 h-9 rounded-full object-cover border border-white/10"
              referrerPolicy="no-referrer"
            />
            {video.creator.isLive && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#9147ff] rounded-full border-2 border-[#0f0f0f]" />
            )}
          </div>
        </Link>
        <div className="flex flex-col flex-1 min-w-0">
          <Link to={`/watch/${video.id}`}>
            <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-[#9147ff] transition-colors">
              {video.title}
            </h3>
          </Link>
          <div className="flex flex-col mt-1">
            <Link 
              to={`/channel/${video.creator.id}`}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {video.creator.name}
              <CheckCircle2 size={12} className="text-gray-500" />
            </Link>
            <div className="text-xs text-gray-400 mt-0.5">
              {video.views} views • {video.uploadedAt}
            </div>
          </div>
        </div>
        <button className="h-fit p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-full">
          <MoreVertical size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default VideoCard;

