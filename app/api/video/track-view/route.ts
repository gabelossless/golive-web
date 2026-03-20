import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from 'next/server';

// Simple in-memory rate limit for demo/production-ready foundation
const viewRateLimit = new Map<string, number>();
const RATE_LIMIT_COOLDOWN = 2000; // 2 seconds between views from same IP

export async function POST(req: NextRequest) {
    try {
        const { videoId, sessionId } = await req.json();
        
        if (!videoId) {
            return NextResponse.json({ error: 'Missing Video ID' }, { status: 400 });
        }

        // 1. Server-Side IP Detection (True Trust Boundary)
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   '127.0.0.1';
        
        // 2. Simple Rate Limiting (Prevent Flood)
        const now = Date.now();
        const lastView = viewRateLimit.get(ip) || 0;
        if (now - lastView < RATE_LIMIT_COOLDOWN) {
            return NextResponse.json({ success: true, message: 'Rate limited', status: 'throttled' });
        }
        viewRateLimit.set(ip, now);

        const supabase = await createClient();
        const userAgent = req.headers.get('user-agent') || 'unknown';

        // 3. SECURE RPC CALL
        // Note: The RPC handles IP detection internally via request headers if available,
        // but we can also pass hints or just let it use the trust-hardened logic.
        const { data, error } = await supabase.rpc('track_video_view', {
            p_video_id: videoId,
            p_session_id: sessionId,
            p_user_agent: userAgent
        });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            incremented: data?.incremented,
            message: data?.message
        });

    } catch (err: any) {
        console.error('[Track View Error]:', err);
        return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
    }
}
