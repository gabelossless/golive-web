import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check columns
    const { data: colData, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'videos' });
    
    // 2. Try to tag one video as short for testing
    const { data: videos } = await supabase.from('videos').select('id, title').limit(1);
    let tagResult = null;
    if (videos && videos.length > 0) {
        tagResult = await supabase.from('videos').update({ is_short: true }).eq('id', videos[0].id);
    }

    return new Response(JSON.stringify({
        columns: colData || 'Try standard query if RPC fails',
        tagResult,
        error: colError
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
