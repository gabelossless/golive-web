import React from 'react';
import { supabase } from '@/lib/supabase';
import { Video } from '@/types';
import WatchClient from './WatchClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0;

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    // 1. Try simplest possible fetch first
    const { data: simpleVideo, error: simpleError } = await supabase
        .from('videos')
        .select('id, title, video_url')
        .eq('id', id)
        .maybeSingle();

    if (simpleError) {
        return (
            <div className="p-20 text-center">
                <h1 className="text-2xl font-bold text-red-500">SIMPLE FETCH FAILED</h1>
                <p className="text-gray-400 mt-2">{simpleError.message}</p>
                <p className="text-xs text-gray-600 mt-1">Code: {simpleError.code} | ID: {id}</p>
            </div>
        );
    }

    if (!simpleVideo) {
        // Try a standard select without single to see if it's there at all
        const { data: listData } = await supabase.from('videos').select('id').eq('id', id);
        return (
            <div className="p-20 text-center">
                <h1 className="text-2xl font-bold text-yellow-500">VIDEO NOT FOUND IN DB</h1>
                <p className="text-gray-400 mt-2">The record with ID {id} could not be matched via maybeSingle.</p>
                <p className="text-xs text-gray-600 mt-1">List Length: {listData?.length || 0}</p>
                <Link href="/" className="mt-4 inline-block text-[#FFB800] underline">Back to Home</Link>
            </div>
        );
    }

    // 2. If simple fetch works, try the full fetch
    const { data: fullVideo, error: fullError } = await supabase
        .from('videos')
        .select(`
            id, 
            title, 
            description, 
            video_url, 
            thumbnail_url, 
            view_count, 
            created_at, 
            is_live, 
            duration, 
            category, 
            width, 
            height,
            is_short,
            profiles (
                id, 
                username, 
                avatar_url,
                is_verified
            )
        `)
        .eq('id', id)
        .maybeSingle();

    if (fullError) {
        return (
             <div className="p-20 text-center">
                <h1 className="text-2xl font-bold text-orange-500">FULL FETCH FAILED</h1>
                <p className="text-gray-400 mt-2">Simple fetch worked, but full fetch failed. Likely a missing column.</p>
                <p className="text-gray-300 mt-1">Error: {fullError.message}</p>
                <p className="text-xs text-gray-600 mt-1">Code: {fullError.code}</p>
                <div className="mt-6 flex gap-4 justify-center">
                    <button onClick={() => location.reload()} className="px-4 py-2 bg-white/10 rounded">Retry</button>
                    <Link href="/" className="px-4 py-2 bg-[#FFB800] text-black rounded font-bold">Back Home</Link>
                </div>
            </div>
        );
    }

    // 3. Success! Normalize and render
    const normalized = {
        ...fullVideo,
        profiles: Array.isArray(fullVideo?.profiles) ? fullVideo.profiles[0] : fullVideo?.profiles
    };

    return <WatchClient initialVideo={normalized as any} />;
}
