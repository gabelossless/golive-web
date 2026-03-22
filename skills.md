# AI Developer Agent: Technical Skills & Capabilities

This document defines the autonomous engineering capabilities and **5-Agent specialization model** used during the **Zenith** platform development cycles.

---

## 🤖 The 5-Agent Model (Zenith Edition)

When building or improving Zenith, work is delegated across 5 specialized agents:

### Agent 1: Data Architect
**Responsibility**: Schema design, database migrations, indexing strategy.
- Design and write SQL migrations for new features (tables, RPCs, indexes)
- Enforces Row Level Security (RLS) policies on all new tables
- Owns `video_events`, `platform_reports`, `profile_settings` schema
- Tools: Supabase PostgreSQL, SQL scripts in `/scripts/`

### Agent 2: Analytics Engine
**Responsibility**: Stats computation, data pipelines, event tracking API.
- Builds and maintains `lib/stats-engine.ts` (pure math on raw DB data)
- Owns `/api/admin/stats/route.ts` (protected admin stats aggregation)
- Owns `/api/analytics/event/route.ts` (client-side event ingestion)
- Ensures all metrics are computed from real data — never hardcoded
- Saves daily snapshots to `platform_reports` table for trend analysis

### Agent 3: Admin Dashboard Intelligence
**Responsibility**: Admin panel UI, real-time charts, data visualization.
- Wires admin pages to live Supabase data via Agent 2's stats API
- Renders `recharts` graphs with real platform data
- Builds growth/revenue widgets for the admin dashboard
- Displays Vibe-Rank leaderboard, top creators, geo distribution

### Agent 4: Settings & UX Polish
**Responsibility**: User-facing settings, profile management, UI completeness.
- Implements all settings tabs: Account (+ avatar upload), Notifications, Privacy, Appearance
- Owns the profile picture upload flow: `compressImage()` → R2 → Supabase update
- Ensures all UI states (loading, error, success) are handled gracefully
- Enforces premium dark aesthetic — no placeholder content in production

### Agent 5: Docs, Ops & Deployment
**Responsibility**: Documentation, git workflow, CI/CD, and deployment.
- Keeps `devguide.md` current with every new system added
- Updates `skills.md` after each sprint to reflect new capabilities
- Manages `.env` hygiene, `.vercelignore`, and build pipeline
- Final gatekeeper: runs browser verification before every production push

---

## 🛠️ Platform Engineering Proficiencies

### 1. High-Fidelity UX Implementation
- **Capability**: Translating design concepts into premium-feeling React components.
- **Tools**: Framer Motion (Gestures/Physics), Tailwind CSS, Lucide React.
- **Evidence**: `PullMenu.tsx`, `CategoryBar.tsx`, upload drag-and-drop UX.

### 2. Defensive Systems Architecture
- **Capability**: Proactive identification and resolution of edge-case crashes.
- **Evidence**: `normalizeUrl()` in `VideoCard.tsx`; dynamic `heic2any` import for SSR safety.

### 3. Tiered Logic & Monetization
- **Capability**: Complex business logic including upload limits, subscription gating, and revenue splits.
- **Evidence**: `lib/personalization.ts` (30s/6m limits, 30-day grace period engine).

### 4. Growth & Algorithm Systems
- **Capability**: Logistic growth simulation, Vibe-Rank scoring, temporal engagement modeling.
- **Evidence**: `lib/growth.ts` (logistic curves, bot personalities, social influence cascades), `lib/vibe-rank.ts` (quality × velocity × hype scoring).

### 5. Real-Time Analytics Pipeline
- **Capability**: Client-side event tracking → server-side aggregation → admin reporting.
- **Evidence**: `lib/analytics-session.ts`, `/api/analytics/event`, `/api/admin/stats`, `lib/stats-engine.ts`.

### 6. Automated Verification & QA
- **Capability**: Multi-page functional testing using automated browser subagents.
- **Evidence**: Comprehensive verification of upload, settings, admin, and watch flows.

### 7. Deployment Lifecycle Management
- **Capability**: Vercel deployment optimization, dependency pinning, payload management.
- **Evidence**: `.vercelignore` management; `viem@2.47.4` pinned to prevent build conflicts.

---

## ⚙️ Critical Platform Rules (All Agents Must Follow)

1. **No hardcoded data in admin panels** — all stats must come from real DB queries.
2. **No SSR browser APIs** — always check `typeof window !== 'undefined'` or use dynamic imports.
3. **All admin routes** must verify `profile.role === 'admin'` before returning sensitive data.
4. **Media URLs** must pass through `normalizeUrl()` before use in `next/image` or `<img>`.
5. **`viem` must stay pinned at `2.47.4`** — any upgrade will break the Vercel build.
6. **Session key**: use `zenith_session_id` (not `vibestream_session_id`).

---
*Maintained by the Zenith Agent Workforce.*
*Last Sync: March 2026 — Phase 46*
