// lib/personalization.ts
import { supabase } from './supabase';

export interface InterestMap {
    [category: string]: number;
}

/**
 * Updates the user's interest profile based on watch time or engagement.
 */
export async function trackUserInterest(userId: string, category: string, weight: number = 1) {
    // In a real production system, this would be a complex backend service.
    // Here, we'll use a local storage cache combined with a small Supabase table 
    // to build a real-time interest vector.

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('social_links') // We'll hijack social_links temporarily or add a dedicated interests column in the future
            .eq('id', userId)
            .single();

        const currentInterests = (profile?.social_links as any)?.interests || {};
        currentInterests[category] = (currentInterests[category] || 0) + weight;

        await supabase
            .from('profiles')
            .update({
                social_links: {
                    ...(profile?.social_links as any || {}),
                    interests: currentInterests
                }
            })
            .eq('id', userId);
    } catch (err) {
        console.error('Error tracking user interest:', err);
    }
}

/**
 * Returns a list of videos re-ranked for a specific user based on their interest profile.
 * Integrates Vibe-Rank for technical quality assurance.
 */
export function personalizeFeed(videos: any[], userInterests: InterestMap): any[] {
    const { calculateVibeRank } = require('./vibe-rank');

    return [...videos].sort((a, b) => {
        // 1. Quality & Velocity Score
        const rankA = calculateVibeRank(a).totalScore;
        const rankB = calculateVibeRank(b).totalScore;

        // 2. Personal Interest Score
        const interestA = userInterests[a.category] || 0;
        const interestB = userInterests[b.category] || 0;

        // Final Score: 50% Interest, 50% Vibe-Rank
        const finalA = (interestA * 0.5) + (rankA * 0.5);
        const finalB = (interestB * 0.5) + (rankB * 0.5);

        return finalB - finalA;
    });
}
