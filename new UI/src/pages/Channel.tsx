import { useParams } from "react-router-dom";
import { MOCK_USERS, MOCK_VIDEOS } from "../constants";
import VideoCard from "../components/VideoCard";
import { motion } from "motion/react";
import { Bell, Search, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

export default function Channel() {
  const { id } = useParams();
  const user = MOCK_USERS.find((u) => u.id === id) || MOCK_USERS[0];
  const [activeTab, setActiveTab] = useState("Home");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const tabs = ["Home", "Videos", "Shorts", "Live", "Playlists", "Community", "About"];

  return (
    <div className="flex flex-col min-h-full">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-[#9147ff] to-red-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img
            src={`https://picsum.photos/seed/${user.name}/1920/400`}
            alt="Banner"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 md:px-16 lg:px-24 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#0f0f0f] shadow-xl"
              referrerPolicy="no-referrer"
            />
            {user.isLive && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 live-badge px-3 py-1 text-xs shadow-lg">
                Live
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
              {user.name}
              <CheckCircle2 size={24} className="text-gray-400" />
            </h1>
            <div className="flex items-center gap-2 text-gray-400 text-sm md:text-base">
              <span>@{user.name.toLowerCase().replace(/\s/g, '')}</span>
              <span>•</span>
              <span>{user.followers?.toLocaleString()} subscribers</span>
              <span>•</span>
              <span>1.2K videos</span>
            </div>
            <p className="text-gray-300 text-sm max-w-2xl line-clamp-2">
              Welcome to my official channel! I stream daily and upload highlights every week. Don't forget to subscribe and hit the bell icon!
            </p>
            
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95",
                  isSubscribed 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "bg-white text-black hover:bg-gray-200"
                )}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
              {isSubscribed && (
                <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <Bell size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-white/10 flex items-center gap-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-sm font-bold uppercase tracking-wider transition-all relative",
                activeTab === tab ? "text-white" : "text-gray-400 hover:text-white"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" 
                />
              )}
            </button>
          ))}
          <div className="flex-1" />
          <button className="pb-3 text-gray-400 hover:text-white">
            <Search size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {MOCK_VIDEOS.filter(v => v.creator.id === user.id || v.creator.name === user.name).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
