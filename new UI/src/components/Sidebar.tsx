import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, Users, Radio, Gamepad2, Music2, Trophy, Flame, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { MOCK_USERS, MOCK_VIDEOS } from "../constants";
import { cn } from "../lib/utils";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: PlaySquare, label: "Subscriptions", path: "/subs" },
  ];

  const libraryItems = [
    { icon: History, label: "History", path: "/history" },
    { icon: Clock, label: "Watch Later", path: "/later" },
    { icon: ThumbsUp, label: "Liked Videos", path: "/liked" },
  ];

  const twitchItems = [
    { icon: Radio, label: "Live", path: "/live", color: "text-red-500" },
    { icon: Gamepad2, label: "Gaming", path: "/gaming" },
    { icon: Music2, label: "Music", path: "/music" },
    { icon: Trophy, label: "Sports", path: "/sports" },
  ];

  const recentlyViewed = MOCK_VIDEOS.slice(0, 3);

  if (!isOpen) {
    return (
      <aside className="w-20 flex flex-col items-center py-4 gap-6 bg-[#0f0f0f] border-r border-white/5">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/5 transition-colors",
              location.pathname === item.path ? "text-white" : "text-gray-400"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        ))}
        <hr className="w-8 border-white/10" />
        <div className="flex flex-col items-center gap-4">
          {MOCK_USERS.slice(0, 3).map(user => (
            <Link key={user.id} to={`/channel/${user.id}`} className="relative">
              <img src={user.avatar} className="w-8 h-8 rounded-full border border-white/10" alt="" />
              {user.isLive && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-[#0f0f0f]" />}
            </Link>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 flex flex-col py-4 overflow-y-auto scrollbar-hide bg-[#0f0f0f] border-r border-white/5">
      <div className="px-3 space-y-1">
        {menuItems.map((item) => (
          <SidebarItem 
            key={item.label} 
            {...item} 
            isActive={location.pathname === item.path} 
          />
        ))}
      </div>

      <hr className="my-4 border-white/10 mx-4" />

      <div className="px-3">
        <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Following</h3>
        <div className="space-y-1">
          {MOCK_USERS.map((user) => (
            <Link
              key={user.id}
              to={`/channel/${user.id}`}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-white/10"
                  referrerPolicy="no-referrer"
                />
                {user.isLive && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-[#0f0f0f]" />
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate text-gray-200 group-hover:text-white">{user.name}</span>
                {user.isLive && <span className="text-[10px] text-red-500 font-bold">LIVE</span>}
              </div>
              {user.isLive && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-[10px] text-gray-400">45K</span>
                </div>
              )}
            </Link>
          ))}
          <button className="w-full flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <ChevronDown size={18} />
            <span className="text-sm">Show 12 more</span>
          </button>
        </div>
      </div>

      <hr className="my-4 border-white/10 mx-4" />

      <div className="px-3">
        <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Recently Viewed</h3>
        <div className="space-y-3 px-3">
          {recentlyViewed.map((video) => (
            <Link 
              key={video.id} 
              to={`/watch/${video.id}`}
              className="flex gap-3 group"
            >
              <div className="relative w-20 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <h4 className="text-xs font-semibold line-clamp-1 text-gray-300 group-hover:text-white">{video.title}</h4>
                <p className="text-[10px] text-gray-500 truncate">{video.creator.name}</p>
              </div>
            </Link>
          ))}
          <Link to="/history" className="flex items-center gap-3 py-1 text-xs font-bold text-[#9147ff] hover:underline">
            <History size={14} /> View full history
          </Link>
        </div>
      </div>

      <hr className="my-4 border-white/10 mx-4" />

      <div className="px-3">
        <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Explore</h3>
        <div className="space-y-1">
          {twitchItems.map((item) => (
            <SidebarItem key={item.label} {...item} />
          ))}
        </div>
      </div>

      <hr className="my-4 border-white/10 mx-4" />

      <div className="px-3">
        <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Library</h3>
        <div className="space-y-1">
          {libraryItems.map((item) => (
            <SidebarItem key={item.label} {...item} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ icon: Icon, label, path, isActive, color }: any) {
  return (
    <Link
      to={path}
      className={cn(
        "flex items-center gap-4 px-3 py-2 rounded-xl transition-all duration-200 group",
        isActive ? "bg-white/10 font-medium" : "hover:bg-white/5"
      )}
    >
      <Icon size={20} className={cn(isActive ? "text-white" : "text-gray-400 group-hover:text-white", color)} />
      <span className={cn("text-sm", isActive ? "text-white" : "text-gray-400 group-hover:text-white")}>
        {label}
      </span>
    </Link>
  );
}
