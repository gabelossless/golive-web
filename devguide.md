# Sonic Zenith: VibeStream Platform - Developer Guide

Welcome to the **Sonic Zenith (VibeStream)** codebase. This document serves as the primary technical reference for senior developers and engineers working on the platform's core infrastructure.

## 🏗️ System Architecture

Sonic Zenith is a high-performance, decentralized-first video social platform built using a modern, scalable stack:

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, React 19)
- **Authentication**: [Privy](https://privy.io/) (Non-custodial Web3 Auth) & [Supabase Auth](https://supabase.com/auth)
- **Database**: [Supabase PostgreSQL](https://supabase.com/) with RLS (Row Level Security)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (S3-compatible, Zero Egress Fees)
- **Video Infrastructure**: [Livepeer](https://livepeer.org/) (Decentralized Transcoding & HLS Playback)
- **CDN**: [Saturn Network](https://saturn.tech/) & Decentralized Gateways (L1 Edge Acceleration)
- **Animation**: [Motion (Framer Motion)](https://motion.dev/) for high-fidelity interactive UI

---

## 🚀 Core Components

### 1. [VideoPlayer.tsx](file:///C:/GOLive/components/VideoPlayer.tsx)
The heart of the viewing experience. It supports:
- **HLS.js**: Native-quality streaming for `.m3u8` playlists.
- **Ambient Mode**: Dynamic background glow based on video frames using hidden canvas sampling.
- **Livepeer Support**: Priority routing for `playbackId` over standard source URLs.
- **Decentralized Routing**: Automatically wraps standard R2 sources in decentralized gateway URLs for edge acceleration.

### 2. [UploadProvider.tsx](file:///C:/GOLive/components/UploadProvider.tsx)
Handles complex, multi-gigabyte video uploads using a robust multipart handshake:
- **Handshake**: Initializes with `fileSize` to the `/api/upload/multipart` route.
- **Pre-signed URLs**: Receives a batch of pre-signed AWS S3 `UploadPartCommand` URLs.
- **Parallel Uploads**: Compresses and uploads chunks in parallel to Cloudflare R2.
- **Persistence**: Finalizes the upload and registers the asset in the Supabase `videos` table.

### 4. YouTube-Style Mobile Navigation
The mobile UI employs a hidden `PullMenu` accessible via a pull-down gesture:
- **`PullMenu.tsx`**: Uses `framer-motion` for gesture physics and drag events.
- **`CategoryBar.tsx`**: Shared component between desktop (fixed) and mobile (hidden inside PullMenu).
- **Hardening**: `VideoCard.tsx` includes automated URL normalization to prevent home feed crashes from malformed R2 thumbnail/avatar paths.

---

## 🛠️ Key Utilities

### [lib/cdn.ts](file:///C:/GOLive/lib/cdn.ts)
A performance-critical utility that routes assets through the most efficient path:
- **R2 -> Saturn**: Detects Cloudflare R2 URLs and prefixes them with Saturn Network nodes.
- **IPFS Support**: Resolves `ipfs://` CIDs to public gateways.
- **Livepeer**: Generates high-performance HLS playback URLs.

### [lib/personalization.ts](file:///C:/GOLive/lib/personalization.ts)
Handles tiered user logic and content limits:
- **Standard**: 30s Shorts, 6m Long-form.
- **Premium**: Extended limits (configurable).
- **Grace Period**: Implementation of 30-day data retention for downgraded users before automated multi-tier deletion.

---

## 🩹 Critical Patches & Guidelines

### 1. Dependency Pinning
**Viem**: Must be pinned to `2.47.4`. Newer versions (2.47.5+) introduce a peer dependency conflict with `@privy-io/ethereum` which stalls Vercel builds.

### 2. URL Normalization
All media consumed via `next/image` **MUST** pass through `normalizeUrl()` to ensure leading slashes are present, especially for paths stored in the `videos` or `profiles` tables.

### 3. Vercel Deployment Optimization
A `.vercelignore` file is maintained to exclude the `brain/` directory (~360MB). This ensures the deployment payload remains under the 100MB limit and builds complete within <3 minutes.

---

## 👨‍💻 Development Workflow

1.  **Clone & Install**:
    ```bash
    npm install
    ```
2.  **Environment Setup**:
    Ensure `.env.local` contains valid keys for Supabase, Privy, and Cloudflare R2 (Access Key ID, Secret Access Key, and Endpoint).
3.  **Local Development**:
    ```bash
    npm run dev
    ```
4.  **Database Migration**:
    New schema changes should be applied via the scripts in the `scripts/` folder before being pushed to production.

---

## 📈 Roadmap (Phase 45+)
- **Mobile Refinement**: Advanced haptics for the Pull-Menu interaction.
- **Social Dynamics**: Comments, Nested Replies, and User `@mentions`.
- **Ecosystem Expansion**: VibeStream Developer SDK & Embeddable Player.

**Documentation by Sonic Zenith Senior Dev Agents.**
*Last Updated: March 2026 (Phase 45)*
