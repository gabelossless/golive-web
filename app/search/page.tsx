'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Filter, CheckCircle2, MoreVertical, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { formatViews, timeAgo } from '@/lib/utils';
import SearchFilters from '@/components/SearchFilters';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [videos, setVideos] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        date: 'all',
        duration: 'all',
        sortBy: 'relevance'
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        if (query) {
            fetchResults();
        } else {
            setLoading(false);
            setVideos([]);
            setProfiles([]);
        }
    }, [query, filters]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            let queryBuilder = supabase
                .from('videos')
                .select('*, profiles(username, avatar_url, is_verified, display_name, channel_name)')
                .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

            // Apply Date Filters
            if (filters.date !== 'all') {
                const now = new Date();
                let filterDate;
                if (filters.date === 'hour') filterDate = new Date(now.getTime() - 3600000);
                if (filters.date === 'today') filterDate = new Date(now.setHours(0, 0, 0, 0));
                if (filters.date === 'week') filterDate = new Date(now.getTime() - 7 * 24 * 3600000);
                if (filters.date === 'month') filterDate = new Date(now.setMonth(now.getMonth() - 1));
                if (filters.date === 'year') filterDate = new Date(now.setFullYear(now.getFullYear() - 1));
                
                if (filterDate) {
                    queryBuilder = queryBuilder.gte('created_at', filterDate.toISOString());
                }
            }

            // Apply Sort
            if (filters.sortBy === 'date') {
                queryBuilder = queryBuilder.order('created_at', { ascending: false });
            } else if (filters.sortBy === 'views') {
                queryBuilder = queryBuilder.order('view_count', { ascending: false });
            } else if (filters.sortBy === 'rating') {
                queryBuilder = queryBuilder.order('hype_count', { ascending: false });
            } else {
                // Default relevance (for now, view_count is a proxy for relevance in this simple setup)
                queryBuilder = queryBuilder.order('view_count', { ascending: false });
            }

            // Fetch videos and profiles in parallel
            const [videoRes, profileRes] = await Promise.all([
                queryBuilder.limit(40),
                supabase
                    .from('profiles')
                    .select('id, username, display_name, channel_name, avatar_url, is_verified, bio')
                    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,channel_name.ilike.%${query}%`)
                    .limit(4)
            ]);

            if (videoRes.error) throw videoRes.error;

            let formatted = (videoRes.data || []).map(v => ({
                ...v,
                profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
            }));

            // Client-side Duration Filtering (as we don't have a reliable way to query string H:M:S in Supabase without custom functions)
            if (filters.duration !== 'all') {
                formatted = formatted.filter(v => {
                    const parts = (v.duration || '0:00').split(':').map(Number);
                    const seconds = parts.length === 3 
                        ? parts[0] * 3600 + parts[1] * 60 + parts[2]
                        : parts[0] * 60 + parts[1];
                    
                    if (filters.duration === 'short') return seconds < 240;
                    if (filters.duration === 'medium') return seconds >= 240 && seconds <= 1200;
                    if (filters.duration === 'long') return seconds > 1200;
                    return true;
                });
            }

            // Safe filter
            setVideos(formatted.filter((v: any) => !(v.description || '').includes('[PRIVATE_VIDEO_FLAG]')));

            if (profileRes.data) {
                setProfiles(profileRes.data);
            }
        } catch (err) {
            console.error('Error searching:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1100px] mx-auto p-4 md:p-6 lg:p-8 w-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black tracking-tighter uppercase italic">Search results for "{query}"</h2>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/5 cursor-pointer ${
                        showFilters ? 'bg-white text-black border-white' : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                >
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <SearchFilters 
                        isOpen={showFilters} 
                        onClose={() => setShowFilters(false)} 
                        filters={filters}
                        onFilterChange={handleFilterChange}
                    />
                )}
            </AnimatePresence>

            <div className="space-y-6">
                {loading ? (
                    <div className="flex justify-center py-20 text-[#FFB800]">
                        <Loader2 size={40} className="animate-spin" />
                    </div>
                ) : videos.length === 0 && profiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>No results found for "{query}"</p>
                    </div>
                ) : (
                    <>
                        {profiles.length > 0 && (
                            <div className="mb-10 space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4 border-b border-white/5 pb-2">Creators</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profiles.map(profile => (
                                        <Link href={`/profile/${profile.username}`} key={profile.id} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors group">
                                            <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} className="w-16 h-16 rounded-full object-cover group-hover:scale-105 transition-transform" alt={profile.username} />
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-lg truncate group-hover:text-[#FFB800] transition-colors">{profile.channel_name || profile.display_name || profile.username}</span>
                                                    {profile.is_verified && <CheckCircle2 size={16} className="text-[#FFB800]" />}
                                                </div>
                                                <span className="text-sm text-gray-500">@{profile.username}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {videos.length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4 border-b border-white/5 pb-2">Videos</h3>
                                <div className="space-y-6">
                                    {videos.map((video, index) => {
                                        const author = video.profiles?.username || 'Unknown';
                                        const avatar = video.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`;

                                        return (
                                            <motion.div
                                key={video.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex flex-col sm:flex-row gap-4 group cursor-pointer"
                            >
                                <Link href={`/watch/${video.id}`} className="relative flex-shrink-0 w-full sm:w-80 aspect-video rounded-xl overflow-hidden bg-white/5">
                                    <img
                                        src={video.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop'}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        referrerPolicy="no-referrer"
                                    />
                                    {video.duration && !video.is_live && (
                                        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                            {video.duration}
                                        </div>
                                    )}
                                    {video.is_live && (
                                        <div className="absolute top-2 left-2 live-badge">Live</div>
                                    )}
                                </Link>

                                <div className="flex flex-col flex-1 min-w-0 py-1">
                                    <div className="flex justify-between gap-2">
                                        <Link href={`/watch/${video.id}`} className="no-underline">
                                            <h3 className="text-lg font-bold line-clamp-2 group-hover:text-[#FFB800] transition-colors text-white m-0">
                                                {video.title}
                                            </h3>
                                        </Link>
                                        <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-full h-fit text-gray-400 border-none bg-transparent cursor-pointer" title="More options">
                                            <MoreVertical size={20} />
                                        </button>
                                    </div>

                                    <div className="text-xs text-gray-500 font-medium mt-1">
                                        {formatViews(video.target_views || video.view_count || 0)} views • {timeAgo(video.created_at)}
                                    </div>

                                    <Link
                                        href={`/profile/${author}`}
                                        className="flex items-center gap-2 my-3 hover:text-white transition-colors no-underline w-fit"
                                    >
                                        <img
                                            src={avatar}
                                            alt={author}
                                            className="w-6 h-6 rounded-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            {author}
                                            {(video.profiles as any)?.is_verified && <CheckCircle2 size={12} className="text-[#FFB800]" />}
                                        </span>
                                    </Link>

                                    <p className="text-xs text-gray-400 line-clamp-2 m-0">
                                        {video.description?.trim() || 'No description available.'}
                                    </p>

                                    {video.is_live && (
                                        <div className="mt-2">
                                            <span className="text-[10px] bg-red-600/20 text-red-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                New Live
                                            </span>
                                        </div>
                                    )}
                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20 text-[#FFB800]">
                <Loader2 size={40} className="animate-spin" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
