import React from 'react';
import { supabase } from '@/lib/supabase';
import WatchClient from './WatchClient';
import Link from 'next/link';

export const revalidate = 0;

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    try {
        // Simple fetch
        const { data: video, error } = await supabase
            .from('videos')
            .select('*, profiles(username, avatar_url, is_verified)')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!video) {
            return (
                <div className="p-20 text-center bg-black min-h-screen text-white">
                    <h1 className="text-4xl font-black text-red-500 mb-4 tracking-tighter">VIDEO NOT FOUND</h1>
                    <p className="text-gray-400">ID: {id}</p>
                    <Link href="/" className="mt-8 inline-block text-[#FFB800] underline">Back to Home</Link>
                </div>
            );
        }

        // Fetch recommendations (simplified)
        const { data: recommendations } = await supabase
            .from('videos')
            .select('*, profiles(username, avatar_url, is_verified)')
            .eq('is_short', false)
            .limit(10);

        const normalized = {
            ...video,
            profiles: Array.isArray(video?.profiles) ? video.profiles[0] : video?.profiles
        };

        return <WatchClient video={normalized as any} recommendations={(recommendations || []) as any} />;

    } catch (e: any) {
        return (
            <div className="p-20 text-center bg-black min-h-screen text-white">
                <h1 className="text-4xl font-black text-orange-500 mb-4 tracking-tighter">SERVER ERROR</h1>
                <p className="text-gray-400 font-mono text-xs">{e.message}</p>
                <Link href="/" className="mt-8 inline-block text-[#FFB800] underline">Back to Home</Link>
            </div>
        );
    }
}
