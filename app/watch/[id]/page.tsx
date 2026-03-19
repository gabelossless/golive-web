import React from 'react';
import { supabase } from '@/lib/supabase';
import WatchClient from './WatchClient';
import Link from 'next/link';
import { Metadata, ResolvingMetadata } from 'next';

export const revalidate = 0;

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;
    
    // fetch data
    const { data: video } = await supabase
        .from('videos')
        .select('*, profiles(username, channel_name)')
        .eq('id', id)
        .maybeSingle();

    if (!video) {
        return {
            title: 'Video Not Found - VibeStream',
        }
    }

    const title = video.title || 'Untitled Video';
    const description = video.description || 'Watch this video on VibeStream';
    const defaultImage = 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=1200&q=80';
    
    return {
        title: `${title} - VibeStream`,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: [
                {
                    url: video.thumbnail_url || defaultImage,
                    width: 1280,
                    height: 720,
                    alt: title,
                },
            ],
            type: 'video.other',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: [video.thumbnail_url || defaultImage],
        },
    }
}

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
                    <h1 className="text-4xl font-black text-[#FFB800] mb-4 tracking-tighter uppercase">Video Not Found</h1>
                    <p className="text-gray-400">ID: {id}</p>
                    <Link href="/" className="mt-8 inline-block text-[#FFB800]/60 hover:text-[#FFB800] underline transition-colors">Back to Home</Link>
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
