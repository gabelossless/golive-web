import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/analytics/event
 * Agent 2: Analytics Engine — Client Event Tracking Endpoint
 * 
 * Accepts a lightweight event payload from the client (video view, like, etc.)
 * and inserts it into the video_events table.
 * 
 * Body: { video_id, event_type, session_id, watch_seconds?, device_type?, country_code? }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { video_id, event_type, session_id, watch_seconds, device_type, country_code, referrer } = body;

        if (!video_id || !event_type || !session_id) {
            return NextResponse.json({ error: 'video_id, event_type, session_id required' }, { status: 400, headers: corsHeaders });
        }

        const validEvents = ['view', 'like', 'share', 'comment', 'complete', 'skip'];
        if (!validEvents.includes(event_type)) {
            return NextResponse.json({ error: `Invalid event_type. Must be one of: ${validEvents.join(', ')}` }, { status: 400, headers: corsHeaders });
        }

        // Use anon key — events can be logged without auth (for anonymous viewers)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Optional: get authenticated user
        const authHeader = request.headers.get('Authorization');
        let user_id: string | null = null;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { data: { user } } = await supabase.auth.getUser(token);
            user_id = user?.id ?? null;
        }

        const { error } = await supabase.from('video_events').insert({
            video_id,
            user_id,
            session_id,
            event_type,
            watch_seconds: watch_seconds ?? 0,
            device_type: device_type ?? null,
            country_code: country_code ?? null,
            referrer: referrer ?? null,
        });

        if (error) {
            // Log but don't block the user — analytics failure is non-critical
            console.error('[Analytics Event] Insert error:', error.message);
            return NextResponse.json({ ok: false, error: error.message }, { status: 200, headers: corsHeaders });
        }

        return NextResponse.json({ ok: true }, { headers: corsHeaders });

    } catch (err: any) {
        console.error('[Analytics Event] Error:', err);
        return NextResponse.json({ ok: false }, { status: 200, headers: corsHeaders }); // Always 200 to not break client
    }
}
