# Zenith — Developer Documentation

Technical deep-dive into the platform's core systems. Read alongside [`devguide.md`](./devguide.md) for critical platform rules.

---

## 1. Video Upload Pipeline

### Quick Upload (`/api/upload`)
Used for small assets like profile pictures and thumbnails.

```
Client → POST /api/upload {filename, contentType, folder}
       ← {url: presignedUrl, path: "folder/timestamp_filename"}
Client → PUT presignedUrl (binary file)
DB     ← profiles.avatar_url = NEXT_PUBLIC_R2_PUBLIC_URL/path
```

### Multipart Upload (`/api/upload/multipart`) — Videos
Used for all video files. Authenticates via Supabase JWT.

```
Client → POST /api/upload/multipart {action:"create", filename, contentType, fileSize, folder}
       ← {uploadId, key, endpoints: [{url, partNumber}...]}

Client → PUT endpoints[n].url (5MB binary chunk) × N parts in parallel
       → {ETag} from response headers

Client → POST /api/upload/multipart {action:"complete", uploadId, key, parts: [{PartNumber, ETag}...]}
       ← {path}

Client → INSERT videos (title, description, video_url, ...) INTO supabase
```

**Security**: Folder namespace validation ensures users can only write to paths containing their own `user.id`.

**Size limit**: 10 GB (2000 × 5MB parts). Larger files return HTTP 413.

---

## 2. Analytics & Stats Pipeline (Phase 46)

### Event Tracking
The client logs events to `/api/analytics/event` POST endpoint on:
- Video view start (+ watch duration on pause/close)
- Like, share, comment actions

Events are inserted into the `video_events` table with session ID, device type, and optional country code.

```typescript
fetch('/api/analytics/event', {
  method: 'POST',
  body: JSON.stringify({
    video_id: 'uuid',
    event_type: 'view',      // 'view' | 'like' | 'share' | 'comment' | 'complete' | 'skip'
    session_id: getAnalyticsSessionId(),
    watch_seconds: 45,
    device_type: 'mobile',
  })
});
```

### Stats API
`GET /api/admin/stats` (admin-only) calls the `get_platform_stats()` Supabase RPC which aggregates:
- Total users, videos, views, likes, comments
- New users/videos today
- DAU (daily active users from video_events)
- 30-day views by date (for the analytics chart)
- Device distribution
- Top countries by views
- Top video

On each call, results are saved to `platform_reports` (one row per day, upsert).

### Stats Engine (`lib/stats-engine.ts`)
Pure helper functions — no DB calls:

| Function | Purpose |
|----------|---------|
| `fillDailyViews(raw)` | Fills missing days with 0 for continuous charts |
| `computeDevicePercentages(dist)` | Converts raw counts to % breakdown |
| `computeEngagementRate(likes, views)` | Returns "4.2%" string |
| `formatWatchTime(seconds)` | Returns "4m 32s" string |
| `formatCount(n)` | Returns "12.3k", "1.4M" etc. |
| `computeGrowthLabel(current, prev)` | Returns {label: "+12.1%", up: true} |

---

## 3. Settings System (Phase 46)

### Profile Settings (`profile_settings` table)

| Column | Type | Default |
|--------|------|---------|
| `notify_new_subscriber` | boolean | true |
| `notify_new_comment` | boolean | true |
| `notify_new_tip` | boolean | true |
| `notify_trending` | boolean | false |
| `notify_weekly_digest` | boolean | true |
| `profile_public` | boolean | true |
| `show_wallet_address` | boolean | false |
| `allow_search_indexing` | boolean | true |
| `show_watch_history` | boolean | true |

Settings are saved via the `upsert_profile_settings(p_user_id, ...)` Supabase RPC (handles INSERT/UPDATE in one call).

### Avatar Upload Flow
```
User clicks Camera icon → hidden <input type="file"> fires
compressImage(file) → Blob (HEIC auto-converted, compressed to ≤2MB)
POST /api/upload {folder: "avatars"} → {url, path}
PUT presignedUrl (binary) 
UPDATE profiles SET avatar_url = R2_PUBLIC_URL/path WHERE id = user.id
router.refresh()
```

---

## 4. Vibe-Rank Algorithm (`lib/vibe-rank.ts`)

Each video is scored on three dimensions:

```
qualityScore (0.0–1.0)   = resolution tier (4K=1.0, 1080p=0.9, 720p=0.7, SD=0.4)
velocityScore (0.0–1.0)  = hourlyGrowth / age_decay
hypeScore (0.0–2.0)      = hype_count × 0.2 (community viral marker)

totalScore = (quality × 0.4) + (velocity × 0.6) + hypeScore
```

Used by the home feed and trending queries to sort videos.

---

## 5. Natural Engagement System (`lib/growth.ts`)

Simulates realistic video growth to hydrate the platform for new creators.

**Lifecycle**: `applyGrowthBoost(videoId)` is called each time a video is watched.

```
1. Initialize Performance Tier (viral 5% chance: 10k-30k views target; normal: 150-950)
2. Social Proof multiplier = 1 + (influencer_likes × 0.75)
3. Engagement pattern = logistic curve based on hours since upload
4. Temporal multiplier = 1.5 (prime-time), 1.0 (normal), 0.2 (dead hours)
5. Expected views = target × progress × pattern × social
6. If actual views < expected: apply catch-up increment (max 200/call)
7. Trigger bot comment/like (15% × pattern × temporal probability)
```

**Guard**: Only runs if `NEXT_PUBLIC_ENABLE_COMMUNITY_SEEDING=true`.

---

## 6. Multi-Chain Payments (`components/TipButton.tsx`)

**Base (EVM)**: Uses `ZenithSplitter.sol` — atomically splits ETH and USDC.
- ABI call: `split(creatorAddress, platformAddress)` with `{value: tipAmount}`
- USDC: ERC-20 → approve → split

**Solana**: Client-side atomic transaction with multiple `SystemProgram.transfer` instructions for SOL.
SPL Token splits use `createTransferInstruction`.

**Revenue split**: 75% to creator, 25% to platform wallet (`NEXT_PUBLIC_PLATFORM_WALLET_*`).

---

## 7. CDN Routing (`lib/cdn.ts`)

```
R2 URL detected? → Prefix with Saturn node URL for edge acceleration
ipfs:// URL?     → Resolve to public.gateway.pinata.cloud
Livepeer playbackId? → https://livepeer.com/hls/{id}/index.m3u8
```

---

## 8. SEO Architecture

Every dynamic page uses `generateMetadata()` (Server Component) for SSR OpenGraph tags:
- Video pages: title, description, thumbnail, creator
- Profile pages: username, bio, avatar

Client components (`*Client.tsx`) handle state and interactivity while the server `page.tsx` handles metadata.

---

## 9. Deployment & Build Rules

| Rule | Detail |
|------|--------|
| `viem` version | **Must be pinned to `2.47.4`** — newer breaks Privy |
| `normalizeUrl()` | All media URLs must pass through before use in `<img>` |
| SSR safety | No browser APIs at module level — use `typeof window !== 'undefined'` or dynamic imports |
| Admin auth | Every admin API route must check `profile.role === 'admin'` |
| Hardcoded data | **Prohibited** in admin panels — all stats from Supabase |
| `.vercelignore` | Excludes `brain/` directory to keep payload under 100MB |

---

## 10. Branching & Contributing

```bash
git checkout -b feature/your-feature
# — make changes —
git add -A
git commit -m "feat: Description"
git push origin feature/your-feature
```

- Run `npm run dev` for local development
- Run `npm run build` before opening a PR to check for TypeScript errors
- Keep `devguide.md`, `skills.md`, and this file updated when adding new systems

---

*Zenith Agent Workforce — Phase 46 — March 2026*
