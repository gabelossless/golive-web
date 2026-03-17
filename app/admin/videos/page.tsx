import React from 'react';
import { createClient } from '@/lib/supabase-server';
import { 
    Search, 
    MoreVertical, 
    Play, 
    Trash2, 
    EyeOff, 
    MessageSquare,
    Clock,
    Vibrate
} from 'lucide-react';

export default async function AdminVideos() {
    const supabase = await createClient();

    const { data: videos, error } = await supabase
        .from('videos')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase">Content Library</h2>
                    <p className="text-sm text-gray-500">Manage all videos, shorts, and live streams.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search content..." 
                            className="bg-[#0a0a0a] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm focus:border-[#FFB800]/50 outline-none w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Video</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Creator</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Metrics</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {videos?.map((video) => (
                            <tr key={video.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 aspect-video rounded-xl bg-white/5 overflow-hidden border border-white/5 shrink-0 relative">
                                            <img src={video.thumbnail_url || '/placeholder-thumb.jpg'} className="w-full h-full object-cover" alt="" />
                                            {video.duration && (
                                                <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[8px] font-bold">
                                                    {video.duration}s
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm line-clamp-1 group-hover:text-[#FFB800] transition-colors">{video.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${video.visibility === 'public' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>
                                                    {video.visibility}
                                                </span>
                                                <span className="text-[10px] text-gray-500">•</span>
                                                <span className="text-[10px] text-gray-500">{new Date(video.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-xs font-bold text-gray-400">@{video.profiles?.username}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4 text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Play size={12} />
                                            <span className="text-[10px] font-bold">{video.view_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageSquare size={12} />
                                            <span className="text-[10px] font-bold">0</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        {video.is_short ? (
                                            <div className="p-1 rounded bg-purple-500/10 text-purple-500" title="Short">
                                                <Vibrate size={14} />
                                            </div>
                                        ) : video.is_live ? (
                                            <div className="p-1 rounded bg-red-500/10 text-red-500 border border-red-500/20" title="Live">
                                                <Clock size={14} />
                                            </div>
                                        ) : (
                                            <div className="p-1 rounded bg-blue-500/10 text-blue-500" title="Video">
                                                <Play size={14} fill="currentColor" />
                                            </div>
                                        )}
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                                            {video.is_short ? 'Short' : video.is_live ? 'Live' : 'Video'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400" title="Mark Unlisted">
                                            <EyeOff size={18} />
                                        </button>
                                        <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-500" title="Delete Content">
                                            <Trash2 size={18} />
                                        </button>
                                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400" title="More Options" aria-label="More Options">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
