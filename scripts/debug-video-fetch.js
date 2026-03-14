const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://puhrqtwakabyvagnvcch.supabase.co';
const supabaseAnonKey = 'sb_publishable_gID2hTOmFG-UkyWLQdlBsQ_LiX9O1mK';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testVideoFetch() {
    const id = '18090125-a51d-4b9c-8b2f-cdf42f0f39f7';
    console.log(`Checking video: ${id}`);
    
    const { data, error } = await supabase
        .from('videos')
        .select('*, profiles(id, username, avatar_url)')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Fetch Error:', error.message, error.details, error.hint, error.code);
    } else {
        console.log('Video Found:', JSON.stringify(data, null, 2));
    }
}

testVideoFetch();
