import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from 'next/server';

// Simple in-memory rate limit for demo/production-ready foundation
const viewRateLimit = new Map<string, number>();
const RATE_LIMIT_COOLDOWN = 1500; // 1.5 seconds between views from same IP (Balanced)

export async function POST(req: NextRequest) {
    try {
        const { videoId, sessionId } = await req.json();
        
        if (!videoId) {
            return NextResponse.json({ error: 'Missing Video ID' }, { status: 400 });
        }

        // 1. Server-Side IP Detection
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   '127.0.0.1';
        
        // 2. Individual Rate Limiting (Flood Prevention)
        const now = Date.now();
        const lastView = viewRateLimit.get(ip) || 0;
        if (now - lastView < RATE_LIMIT_COOLDOWN) {
            return NextResponse.json({ success: true, message: 'Vibe pulse detected', status: 'throttled' });
        }
        viewRateLimit.set(ip, now);

        const supabase = await createClient();
        const userAgent = req.headers.get('user-agent') || 'unknown';

        // 3. UNIFIED VIBE GUARD RPC
        // This handles scoring, pulse adjustment, and shadow-buffering internally.
        const { data, error } = await supabase.rpc('process_vibe_event', {
            p_video_id: videoId,
            p_event_type: 'view',
            p_session_id: sessionId,
            p_metadata: { user_agent: userAgent }
        });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            status: data?.status || 'verified',
            message: data?.status === 'buffered' ? 'Vibe recorded for verification' : 'Vibe verified'
        });

    } catch (err: any) {
        console.error('[Vibe Guard Error]:', err);
        return NextResponse.json({ error: 'System busy, please try again' }, { status: 500 });
    }
}
