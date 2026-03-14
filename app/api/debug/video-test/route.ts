import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '18090125-a51d-4b9c-8b2f-cdf42f0f39f7';

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const anonClient = createClient(supabaseUrl, supabaseAnonKey);
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

        const results: any = {
            id,
            timestamp: new Date().toISOString(),
            checks: {}
        };

        // 1. Check with Service Role
        const { data: serviceData, error: serviceError } = await serviceClient
            .from('videos')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        results.checks.service_role = {
            found: !!serviceData,
            error: serviceError ? serviceError.message : null,
            data: serviceData
        };

        // 2. Check with Anon Key
        const { data: anonData, error: anonError } = await anonClient
            .from('videos')
            .select('id, title, video_url')
            .eq('id', id)
            .maybeSingle();

        results.checks.anon = {
            found: !!anonData,
            error: anonError ? anonError.message : null,
            data: anonData
        };

        // 3. Check for specific RLS symptoms
        if (serviceData && !anonData) {
            results.diagnosis = "Video exists but is NOT visible to anon/public. This is a Row Level Security (RLS) issue.";
        } else if (!serviceData) {
            results.diagnosis = "Video record does not exist in the database.";
        } else {
            results.diagnosis = "Video found and visible to public. Playback issue might be URL related or media codec related.";
        }

        // 4. Check Storage
        if (serviceData?.video_url) {
            results.video_url = serviceData.video_url;
            try {
                const headRes = await fetch(serviceData.video_url, { method: 'HEAD' });
                results.checks.video_url_connectivity = {
                    status: headRes.status,
                    ok: headRes.ok,
                    content_type: headRes.headers.get('content-type')
                };
            } catch (e: any) {
                results.checks.video_url_connectivity = {
                    error: e.message
                };
            }
        }

        return NextResponse.json(results);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
