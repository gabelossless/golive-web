const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://puhrqtwakabyvagnvcch.supabase.co";
const supabaseAnonKey = "sb_publishable_gID2hTOmFG-UkyWLQdlBsQ_LiX9O1mK";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const id = '18090125-a51d-4b9c-8b2f-cdf42f0f39f7';
  console.log(`Checking video ${id} with anon key...`);
  
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, video_url')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
  } else if (!data) {
    console.log('Video NOT FOUND with anon key. (Could be RLS or it really does not exist)');
  } else {
    console.log('Video FOUND:', data.title);
    console.log('URL:', data.video_url);
  }
}

check();
