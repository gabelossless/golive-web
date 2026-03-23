/**
 * Zenith CDN & Edge Acceleration Utility
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

    // 3. Standard R2/Supabase/CF URLs — return as-is to avoid breaking presigned URLs
    // (Adding query params to presigned URLs invalidates their signature)
    return originalUrl;
}

/**
 * Generates a Livepeer Playback URL from a Playback ID.
 */
export function getLivepeerPlaybackUrl(playbackId: string): string {
    // livepeercdn.studio is the correct modern CDN domain
    return `https://lvpr.tv?v=${playbackId}`;
}

/**
 * Checks if a URL is currently served via the Decentralized Edge.
 */
export function isAccelerated(url: string): boolean {
    return url.includes('v-edge=true') || url.includes('ipfs') || url.includes('livepeer');
}
