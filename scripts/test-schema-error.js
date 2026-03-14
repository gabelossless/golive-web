const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://puhrqtwakabyvagnvcch.supabase.co';
const supabaseAdminKey = 'sb_publishable_gID2hTOmFG-UkyWLQdlBsQ_LiX9O1mK'; // Note: This is an anon key, but let's try to get more info.

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function checkSchema() {
    console.log('Checking videos table schema...');
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'videos' });
    if (error) {
        console.error('RPC failed, trying information_schema...');
        // Standard SQL query via a custom RPC if we had one, but we don't.
        // Let's try to just insert a test record and see where it fails.
        const testId = '00000000-0000-0000-0000-000000000000';
        const { error: insertErr } = await supabase.from('videos').insert({
            id: testId,
            user_id: 'd7bd695c-84b0-4492-ae51-56f3d62b5c0e',
            title: 'Schema Test',
            video_url: 'https://example.com/test.mp4',
            quality_score: 0.9,
            duration: 0.9
        });
        
        if (insertErr) {
            console.log('Caught expected error:', insertErr.message);
        } else {
            console.log('Insert succeeded! 0.9 is allowed.');
            await supabase.from('videos').delete().eq('id', testId);
        }
    } else {
        console.log('Schema Info:', JSON.stringify(data, null, 2));
    }
}

checkSchema();
