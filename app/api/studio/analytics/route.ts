import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Fetch High-Fidelity Daily Video Stats
        const { data: videoStats, error: statsError } = await supabase
            .from('video_daily_stats')
            .select(`
                *,
                videos!inner(user_id)
            `)
            .eq('videos.user_id', userId)
            .order('date', { ascending: true });

        if (statsError) throw statsError;

        // 2. Fetch Global Daily Stats (for Revenue)
        const { data: globalStats, error: globalStatsError } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: true })
            .limit(30);

        if (globalStatsError) throw globalStatsError;

        // 3. Fetch Top Content
        const { data: videos, error: vidsError } = await supabase
            .from('videos')
            .select('id, title, view_count, hype_count, thumbnail_url, is_short')
            .eq('user_id', userId)
            .order('view_count', { ascending: false })
            .limit(10);

        if (vidsError) throw vidsError;

        // 4. Prepare Chart Data (Last 7 Days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const chartData = last7Days.map(date => {
            const dayVideoStats = videoStats?.filter(s => s.date === date) || [];
            const dayGlobalStats = globalStats?.find(s => s.date === date);
            
            const totalViews = dayVideoStats.reduce((acc, s) => acc + Number(s.views || 0), 0);
            const totalRevenue = parseFloat(dayGlobalStats?.revenue_usdc || 0);
            
            return {
                date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                views: totalViews,
                revenue: totalRevenue,
            };
        });

        // 5. Overall Totals
        const totalViews = videos?.reduce((acc, v) => acc + (v.view_count || 0), 0) || 0;
        const totalHypes = videos?.reduce((acc, v) => acc + (v.hype_count || 0), 0) || 0;
        const totalRevenue = globalStats?.reduce((acc, s) => acc + parseFloat(s.revenue_usdc || 0), 0) || 0;

        return NextResponse.json({
            chartData,
            topVideos: videos,
            overallStats: {
                totalViews,
                totalHypes,
                totalRevenue,
                videoCount: videos?.length || 0,
                daysTracked: globalStats?.length || 0
            }
        });

    } catch (err: any) {
        console.error('[Analytics API Error]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
