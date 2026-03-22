// @ts-nocheck
import { Livepeer } from "livepeer";

if (!process.env.LIVEPEER_API_KEY) {
    console.warn("WARNING: LIVEPEER_API_KEY is not defined in environment variables.");
}

export const livepeerId = new Livepeer({
    apiKey: process.env.LIVEPEER_API_KEY || "",
});

/**
 * Requests Livepeer to import and transcode a video from a public URL (e.g., R2).
 * @param url The public URL of the raw video file.
 * @param name The display name for the asset.
 * @returns The created asset object containing the playbackId.
 */
export async function requestLivepeerTranscode(url: string, name: string) {
    try {
        console.log(`[Livepeer] Requesting transcode for: ${name} (${url})`);
        
        const result = await livepeerId.asset.create({
            name,
            url,
            playbackPolicy: {
                type: "public" as any,
            },
        });

        if (!result.asset) {
            throw new Error("Livepeer failed to create asset");
        }

        console.log(`[Livepeer] Asset created successfully. ID: ${result.asset.id}, PlaybackID: ${result.asset.playbackId}`);
        
        return {
            id: result.asset.id,
            playbackId: result.asset.playbackId,
            status: result.asset.status,
        };
    } catch (error) {
        console.error("[Livepeer] Error creating asset:", error);
        throw error;
    }
}

/**
 * Checks the status of a Livepeer asset.
 * @param assetId The ID of the asset to check.
 */
export async function getLivepeerAssetStatus(assetId: string) {
    try {
        const result = await livepeerId.asset.get(assetId);
        return result.asset?.status;
    } catch (error) {
        console.error("[Livepeer] Error fetching asset status:", error);
        throw error;
    }
}

/**
 * Retrieves the total view count and metrics for a specific playback ID via Livepeer Studio API.
 * Uses the canonical viewer engagement endpoint.
 * @param playbackId The playback ID of the stream or asset.
 */
export async function getLivepeerViews(playbackId: string) {
    if (!process.env.LIVEPEER_API_KEY) return null;
    
    try {
        const response = await fetch(`https://livepeer.studio/api/data/views/query/total/${playbackId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            next: { revalidate: 300 } // Refresh every 5 minutes as per docs
        });

        if (!response.ok) throw new Error(`Livepeer views fetch failed: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[Livepeer] Error fetching views:", error);
        return null;
    }
}

/**
 * Retrieves detailed creator engagement metrics for an asset ID.
 * Intended for advanced platform analytics.
 * @param assetId The internal Livepeer asset ID.
 */
export async function getLivepeerCreatorMetrics(assetId: string) {
    if (!process.env.LIVEPEER_API_KEY) return null;
    
    try {
        const to = Date.now();
        const from = to - (30 * 24 * 60 * 60 * 1000); // T-30 days
        
        const url = new URL('https://livepeer.studio/api/data/views/query/creator');
        url.searchParams.append('from', from.toString());
        url.searchParams.append('to', to.toString());
        url.searchParams.append('timeStep', 'day');
        url.searchParams.append('assetId', assetId);
        url.searchParams.append('breakdownBy[]', 'browser');

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`Livepeer metrics fetch failed: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("[Livepeer] Error fetching creator metrics:", error);
        return null;
    }
}
