import { Menu, Search, Video, Bell, User, Mic, Camera } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-[#0f0f0f] glass">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <Menu size={24} />
        </button>
        <Link to="/" className="flex items-center gap-1 group">
          <div className="relative">
            <Video className="text-red-600 group-hover:scale-110 transition-transform" size={28} fill="currentColor" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#9147ff] rounded-full animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tighter font-display hidden sm:block">
            Stream<span className="text-[#9147ff]">Tube</span>
          </span>
        </Link>
      </div>

      <form 
        onSubmit={handleSearch}
        className="flex-1 max-w-2xl mx-4 hidden md:flex items-center"
      >
        <div className="flex flex-1 items-center bg-[#121212] border border-[#3f3f3f] rounded-l-full px-4 py-1.5 focus-within:border-blue-500 transition-colors">
          <Search className="text-gray-400 mr-2" size={18} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
        <button className="bg-[#222222] border border-l-0 border-[#3f3f3f] px-5 py-1.5 rounded-r-full hover:bg-[#333333] transition-colors">
          <Search size={18} />
        </button>
        <button type="button" className="ml-4 p-2.5 bg-[#181818] rounded-full hover:bg-white/10 transition-colors">
          <Mic size={18} />
        </button>
      </form>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block">
          <Camera size={22} />
        </button>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block">
          <Bell size={22} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9147ff] to-red-600 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
          <User size={18} />
        </div>
      </div>
    </nav>
  );
}
