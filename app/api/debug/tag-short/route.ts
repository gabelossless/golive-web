import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    try {
        // Tag the most recent video as a short for testing
        const { data: video, error: fetchError } = await supabase
            .from('videos')
            .select('id, title')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (fetchError || !video) {
            return NextResponse.json({ error: 'No video found to tag' }, { status: 404 });
        }

        const { error: updateError } = await supabase
            .from('videos')
            .update({ is_short: true })
            .eq('id', video.id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Tagged video "${video.title}" as a Short.`,
            videoId: video.id
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
