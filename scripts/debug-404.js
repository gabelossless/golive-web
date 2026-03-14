const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://puhrqtwakabyvagnvcch.supabase.co';
const supabaseAnonKey = 'sb_publishable_gID2hTOmFG-UkyWLQdlBsQ_LiX9O1mK';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
    const id = '4f246497-3586-4f6e-99e7-430901390545';
    console.log(`Querying video ID: ${id}`);
    
    // Test simple look up
    const { data, error } = await supabase
        .from('videos')
        .select('*, profiles(id, username, avatar_url)')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Video data:', data);
    }

    // Check if video exists at all without join
    const { data: rawVideo, error: rawError } = await supabase
        .from('videos')
        .select('id, user_id')
        .eq('id', id);
        
    console.log('Raw video search result:', rawVideo, rawError);
}

testQuery();
