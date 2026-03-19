import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/studio/revenue
 * Fetches aggregated tip revenue and recent transactions for the current creator.
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Fetch all tip transactions for this creator
        const { data: tips, error } = await supabase
            .from('tip_transactions')
            .select('*')
            .eq('creator_user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Aggregate totals
        let totalUSDC = 0;
        let totalNativeBase = 0;
        let totalNativeSolana = 0;

        tips.forEach(tip => {
            const val = parseFloat(tip.amount_raw);
            if (tip.asset === 'usdc') {
                totalUSDC += val;
            } else if (tip.chain === 'base') {
                totalNativeBase += val;
            } else {
                totalNativeSolana += val;
            }
        });

        // 3. Group by day for the chart (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const chartData = last7Days.map(date => {
            const dayTips = tips.filter(t => t.created_at.startsWith(date));
            const usdc = dayTips.reduce((acc, t) => t.asset === 'usdc' ? acc + parseFloat(t.amount_raw) : acc, 0);
            return {
                date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                revenue: usdc, // Primary chart shows USDC for stability
            };
        });

        return NextResponse.json({
            stats: {
                totalUSDC,
                totalNativeBase,
                totalNativeSolana,
                count: tips.length
            },
            recentTips: tips.slice(0, 10),
            chartData
        });

    } catch (err: any) {
        console.error('[Revenue API Error]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
