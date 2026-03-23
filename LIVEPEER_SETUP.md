# Livepeer Studio Setup Guide for Zenith

Zenith uses Livepeer Studio for decentralized video transcoding and ultra-low latency livestreaming (Phase 47). Follow this guide to set up your infrastructure.

---

## 1. Create a Livepeer Studio Account
1. Go to [Livepeer Studio](https://livepeer.studio/register) and create a free account.
2. Log in to your dashboard.

## 2. Generate an API Key
1. In the sidebar, click on **Developers** or **API Keys**.
2. Click **Create API Key**.
3. Copy the key immediately (you won't be able to see it again).

## 3. Configure Environment Variables
Add the following to your `.env.local` file:

```env
# Livepeer Studio API Key (Required for Transcoding & Streams)
LIVEPEER_API_KEY=your_api_key_here

# Optional: Enable Professional Transcoding
NEXT_PUBLIC_ENABLE_LIVEPEER=true
```

## 4. How Zenith Uses Livepeer

### A. VOD Transcoding (Video on Demand)
When a user uploads a video to Zenith:
1. The raw file is stored in **Cloudflare R2**.
2. Zenith calls the Livepeer `vod/upload` API to "pull" the file from R2.
3. Livepeer transcodes it into an **HLS (HTTP Live Streaming)** playlist.
4. Zenith stores the `playbackId`. When a user watches, we play `https://livepeer.studio/hls/{playbackId}/index.m3u8`.

### B. Livestreaming (Phase 47)
For live broadcasts:
1. Zenith calls `/api/live/create` to generate a **Stream Key**.
2. The Creator uses their browser (WebRTC) to send video to Livepeer.
3. Viewers watch the transcoded HLS stream in real-time.

## 5. Troubleshooting
- **CORS Errors**: If the player doesn't load, ensure the Livepeer `playbackId` is correct in your `videos` table.
- **Quota Reached**: Free accounts have limited transcoding minutes. Check the "Usage" tab in your Studio dashboard.

---
*Zenith Engineering Team — Phase 46/47*
