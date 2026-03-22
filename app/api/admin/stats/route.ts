import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * GET /api/admin/stats
 * Agent 2: Analytics Engine — Protected Admin Stats API
 * 
 * Calls the `get_platform_stats()` Supabase RPC function which runs
 * a set of COUNT queries across videos, profiles, video_events, etc.
 * Also saves a daily snapshot to platform_reports for trend tracking.
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Auth check — must be signed in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        // Role check — must be admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403, headers: corsHeaders });
        }

        // Call the Supabase RPC for a full stats snapshot
        const { data: stats, error: statsError } = await supabase.rpc('get_platform_stats');

        if (statsError) {
            console.error('[Admin Stats] RPC error:', statsError);
            // Fallback: return basic counts if RPC not yet migrated
            const [
                { count: total_users },
                { count: total_videos },
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('videos').select('*', { count: 'exact', head: true }),
            ]);

            return NextResponse.json({
                total_users: total_users ?? 0,
                total_videos: total_videos ?? 0,
                total_views: 0,
                total_likes: 0,
                total_comments: 0,
                new_users_today: 0,
                new_videos_today: 0,
                dau: 0,
                views_today: 0,
                likes_today: 0,
                avg_watch_seconds: 0,
                top_video: null,
                top_countries: [],
                device_distribution: [],
                views_last_30_days: [],
                _fallback: true,
            }, { headers: corsHeaders });
        }

        // Save today's snapshot to platform_reports (upsert by date)
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('platform_reports').upsert({
            report_date: today,
            total_users: stats.total_users ?? 0,
            total_videos: stats.total_videos ?? 0,
            total_views_today: stats.views_today ?? 0,
            total_likes_today: stats.likes_today ?? 0,
            total_comments_today: 0,
            new_users_today: stats.new_users_today ?? 0,
            dau: stats.dau ?? 0,
            avg_watch_seconds: stats.avg_watch_seconds ?? 0,
            total_uploads_today: stats.new_videos_today ?? 0,
            top_video_id: stats.top_video?.id ?? null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'report_date' });

        return NextResponse.json(stats, { headers: corsHeaders });

    } catch (err: any) {
        console.error('[Admin Stats] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}
