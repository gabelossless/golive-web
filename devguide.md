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

### 3. [Vibe Guard Engine](file:///C:/GOLive/lib/vibe-rank.ts)
A proprietary engagement and ranking algorithm:
- **Shadow Buffering**: High-risk engagement events are "buffered" before being committed to the public count.
- **Growth Loops**: Artificial bot seeding and engagement boosting for new high-quality content.
- **Anti-Farming**: Strict uniqueness checks on Vibe Points to prevent engagement exploits.

---

## 🛠️ Key Utilities

### [lib/cdn.ts](file:///C:/GOLive/lib/cdn.ts)
A performance-critical utility that routes assets through the most efficient path:
- **R2 -> Saturn**: Detects Cloudflare R2 URLs and prefixes them with Saturn Network nodes.
- **IPFS Support**: Resolves `ipfs://` CIDs to public gateways.
- **Livepeer**: Generates high-performance HLS playback URLs.

### [lib/supabase.ts](file:///C:/GOLive/lib/supabase.ts)
Standardized client for database interactions with pre-configured types and environment variable protection.

---

## 🩹 Critical Patches & Guidelines

### 1. Dependency Pinning
**Viem**: Must be pinned to `2.47.4`. Newer versions (2.47.5+) introduce a peer dependency conflict with `@privy-io/ethereum` which stalls Vercel builds.

### 2. Vercel Deployment Optimization
A `.vercelignore` file is maintained to exclude the `brain/` directory (~360MB). This ensures the deployment payload remains under the 100MB limit and builds complete within <3 minutes.

### 3. Multipart API Protocol
When initiating a multipart upload, the request **MUST** include `fileSize`. The API will automatically calculate the part count (chunk size is 5MB by default) and return the `endpoints` array required by the `UploadProvider`.

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

## 📈 Roadmap (Phase 44+)
- **Social Dynamics**: Comments, Nested Replies, and User `@mentions`.
- **Ecosystem Expansion**: VibeStream Developer SDK & Embeddable Player.
- **Storage Evolution**: Full migration of cold storage to IPFS / Filecoin.

**Documentation by Sonic Zenith Senior Dev Agents.**
*Last Updated: March 2026*
