import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Requires a Service Role key to bypass RLS and update any stream
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        // Simple CRON security: require an auth header matching a cron secret
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Calculate timestamp for 2 minutes ago
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

        // Find all live streams where last_heartbeat is older than 2 minutes ago
        const { data: idleStreams, error: fetchError } = await supabase
            .from('videos')
            .select('id, pipeline')
            .eq('is_live', true)
            .lt('last_heartbeat', twoMinutesAgo);

        if (fetchError) throw fetchError;

        if (!idleStreams || idleStreams.length === 0) {
            return NextResponse.json({ message: 'No idle streams found.', killed: 0 });
        }

        // For each idle stream, we could also call LiveKit/Livepeer APIs to forcefully end them
        // For V1, simply marking them as is_live = false prevents new viewers and 
        // stops them from showing up on the platform as active.
        
        const streamIds = idleStreams.map(s => s.id);
        
        const { error: updateError } = await supabase
            .from('videos')
            .update({ is_live: false })
            .in('id', streamIds);

        if (updateError) throw updateError;

        console.log(`[Auto-Kill] Swept and killed ${streamIds.length} idle streams.`);

        return NextResponse.json({ 
            success: true, 
            message: `Killed ${streamIds.length} idle streams.`,
            killedIds: streamIds
        });

    } catch (error: any) {
        console.error("Cleanup error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
