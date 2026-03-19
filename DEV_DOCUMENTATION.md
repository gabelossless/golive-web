# VibeStream Developer Documentation

Welcome to the VibeStream engineering team. This document provides a technical deep-dive into the platform's core systems to help you get up to speed quickly.

---

## 1. Video Processing Pipeline (`lib/video-processor.ts`)

VibeStream uses a sophisticated transcoding pipeline powered by `FFmpeg`.

- **Input**: Raw video file (stored temporarily in `/tmp`).
- **Processing**: We generate an HLS (HTTP Live Streaming) master playlist and multiple bitrate variants (240p, 480p, 720p, 1080p).
- **Output**: Fragmented MP4 segments (`.ts` files) and a master `.m3u8`.
- **Concurrency**: Uploads to R2 are managed using `p-limit` to prevent rate-limiting while maintaining high speed.

### Key Files:
- `lib/video-processor.ts`: The core FFmpeg logic.
- `app/api/process/route.ts`: The internal API that orchestrates the download-process-upload flow.

---

## 2. Background Upload System (`components/UploadProvider.tsx`)

To provide a premium "app-like" experience, we use a global React Context for uploads.

- **Storage**: We use Cloudflare R2 for media storage.
- **Multipart Uploads**: Larger files are split into chunks using the S3 Multipart API, allowing for progress tracking and resumability.
- **Workflow**:
  1. User selects a file and metadata.
  2. `upload/page.tsx` calls `startUpload()` from the provider.
  3. The user is immediately redirected to their dashboard.
  4. The background process handles the chunked upload and subsequent HLS processing.
  5. A global toast (visible anywhere in the app) updates the user on status.

---

## 3. SEO & Performance Architecture

We adhere to a strict "Server-Side where possible, Client-Side where necessary" philosophy.

- **Dynamic Metadata**: Use `generateMetadata` in `page.tsx` for all dynamic routes. This is a Server Component feature.
- **Component Splitting**: If a page needs state (like the Profile page), we create a `page.tsx` (Server) for SEO and a `*Client.tsx` (Client) for the UI.
- **Lazy Loading**: Use the `VideoCard` pattern: images are only loaded when they enter the viewport using `IntersectionObserver` (via Framer Motion).

---

## 4. Database & Growth Simulation

Our backend (Supabase) is more than just a data store; it's a dynamic social engine.

- **RLS Policies**: Row Level Security is strictly enforced. Never query without `profiles.id` checks in security-sensitive areas.
- **Growth Engine (`lib/growth.ts`)**: Models realistic video growth. Do not modify the logistic decay constants without consulting the product team.
- **Bot Workforce**: Managed via `/api/admin/create-bots`. Bots have distinct personalities that drive content "hydration" automatically.

---

## 5. Deployment & Build

- **Framework**: Developed with Next.js 16 and Turbopack.
- **Build Command**: `npm run build`
- **Linting**: We use a strict ESLint config. Ensure you check for "Discernible Text" on buttons and avoid inline styles for premium components.

---

## 6. Contributing

- **Branching**: Use `feature/` or `fix/` prefixes for all branches.
- **Artifacts**: Keep `task.md` and `walkthrough.md` updated during your session.
- **Premium UI**: Always use curated color palettes and smooth transitions. Avoid standard "Bootstrap" or basic Tailwind looks.

---

## 7. Payments & Wallet Infrastructure (Phase 32)

VibeStream supports non-custodial multi-chain payments (Base/Solana) with an automated 75/25 creator/platform revenue split.

- **Wallet Generation**: We use [Privy](https://privy.io) (`components/VibeStreamPrivyProvider.tsx`) to auto-generate embedded wallets for users when they sign up. This provides an immediate non-custodial payout address without manual setup.
- **Smart Contracts (Base)**: We use the `VibeStreamSplitter.sol` contract to atomically split ETH and USDC tip payments. The platform address is updatable via a 48-hour timelock by the owner.
- **Solana Splitting**: We use client-side atomic transactions with multiple `SystemProgram.transfer` instructions to split SOL and SPL Token transfers. No custom program deployment is required.
- **Security**: The platform wallet addresses are stored securely in environment variables (`NEXT_PUBLIC_PLATFORM_WALLET_*`) and never hardcoded in the frontend.
