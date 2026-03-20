// /tmp/test-engagement.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runTest() {
    console.log('--- Vibe Guard & Engagement Audit ---');

    // 1. Get a test video
    const { data: video, error: vError } = await supabase
        .from('videos')
        .select('id, title, view_count, hype_count, likes_count')
        .limit(1)
        .single();

    if (vError) {
        console.error('Failed to fetch video:', vError);
        return;
    }

    console.log(`Testing Video: [${video.id}] ${video.title}`);
    console.log(`Initial Stats: Views: ${video.view_count}, Hypes: ${video.hype_count}, Likes: ${video.likes_count}`);

    // 2. Simulate a View (should go through Vibe Guard)
    console.log('\nTriggering a Verified View...');
    const { data: viewResult, error: viewError } = await supabase.rpc('process_vibe_event', {
        p_video_id: video.id,
        p_event_type: 'view',
        p_session_id: 'test-session-' + Date.now()
    });

    if (viewError) console.error('View Error:', viewError);
    else console.log('View Result:', viewResult);

    // 3. Simulate a Like
    console.log('\nTriggering a Like...');
    const { data: likeResult, error: likeError } = await supabase.rpc('toggle_like', {
        target_video_id: video.id
    });

    if (likeError) console.error('Like Error:', likeError);
    else console.log('Like Result:', likeResult);

    // 4. Check Updated Stats
    const { data: updatedVideo } = await supabase
        .from('videos')
        .select('view_count, hype_count, likes_count')
        .eq('id', video.id)
        .single();

    console.log('\nUpdated Stats:');
    console.log(`Views: ${updatedVideo.view_count} (Delta: ${updatedVideo.view_count - video.view_count})`);
    console.log(`Likes: ${updatedVideo.likes_count} (Delta: ${updatedVideo.likes_count - video.likes_count})`);

    // 5. Check Vibe Points
    const { data: points } = await supabase
        .from('vibe_points_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (points && points.length > 0) {
        console.log(`\nVibe Points Awarded: ${points[0].points} for [${points[0].reason}]`);
    } else {
        console.log('\nNo Vibe Points detected.');
    }
}

runTest();
