# Zenith Platform — Developer Guide

Welcome to the **Zenith** codebase. This is the primary technical reference for senior developers and the AI agent workforce working on the platform.

## 🏗️ System Architecture

Zenith is a high-performance, decentralized-first video social platform:

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, React 19)
- **Authentication**: [Privy](https://privy.io/) (Non-custodial Web3 Auth) & [Supabase Auth](https://supabase.com/auth)
- **Database**: [Supabase PostgreSQL](https://supabase.com/) with RLS (Row Level Security)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (S3-compatible, Zero Egress Fees)
- **Video Infrastructure**: [Livepeer](https://livepeer.org/) (Decentralized Transcoding & HLS Playback)
- **CDN**: [Saturn Network](https://saturn.tech/) & Decentralized Gateways
- **Animation**: [Motion (Framer Motion)](https://motion.dev/)

---

## 🚀 Core Components

### 1. [VideoPlayer.tsx](file:///C:/GOLive/components/VideoPlayer.tsx)
- **HLS.js** streaming for `.m3u8` playlists
- **Ambient Mode** — dynamic background glow from video frames
- **Livepeer Support** — priority routing via `playbackId`
- **Decentralized Routing** — R2 sources wrapped in Saturn gateway URLs

### 2. [UploadProvider.tsx](file:///C:/GOLive/components/UploadProvider.tsx)
Multi-gigabyte upload flow:
- Initializes with `fileSize` → `/api/upload/multipart`
- Receives batches of pre-signed `UploadPartCommand` URLs
- Parallel chunk uploads to Cloudflare R2
- Finalizes and registers asset in Supabase `videos` table

### 3. [settings/page.tsx](file:///C:/GOLive/app/settings/page.tsx)
Full settings UI:
- **Account**: username display, full_name edit, bio edit, **avatar upload** (→ R2 `/avatars/` folder)
- **Notifications**: 5 toggles (subscriber, comment, tip, trending, weekly digest) → `profile_settings` table
- **Privacy**: 4 toggles (public profile, wallet visibility, indexing, watch history) → `profile_settings` table
- **Appearance**: Theme selector (Light / Dark / System)

### 4. Mobile Navigation
- **`PullMenu.tsx`**: `framer-motion` gesture physics for pull-down
- **`CategoryBar.tsx`**: Shared between desktop (fixed) and mobile (PullMenu)
- **`VideoCard.tsx`**: Automated `normalizeUrl()` to prevent home feed crashes

---

## 📊 Analytics & Data Pipeline (Phase 46)

### Tables
| Table | Purpose |
|-------|---------|
| `video_events` | Per-event tracker: views, likes, shares, completions |
| `platform_reports` | Daily snapshots written by admin stats API |
| `profile_settings` | Per-user notification & privacy preferences |

### RPCs
| Function | Purpose |
|----------|---------|
| `get_platform_stats()` | Returns full JSON stats object (DAU, views, likes, geo, device dist.) |
| `upsert_profile_settings(...)` | Upserts user notification/privacy settings |
| `increment_view_count(video_id, amount)` | Atomic view counter increment |

### API Routes
| Route | Agent | Purpose |
|-------|-------|---------|
| `GET /api/admin/stats` | Agent 2 | Protected stats aggregation; saves to `platform_reports` |
| `POST /api/analytics/event` | Agent 2 | Client-side event logging (views, likes, shares) |
| `POST /api/upload` | — | Simple presigned URL for profile images, thumbnails |
| `POST /api/upload/multipart` | — | Multi-part video upload with auth |

### Libs
| File | Purpose |
|------|---------|
| `lib/stats-engine.ts` | Pure functions: fill daily views, compute device %, format counts |
| `lib/vibe-rank.ts` | VibeRank algorithm: quality × velocity + hype score |
| `lib/growth.ts` | Logistic growth simulation, bot engagement, temporal multipliers |
| `lib/analytics-session.ts` | Session ID from `sessionStorage` (`zenith_session_id`) |
| `lib/personalization.ts` | Subscription tier logic, upload limits, grace periods |

### Admin Panel
| Page | Data Source |
|------|-------------|
| `/admin` (dashboard) | Real Supabase counts: users, videos, views, likes, DAU, top creator |
| `/admin/analytics` | `/api/admin/stats` → 30-day view chart, device dist., geo |
| `/admin/bots` | `profiles` table filtered by `@zenith.bot` email domain |

---

## 🛠️ Key Utilities

### [lib/cdn.ts](file:///C:/GOLive/lib/cdn.ts)
- **R2 → Saturn**: Routes R2 assets through Saturn Network nodes
- **IPFS Support**: Resolves `ipfs://` to public gateways
- **Livepeer**: Generates HLS playback URLs

### [lib/personalization.ts](file:///C:/GOLive/lib/personalization.ts)
- **Standard**: 30s Shorts, 6m Long-form
- **Premium**: Extended limits
- **Grace Period**: 30-day retention for downgraded users

---

## 🩹 Critical Patches & Rules (All Agents Must Follow)

1. **`viem` pinned to `2.47.4`** — newer versions break Vercel builds (Privy peer conflict)
2. **`normalizeUrl()`** — all media in `next/image` or `<img>` must pass through this first
3. **No SSR browser APIs** — use dynamic imports or `typeof window !== 'undefined'`
4. **Admin routes require `role = 'admin'`** check on the requesting user's profile
5. **Session key is `zenith_session_id`** (formerly `vibestream_session_id` — updated Phase 46)
6. **No hardcoded stats in admin** — all numbers must come from DB or RPC
7. **`.vercelignore`** excludes `brain/` dir (~360MB) to keep build payload under 100MB

---

## 👨‍💻 Development Workflow

1. **Install**: `npm install`
2. **Env Setup**: Populate `.env.local` with Supabase, Privy, and R2 credentials
3. **Migrate DB**: Run `setup-analytics-phase46.sql` in Supabase SQL Editor
4. **Local Dev**: `npm run dev`

---

## 📈 Roadmap (Phase 47+)
- **Livestreaming** (`/live`): WebRTC or peer-assisted relay; target $0–10/mo for 10k users
- **Social Graph**: Comments, nested replies, `@mentions`
- **AI Reports**: Python/Cloud AI weekly digest for admin dashboard (when events exceed 1M/day)
- **Mobile Haptics**: Advanced PullMenu haptic feedback
- **Zenith SDK**: Embeddable player for third-party sites

---

**Documentation by Zenith Agent Workforce.**
*Last Updated: March 2026 — Phase 46*
