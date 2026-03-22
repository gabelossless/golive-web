# Zenith

> **The premium decentralized video platform for the creator economy.**

Zenith is a high-performance, decentralized-first video social platform built on a modern Web3-native stack. It features real-time analytics, an intelligent recommendation engine, seamless mobile-first playback, multi-chain tipping, and a full admin intelligence system.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🎬 **Cinematic Playback** | HLS adaptive bitrate, ambient "Halo" glow mode, quality controls |
| 📤 **Background Uploads** | Multipart R2 uploads with global toast progress — navigate freely |
| 🧠 **Vibe-Rank Algorithm** | Quality × Velocity × Hype scoring drives Trending and For You feeds |
| 📊 **Live Analytics** | Real platform stats: DAU, views, engagement rate, geo, device dist. |
| 💰 **Multi-Chain Tips** | Non-custodial 75/25 splits on Base (ETH/USDC) and Solana (SOL/SPL) |
| 🤖 **Growth Engine** | Logistic growth curves, timezone-aware activity, bot personalities |
| 🛡️ **Admin Panel** | Full dashboard — users, bots, analytics, stimulus, videos, logs |
| ⚙️ **Settings System** | Avatar upload, display name, notification prefs, privacy controls |
| 🔐 **Non-Custodial Auth** | Privy embedded wallets auto-created at signup (Base + Solana) |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15+ (App Router, React 19, Turbopack) |
| Auth | Privy (Web3) + Supabase Auth |
| Database | Supabase PostgreSQL with Row Level Security |
| Storage | Cloudflare R2 (S3-compatible, zero egress fees) |
| Video | Livepeer (decentralized HLS transcoding & playback) |
| CDN | Saturn Network (decentralized edge acceleration) |
| Payments | Viem 2.47.4 + Solana Web3.js |
| Animation | Framer Motion |
| Language | TypeScript |

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudflare R2
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=your_bucket_name
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-r2-public-url

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Platform Wallets (for tip splitting)
NEXT_PUBLIC_PLATFORM_WALLET_EVM=your_evm_address
NEXT_PUBLIC_PLATFORM_WALLET_SOL=your_sol_address

# Features
NEXT_PUBLIC_ENABLE_COMMUNITY_SEEDING=true
```

### 3. Run database migration
Open **Supabase → SQL Editor** and run:
```
setup-analytics-phase46.sql
```
This creates: `video_events`, `platform_reports`, `profile_settings` tables and RPCs.

### 4. Start development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
/app
  /admin          → Admin panel (dashboard, analytics, bots, users, logs)
  /api            → API routes (upload, analytics events, admin stats, tips)
  /settings       → User settings (account, notifications, privacy, appearance)
  /studio         → Creator studio (upload, go-live, AI studio)
  /watch          → Video watch page
  /profile        → Public creator profiles
  /search         → Search & discovery
  /live           → Livestream (Phase 47)

/components
  VideoPlayer.tsx        → HLS player with ambient mode
  UploadProvider.tsx     → Global multipart upload context
  TipButton.tsx          → Multi-chain tipping UI
  Navbar.tsx             → Desktop navigation
  PullMenu.tsx           → Mobile pull-down navigation
  CommentSection.tsx     → Nested comments
  Sidebar.tsx            → Left navigation sidebar

/lib
  stats-engine.ts        → Pure stat computation (Agent 2)
  vibe-rank.ts           → VibeRank algorithm
  growth.ts              → Natural engagement simulation
  analytics-session.ts   → Session ID management
  personalization.ts     → Tier limits and grace periods
  cdn.ts                 → URL routing (R2 → Saturn → Livepeer)
  image-utils.ts         → HEIC conversion, compression, ghost avatars
```

---

## 📚 Documentation

| File | Contents |
|------|---------|
| [`devguide.md`](./devguide.md) | Core developer reference — stack, APIs, rules |
| [`DEV_DOCUMENTATION.md`](./DEV_DOCUMENTATION.md) | Deep-dive technical docs by system |
| [`ECOSYSTEM_GUIDE.md`](./ECOSYSTEM_GUIDE.md) | Growth engine, bots, discovery, media pipeline |
| [`ADMIN_PROTOCOL.md`](./ADMIN_PROTOCOL.md) | Admin access, security, emergency procedures |
| [`skills.md`](./skills.md) | 5-agent model and engineering capabilities |
| [`setup-analytics-phase46.sql`](./setup-analytics-phase46.sql) | DB migration for analytics tables |

---

## 🤝 Contributing

- **Branching**: `feature/` or `fix/` prefixes only
- **Dependency rule**: `viem` must stay at `2.47.4`
- **Media rule**: All `<img>` and `next/image` URLs must pass through `normalizeUrl()`
- **No hardcoded data** in admin panels — all stats from Supabase

---

*Built by the Zenith Agent Workforce — Phase 46*
