import React from 'react';
import { supabase } from '@/lib/supabase';
import { Video } from '@/types';
import { notFound } from 'next/navigation';
import EditVideoClient from './EditVideoClient';

export const revalidate = 0;

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: video, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error || !video) {
        notFound();
    }

    return <EditVideoClient video={video as Video} />;
}
