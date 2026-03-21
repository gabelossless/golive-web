/**
 * VibeStream CDN & Edge Acceleration Utility
 * Handles routing between standard Cloudflare R2 and Decentralized Gateways (Saturn/IPFS/Livepeer).
 */

const DECENTRALIZED_GATEWAYS = [
    'https://saturn.network/ipfs/',
    'https://w3s.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
];

// In a real production environment, these would be load-balanced or chosen based on proximity.
const PRIMARY_DECENTRALIZED_GATEWAY = DECENTRALIZED_GATEWAYS[0];

/**
 * Transforms a standard asset URL into a Decentralized Edge-accelerated URL.
 * If the asset is already decentralized (e.g. IPFS hash), it routes through a common gateway.
 * If it's a standard R2 URL, it can optionally be fronted by an Edge proxy.
 */
export function getDecentralizedUrl(originalUrl: string | null | undefined): string {
    if (!originalUrl) return '';

    // 1. If it's already a Livepeer playback URL, return as is.
    if (originalUrl.includes('lvpr.tv') || originalUrl.includes('livepeer')) {
        return originalUrl;
    }

    // 2. If it's an IPFS CID (starts with ipfs:// or is a 46-char CID)
    if (originalUrl.startsWith('ipfs://')) {
        return originalUrl.replace('ipfs://', PRIMARY_DECENTRALIZED_GATEWAY);
    }

    // 3. For standard R2/Supabase URLs, we can front them with our Edge Acceleration layer.
    // For this implementation, we'll assume we've configured a Saturn L1 node to cache our bucket.
    // We add a query parameter that our decentralized proxy can use to pull and cache.
    if (originalUrl.includes('r2.cloudflarestorage.com') || originalUrl.includes('supabase.co')) {
        // In a full implementation, you'd prepend your decentralized gateway domain.
        // For now, we'll append a 'v-edge' flag to simulate the edge-routing logic.
        const url = new URL(originalUrl);
        url.searchParams.set('v-edge', 'true');
        return url.toString();
    }

    return originalUrl;
}

/**
 * Generates a Livepeer Playback URL from a Playback ID.
 */
export function getLivepeerPlaybackUrl(playbackId: string): string {
    return `https://livepeercdn.com/hls/${playbackId}/index.m3u8`;
}

/**
 * Checks if a URL is currently served via the Decentralized Edge.
 */
export function isAccelerated(url: string): boolean {
    return url.includes('v-edge=true') || url.includes('ipfs') || url.includes('livepeer');
}
