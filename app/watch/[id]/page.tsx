import React from 'react';
import { supabase } from '@/lib/supabase';
import { Video } from '@/types';
import WatchClient from './WatchClient';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Ensure fresh data for views/likes

// Helper to fetch video on server
async function getVideo(id: string): Promise<Video | null> {
    const { data, error } = await supabase
        .from('videos')
        .select('*, profiles(id, username, avatar_url)')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching video:', error);
        return null;
    }

    // Normalize profile data if it comes as array
    if (data && Array.isArray(data.profiles)) {
        data.profiles = data.profiles[0];
    }

    return data as Video;
}

export default async function WatchPage({ params }: { params: { id: string } }) {
    const video = await getVideo(params.id);

    if (!video) {
        notFound();
    }

    return <WatchClient initialVideo={video} />;
}
