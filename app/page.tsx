import React from 'react';
import { supabase } from '@/lib/supabase';
import { Video } from '@/types';
import HomeClient from './HomeClient';

export const revalidate = 60; // Revalidate recommended feed every 60s

async function getVideos(): Promise<Video[]> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select(`
          id,
          title,
          thumbnail_url,
          created_at,
          view_count,
          target_views,
          boosted,
          profiles(username, avatar_url)
        `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching home videos:', error);
      return [];
    }

    const formattedVideos: Video[] = (data || []).map((v: any) => ({
      ...v,
      profiles: v.profiles, // Supabase returns single object or array depending on query, usually object here
      // Normalize views for growth hacking if needed
      view_count: Math.max(v.view_count || 0, v.target_views || 0),
    }));

    return formattedVideos;
  } catch (error) {
    console.error('Error in getVideos:', error);
    return [];
  }
}

export default async function HomePage() {
  const videos = await getVideos();
  return <HomeClient initialVideos={videos} />;
}
