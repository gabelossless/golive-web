import { supabase } from './supabase';

// Configuration
const GROWTH_WINDOW_HOURS = 12;
const MIN_VIEWS = 200;
const MAX_VIEWS = 1200;
const MIN_LIKES = 25;
const MAX_LIKES = 100;
const MAX_COMMENTS = 6;

const BOT_COMMENTS = [
    "This is actually insane! 🔥",
    "First! 🥇",
    "Underrated content honestly.",
    "The editing on this is clean.",
    "What software do you use?",
    "Keep grinding! 🚀",
    "Subbed! Can you check my channel?",
    "That last part was crazy.",
    "Needs more views.",
    "Legendary.",
    "W video",
    "Sheesh 🥶",
    "Valid.",
    "Waiting for the next one!",
    "This deserves way more likes.",
    "Algorithm brought me here and I'm not mad.",
    "High quality stuff!"
];

// Bell Curve helper to simulate "Peak Discovery" at hour 3-9
function getBellCurveFactor(hoursSinceUpload: number): number {
    const totalDuration = GROWTH_WINDOW_HOURS;
    // Peak at 50% of window (6 hours)
    const peak = totalDuration / 2;
    // Standard deviation/width
    const stdDev = totalDuration / 4;

    // Gaussian function
    const exponent = -Math.pow(hoursSinceUpload - peak, 2) / (2 * Math.pow(stdDev, 2));
    return Math.exp(exponent);
}

export async function applyGrowthBoost(videoId: string) {
    // Kill Switch
    if (process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_SEEDING !== 'true') return;

    try {
        // 1. Fetch Video Data
        const { data: video, error } = await supabase
            .from('videos')
            .select('created_at, view_count, boosted, target_views, target_likes')
            .eq('id', videoId)
            .single();

        if (error || !video) return;

        // 2. Check time window
        const now = new Date();
        const uploadedAt = new Date(video.created_at);
        const hoursSinceUpload = (now.getTime() - uploadedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpload > GROWTH_WINDOW_HOURS) return;

        // 3. Initialize Targets if not set
        if (!video.boosted) {
            const targetViews = Math.floor(Math.random() * (MAX_VIEWS - MIN_VIEWS + 1)) + MIN_VIEWS;
            const targetLikes = Math.floor(Math.random() * (MAX_LIKES - MIN_LIKES + 1)) + MIN_LIKES;

            await supabase.from('videos').update({
                boosted: true,
                target_views: targetViews,
                target_likes: targetLikes
            }).eq('id', videoId);

            video.target_views = targetViews;
            video.target_likes = targetLikes;
        }

        // 4. Calculate Expected Engagement (Momentum Engine)
        // Simple linear progress for now, but modulated by the curve for *rate*
        const progress = Math.min(hoursSinceUpload / GROWTH_WINDOW_HOURS, 1);

        // Target Views Calculation
        const expectedViews = Math.floor(video.target_views * progress);

        // 5. Update Views if behind
        if (video.view_count < expectedViews) {
            // Add a chunk based on the "Bell Curve Intensity" of the current hour
            const curveFactor = getBellCurveFactor(hoursSinceUpload);
            // Higher intensity = larger chunks
            const baseChunk = (video.target_views / GROWTH_WINDOW_HOURS) * curveFactor;
            const jitter = Math.random() * 5; // Organic random noise

            const catchUpAmount = Math.ceil(baseChunk + jitter);

            await supabase.rpc('increment_view_count', { video_id: videoId, amount: catchUpAmount });
        }

        // 6. Drip Feed Likes (Proportional to views)
        const currentLikeRatio = Math.floor(video.target_likes * progress);

        // We need to check actual likes count, but that's expensive. 
        // Instead, we just randomly add a like if we are in a "hot" period of the curve
        // Probability increases if we are near peak
        if (Math.random() < 0.3 * getBellCurveFactor(hoursSinceUpload)) {
            await triggerBotLike(videoId);
        }

        // 7. Drip Feed Comments (Rare event)
        if (Math.random() < 0.05 * getBellCurveFactor(hoursSinceUpload)) {
            await triggerBotComment(videoId);
        }

    } catch (err) {
        console.error('Growth algorithm error:', err);
    }
}

async function triggerBotLike(videoId: string) {
    // 1. Get a random Bot
    const { data: bots } = await supabase.from('bots').select('id');
    if (!bots || bots.length === 0) return;

    const randomBot = bots[Math.floor(Math.random() * bots.length)];

    // 2. Try to insert Like (ignore if already liked due to constraint)
    await supabase.from('likes').insert({
        video_id: videoId,
        user_id: randomBot.id
    }).select().maybeSingle(); // maybeSingle blocks error throwing on conflict
}

async function triggerBotComment(videoId: string) {
    // 1. Get a random Bot
    const { data: bots } = await supabase.from('bots').select('id');
    if (!bots || bots.length === 0) return;
    const randomBot = bots[Math.floor(Math.random() * bots.length)];

    // 2. Check if this specific bot commented already to prevent spam
    const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId)
        .eq('user_id', randomBot.id);

    if (count && count > 0) return;

    // 3. Check global comment max
    const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);

    if (totalComments && totalComments >= MAX_COMMENTS) return;

    // 4. Pick a comment
    const text = BOT_COMMENTS[Math.floor(Math.random() * BOT_COMMENTS.length)];

    // 5. Insert Comment
    await supabase.from('comments').insert({
        video_id: videoId,
        user_id: randomBot.id,
        content: text
    });
}
