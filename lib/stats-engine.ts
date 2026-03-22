/**
 * lib/stats-engine.ts
 * Agent 2: Analytics Engine
 * 
 * Pure computation functions for platform statistics.
 * All functions take raw data arrays and return computed metrics.
 * No database calls — those live in the API routes.
 */

export interface DailyViewPoint {
    date: string;
    views: number;
}

export interface DeviceDistribution {
    device_type: string | null;
    count: number;
}

export interface CountryViews {
    country_code: string;
    views: number;
}

export interface PlatformStats {
    total_users: number;
    total_videos: number;
    total_views: number;
    total_likes: number;
    total_comments: number;
    new_users_today: number;
    new_videos_today: number;
    dau: number;
    views_today: number;
    likes_today: number;
    avg_watch_seconds: number;
    top_video: { id: string; title: string; view_count: number } | null;
    top_countries: CountryViews[];
    device_distribution: DeviceDistribution[];
    views_last_30_days: DailyViewPoint[];
}

/**
 * Computes percentage change between two values.
 * Returns a formatted string like "+12.4%" or "-3.1%"
 */
export function computeGrowthLabel(current: number, previous: number): { label: string; up: boolean } {
    if (previous === 0) return { label: current > 0 ? '+∞' : '0%', up: current > 0 };
    const pct = ((current - previous) / previous) * 100;
    const up = pct >= 0;
    return { label: `${up ? '+' : ''}${pct.toFixed(1)}%`, up };
}

/**
 * Converts raw views_last_30_days into a filled 30-day array.
 * Fills missing days with 0 so charts render continuous lines.
 */
export function fillDailyViews(raw: DailyViewPoint[]): DailyViewPoint[] {
    const filled: DailyViewPoint[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const found = raw.find(r => r.date === dateStr);
        filled.push({ date: dateStr, views: found?.views ?? 0 });
    }
    return filled;
}

/**
 * Computes device percentages from device distribution data.
 */
export function computeDevicePercentages(dist: DeviceDistribution[]): { label: string; percentage: number }[] {
    const total = dist.reduce((sum, d) => sum + Number(d.count), 0);
    if (total === 0) return [];

    return dist.map(d => ({
        label: d.device_type === 'mobile' ? 'Mobile' : d.device_type === 'desktop' ? 'Desktop' : 'Other',
        percentage: Math.round((Number(d.count) / total) * 100),
    })).sort((a, b) => b.percentage - a.percentage);
}

/**
 * Computes avg watch time display string (e.g. "4m 32s")
 */
export function formatWatchTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

/**
 * Formats raw numbers into display strings (e.g. 12300 -> "12.3k")
 */
export function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toString();
}

/**
 * Computes the "like-to-view" ratio as a percentage.
 */
export function computeEngagementRate(likes: number, views: number): string {
    if (views === 0) return '0%';
    return `${((likes / views) * 100).toFixed(1)}%`;
}
