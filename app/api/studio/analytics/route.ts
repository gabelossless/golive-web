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

        // 1. Fetch Daily Stats (Last 14 days for more context)
        const { data: stats, error: statsError } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: true })
            .limit(14);

        if (statsError) throw statsError;

        // 2. Fetch Video Metadata for "Top Content"
        const { data: videos, error: vidsError } = await supabase
            .from('videos')
            .select('id, title, view_count, hype_count, thumbnail_url')
            .eq('user_id', userId)
            .order('view_count', { ascending: false })
            .limit(5);

        if (vidsError) throw vidsError;

        // 3. Prepare Chart Data (Fill gaps if necessary)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const chartData = last7Days.map(date => {
            const dayStat = stats?.find(s => s.date === date);
            return {
                date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                views: dayStat?.views || 0,
                revenue: parseFloat(dayStat?.revenue_usdc || 0),
            };
        });

        // 4. Totals for Header
        const totalViews = stats?.reduce((acc, s) => acc + (s.views || 0), 0) || 0;
        const totalRevenue = stats?.reduce((acc, s) => acc + parseFloat(s.revenue_usdc || 0), 0) || 0;

        return NextResponse.json({
            chartData,
            topVideos: videos,
            overallStats: {
                totalViews,
                totalRevenue,
                daysTracked: stats?.length || 0
            }
        });

    } catch (err: any) {
        console.error('[Analytics API Error]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
