import { supabase } from './supabase';

/**
 * Phase 26: GoLive Natural Engagement System v2.0
 * 
 * Features:
 * - Logistic Growth Curves (Viral vs Normal)
 * - Timezone-aware Activity Peaks
 * - Personality-driven Bot Engagement
 * - Social Influence Cascades
 */

// Configuration
const GROWTH_WINDOW_HOURS = 168; // 1 Week search/discovery tail
const VIRAL_TIER_CHANCE = 0.05;

const ACTIVITY_CURVES: any = {
    weekday: { peak: [17, 22], mid: [12, 14], low: [0, 6] },
    weekend: { peak: [10, 22], low: [0, 6] }
};

const BOT_PERSONALITIES: any = {
    enthusiast: { likeProb: 0.8, commentProb: 0.4, shareProb: 0.2 },
    analytical: { likeProb: 0.5, commentProb: 0.7, shareProb: 0.1 },
    casual: { likeProb: 0.4, commentProb: 0.1, shareProb: 0.05 },
    troll: { likeProb: 0.1, commentProb: 0.6, shareProb: 0.3 }
};

const CONTEXTUAL_COMMENTS: any = {
    gaming: [
        "The gameplay at 2:30 was nuts!", 
        "Frame perfect execution", 
        "What's the setup?", 
        "Underrated run",
        "W gaming content",
        "How did you do that jump?"
    ],
    tech: [
        "Clean review", 
        "Specs?", 
        "This helps a lot", 
        "Should I upgrade?",
        "High quality production",
        "Finally a real review"
    ],
    vibe: [
        "This is a vibe", 
        "Clean edits", 
        "Keep it up", 
        "Subscribed",
        "Algorithm brought me here!",
        "Valid content"
    ]
};

/**
 * Realistic Growth Pattern (Logistic Model)
 * Simulates: Initial Spike -> Peak -> Exponential Decay -> Long Tail
 */
function getRealisticEngagementPattern(hoursSinceUpload: number): number {
    if (hoursSinceUpload <= 0.5) {
        // Immediate rise
        return Math.min(1, Math.pow(hoursSinceUpload * 4, 1.5));
    } else if (hoursSinceUpload <= 6) {
        // Peak discovery period
        return Math.max(0.4, 1 - Math.pow((hoursSinceUpload - 3) / 8, 2));
    } else if (hoursSinceUpload <= 24) {
        // Post-peak decline
        return Math.max(0.15, 0.4 * Math.exp(-(hoursSinceUpload - 6) / 10));
    } else {
        // Long tail weekly decay
        return 0.1 * Math.exp(-hoursSinceUpload / 100); 
    }
}

/**
 * Time-of-day Multiplier
 * Adjusts engagement rates based on user timezone peaks (Evening/Weekend)
 */
function getTemporalMultiplier(): number {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const curve = isWeekend ? ACTIVITY_CURVES.weekend : ACTIVITY_CURVES.weekday;

    if (hour >= curve.peak[0] && hour <= curve.peak[1]) return 1.5;
    if (curve.mid && hour >= curve.mid[0] && hour <= curve.mid[1]) return 1.2;
    if (hour >= curve.low[0] && hour <= curve.low[1]) return 0.2; // Dead hours
    return 1.0;
}

/**
 * Fetch Top Influencer IDs for social proof check
 */
async function getInfluencerIds(): Promise<string[]> {
    const { data } = await supabase
        .from('user_profiles')
        .select('user_id')
        .order('credibility_score', { ascending: false })
        .limit(5);
    return data?.map(d => d.user_id) || [];
}

/**
 * Core Engagement Logic: Smart Bot Actions
 * Factors in bot personality, interests, and random noise.
 */
async function triggerSmartBotActions(videoId: string, category: string) {
    // 1. Pick a random Bot profile with behavior data
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*, profiles(username)')
        .limit(10) // fetch a pool
        .then(res => ({ data: res.data ? res.data[Math.floor(Math.random() * res.data.length)] : null }));
    
    if (!profile) return;

    const personality = BOT_PERSONALITIES[profile.engagement_style] || BOT_PERSONALITIES.casual;
    
    // 2. Decide on Like
    if (Math.random() < personality.likeProb) {
        await supabase.from('likes').insert({
            video_id: videoId,
            user_id: profile.user_id
        }).maybeSingle();
    }

    // 3. Decide on Comment
    if (Math.random() < personality.commentProb) {
        // Interest match boost: 2x probability if bot likes this category
        const interests = profile.interests || { primary: [] };
        const hasInterest = (interests.primary || []).includes(category) || 
                            (interests.secondary || []).includes(category);
        
        if (hasInterest || Math.random() < 0.15) {
            const catKey = category.toLowerCase();
            const library = CONTEXTUAL_COMMENTS[catKey] || CONTEXTUAL_COMMENTS.vibe;
            const text = library[Math.floor(Math.random() * library.length)];

            // Prevent double comments
            const { count } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('video_id', videoId)
                .eq('user_id', profile.user_id);

            if (!count || count === 0) {
                await supabase.from('comments').insert({
                    video_id: videoId,
                    user_id: profile.user_id,
                    content: text
                });
            }
        }
    }
}

/**
 * Main Growth Entry Point
 * Called when a user watches a video to seed organic growth.
 */
export async function applyGrowthBoost(videoId: string) {
    if (process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_SEEDING !== 'true') return;

    try {
        const { data: video, error } = await supabase
            .from('videos')
            .select(`
                id,
                created_at, 
                view_count, 
                boosted, 
                target_views, 
                target_likes,
                category
            `)
            .eq('id', videoId)
            .single();

        if (error || !video) return;

        const now = new Date();
        const uploadedAt = new Date(video.created_at);
        const hoursSinceUpload = (now.getTime() - uploadedAt.getTime()) / (1000 * 60 * 60);

        // Cap simulation window
        if (hoursSinceUpload > GROWTH_WINDOW_HOURS) return;

        // 1. Initialize Performance Tier if new
        if (!video.boosted) {
            const isViral = Math.random() < VIRAL_TIER_CHANCE;
            const targetViews = isViral 
                ? Math.floor(Math.random() * 20000) + 10000 
                : Math.floor(Math.random() * 800) + 150;
            const targetLikes = Math.floor(targetViews * (0.04 + Math.random() * 0.08));

            await supabase.from('videos').update({
                boosted: true,
                target_views: targetViews,
                target_likes: targetLikes
            }).eq('id', videoId);

            video.target_views = targetViews;
        }

        // 2. Calculate Influence and Multipliers
        const influencerIds = await getInfluencerIds();
        const { count: influencerLikes } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', videoId)
            .in('user_id', influencerIds);
        
        // Social Proof: Influencer likes give a massive boost to expected reach
        const socialMultiplier = 1 + (influencerLikes || 0) * 0.75;
        const patternFactor = getRealisticEngagementPattern(hoursSinceUpload);
        const temporalMultiplier = getTemporalMultiplier();
        
        // 3. Momentum Engine: Target Views Progress
        // Logistic-inspired progress function: 1 - e^(-kt)
        const progress = 1 - Math.exp(-hoursSinceUpload / 18);
        const expectedViews = Math.floor(video.target_views * progress * patternFactor * socialMultiplier);

        // 4. Update Views if falling behind (Catch-up mechanism)
        if (video.view_count < expectedViews) {
            const baseChunk = (video.target_views / 48) * patternFactor * temporalMultiplier * socialMultiplier;
            const jitter = 0.8 + (Math.random() * 0.6); 
            const catchUpAmount = Math.ceil(baseChunk * jitter);

            if (catchUpAmount > 0) {
                await supabase.rpc('increment_view_count', { 
                    video_id: videoId, 
                    amount: Math.min(catchUpAmount, 200) // safety cap per call
                });
            }
        }

        // 5. Trigger Individual Smart Actions
        const actionProb = 0.15 * patternFactor * temporalMultiplier;
        if (Math.random() < actionProb) {
            await triggerSmartBotActions(videoId, video.category || 'Vibe');
        }

    } catch (err) {
        console.error('Growth algorithm error:', err);
    }
}
