/**
 * Utility functions for GoLive
 */

/**
 * Format a number into a human-readable view count
 * e.g. 1234 -> "1.2K", 1234567 -> "1.2M"
 */
export function formatViews(count: number | string): string {
    const num = typeof count === 'string' ? parseInt(count, 10) : count;
    if (isNaN(num)) return '0';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
}

/**
 * Format a date into a relative time string
 * e.g. "2 hours ago", "3 days ago"
 */
export function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
}

/**
 * Calculate deterministic algorithmic growth views for a video.
 * Uses the video ID as a seed to ensure consistent view counts per video.
 * Adds 100-300 views instantly, and grows organically over time simulating a live platform.
 */
export function calculateAlgorithmicViews(videoId: string, createdAtString?: string, actualViews: number | string = 0): number {
    const rawActual = typeof actualViews === 'string' ? parseInt(actualViews, 10) : actualViews;
    const actual = isNaN(rawActual) ? 0 : rawActual;

    if (!videoId) return actual;

    // Simple deterministic hash of the video ID string
    let hash = 0;
    for (let i = 0; i < videoId.length; i++) {
        hash = ((hash << 5) - hash) + videoId.charCodeAt(i);
        hash |= 0; // Convert to 32bit int
    }

    // Use hash to dictate base initial views (100 to 400)
    // Use Math.abs to avoid negative hash issues
    const baseViews = 100 + (Math.abs(hash) % 301);

    let timeBonus = 0;
    if (createdAtString) {
        const createdAt = new Date(createdAtString).getTime();
        const now = Date.now();
        const hoursAlive = Math.max(0, (now - createdAt) / (1000 * 60 * 60));

        // Add roughly 1-5 views per hour alive, again deterministic based on hash
        const decayFactor = 1 + (Math.abs(hash) % 5);
        timeBonus = Math.floor(hoursAlive * decayFactor);

        // Cap the time bonus so it doesn't grow infinitely large to unbelievable numbers
        timeBonus = Math.min(timeBonus, 5000);
    }

    return baseViews + timeBonus + actual;
}
