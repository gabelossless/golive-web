import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  const videoId = '18090125-a51d-4b9c-8b2f-cdf42f0f39f7';
  
  console.log(`Checking video: ${videoId}`);
  
  // 1. Check with service role (should always work if record exists)
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('videos')
    .select('id, title, video_url')
    .eq('id', videoId)
    .maybeSingle();
    
  if (serviceError) {
    console.error('Service Role Fetch Error:', serviceError);
  } else if (!serviceData) {
    console.log('Video NOT FOUND even with Service Role. The record does not exist in the database.');
  } else {
    console.log('Video FOUND with Service Role:', serviceData.title);
  }
  
  // 2. Check with anon key (simulating public user)
  const { data: anonData, error: anonError } = await anonClient
    .from('videos')
    .select('id, title, video_url')
    .eq('id', videoId)
    .maybeSingle();
    
  if (anonError) {
    console.error('Anon Fetch Error:', anonError);
  } else if (!anonData) {
    if (serviceData) {
      console.log('Video FOUND with Service Role but NOT with Anon. This is likely an RLS Policy issue.');
    } else {
      console.log('Video not found with anon key either.');
    }
  } else {
    console.log('Video FOUND with Anon Key. Public access is working.');
  }

  // 3. Check bucket access
  console.log('Checking bucket: videos');
  const { data: buckets, error: bucketError } = await serviceClient.storage.listBuckets();
  if (bucketError) {
    console.error('Bucket List Error:', bucketError);
  } else {
    console.log('Available buckets:', buckets.map(b => b.name));
  }
}

diagnose();
