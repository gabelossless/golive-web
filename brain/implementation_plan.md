# Implementation Plan: Global Decentralized Infrastructure (CDN Integration)

This phase integrates "Global Edge Acceleration" for VibeStream by leveraging decentralized delivery networks (Livepeer and Saturn). This ensures high-performance video delivery that is censorship-resistant and globally distributed via Web3 infrastructure.

## User Review Required

> [!IMPORTANT]
> This integration assumes the availability of a Livepeer API key for premium transcoding and decentralized playback. If not provided, the platform will fall back to a public decentralized gateway (Saturn L1) for standard R2 assets.

## Proposed Changes

### Media & CDN Utilities
#### [NEW] [cdn.ts](file:///C:/GOLive/lib/cdn.ts)
- Implement `getDecentralizedUrl(originalUrl: string)` helper.
- Integrate **Saturn Network** L1 node routing as a cache layer for R2 assets.
- Add support for **Livepeer** playback gateways (`lvpr.tv`).

### Video Playback Components
#### [MODIFY] [VideoPlayer.tsx](file:///C:/GOLive/components/VideoPlayer.tsx)
- Add `playback_id` as an optional prop for decentralized native playback.
- Implement a "Decentralized Acceleration" status badge in the player settings.
- Automatically route `.m3u8` requests through the decentralized CDN utility.

#### [MODIFY] [VideoCard.tsx](file:///C:/GOLive/components/VideoCard.tsx)
- Apply the `getDecentralizedUrl` utility to thumbnails to accelerate feed loading via the decentralized edge.

### Integration Layer
#### [MODIFY] [types/database.ts](file:///C:/GOLive/types/database.ts)
- Add `playback_id` and `is_decentralized` fields to the `Video` type for tracking decentralized storage state.

## Verification Plan

### Automated Tests
- Create a test script `scripts/test-cdn-routing.ts` to verify that R2 URLs are correctly mapped to decentralized gateway patterns.
- Run `npm run build` to ensure no regressions in playback logic.

### Manual Verification
- Verify video playback on the Watch page using a mocked Livepeer playback ID.
- Inspect network requests to confirm that media assets are being served via decentralized gateways (e.g., `saturn.network`).
