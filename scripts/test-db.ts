import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking videos table...');
    const { data: videoData, error: videoError } = await supabase.from('videos').select('*').limit(1);
    if (videoError) {
        console.error('Videos Error:', videoError.message);
    } else {
        console.log('Videos Columns:', Object.keys(videoData[0] || {}));
    }

    console.log('\nChecking profiles table...');
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').limit(1);
    if (profileError) {
        console.error('Profiles Error:', profileError.message);
    } else {
        console.log('Profiles Columns:', Object.keys(profileData[0] || {}));
    }
}

checkColumns();
