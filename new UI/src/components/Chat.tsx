import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Smile, Users, Settings, X } from "lucide-react";
import { ChatMessage, User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface ChatProps {
  roomId: string;
  currentUser: User;
}

export default function Chat({ roomId, currentUser }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit("join-room", roomId);

    newSocket.on("receive-message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    // Initial welcome message
    setMessages([{
      id: "system-1",
      text: "Welcome to the live chat! Remember to be kind and respectful.",
      user: { id: "system", name: "System", avatar: "" },
      timestamp: new Date().toISOString()
    }]);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && socket) {
      socket.emit("send-message", {
        roomId,
        message: input,
        user: currentUser,
      });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] border-l border-white/10 w-full max-w-[400px] hidden lg:flex">
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#121212]">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-400" />
          <span className="text-sm font-bold uppercase tracking-wider">Live Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Settings size={18} className="text-gray-400" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 group"
            >
              {msg.user.id !== "system" && (
                <img
                  src={msg.user.avatar}
                  alt={msg.user.name}
                  className="w-6 h-6 rounded-full object-cover mt-0.5"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-xs font-bold",
                    msg.user.id === "system" ? "text-gray-500" : "text-[#9147ff]"
                  )}>
                    {msg.user.name}
                  </span>
                  <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={cn(
                  "text-sm leading-relaxed",
                  msg.user.id === "system" ? "italic text-gray-500" : "text-gray-200"
                )}>
                  {msg.text}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-[#121212] border-t border-white/10">
        <form onSubmit={handleSend} className="flex flex-col gap-2">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message"
              className="w-full bg-[#181818] border border-transparent focus:border-[#9147ff] rounded-lg p-3 text-sm outline-none resize-none scrollbar-hide min-h-[40px] max-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as any);
                }
              }}
            />
            <button 
              type="button"
              className="absolute right-3 bottom-3 text-gray-400 hover:text-white transition-colors"
            >
              <Smile size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Connected</span>
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-[#9147ff] hover:bg-[#772ce8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              Chat <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
