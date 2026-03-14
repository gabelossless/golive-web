// lib/vibe-rank.ts
import { Video } from '@/types';

export interface VibeRankScore {
    totalScore: number;
    qualityScore: number;
    velocityScore: number;
}

/**
 * Calculates the Vibe-Rank for a video.
 * Higher scores mean the video is more likely to be pushed to "Trending" or "For You".
 */
export function calculateVibeRank(video: any, hourlyGrowth: number = 0): VibeRankScore {
    // 1. Technical Quality Score (0.0 - 1.0)
    let qualityScore = 0.5; // Default middle ground

    if (video.width && video.height) {
        const area = video.width * video.height;
        if (area >= 3840 * 2160) qualityScore = 1.0; // 4K
        else if (area >= 1920 * 1080) qualityScore = 0.9; // 1080p
        else if (area >= 1280 * 720) qualityScore = 0.7; // 720p
        else qualityScore = 0.4; // SD
    }

    // 2. Velocity Score (0.0 - 1.0)
    // Formula: Recent growth vs age decay
    const ageInHours = (Date.now() - new Date(video.created_at).getTime()) / (1000 * 60 * 60);
    const decay = Math.pow(ageInHours + 2, 1.5);
    const velocityScore = Math.min(1.0, (hourlyGrowth * 10) / decay);

    // 3. Hype Boost (0.0 - 2.0)
    // Hypes are community-driven markers of extreme quality/virality.
    const hypeScore = Math.min(2.0, (video.hype_count || 0) * 0.2);

    // 4. Final Aggregated Score
    // We weigh velocity higher for discovery, but quality is the gatekeeper.
    // Hype score acts as a multiplier/additive surge.
    const totalScore = ((qualityScore * 0.4) + (velocityScore * 0.6)) + hypeScore;

    return {
        totalScore,
        qualityScore,
        velocityScore
    };
}

/**
 * Sorts an array of videos by their Vibe-Rank.
 */
export function rankVideos(videos: any[]): any[] {
    return [...videos].sort((a, b) => {
        const scoreA = calculateVibeRank(a).totalScore;
        const scoreB = calculateVibeRank(b).totalScore;
        return scoreB - scoreA;
    });
}
