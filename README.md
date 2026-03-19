# VibeStream

VibeStream is a premium, high-fidelity video hosting and discovery platform designed for the modern creator economy. It features an intelligent recommendation engine, seamless mobile playback, and a fully simulated social ecosystem.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Framer Motion (Glassmorphism, High-Contast, Micro-animations)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Edge Functions)
- **Media Processing**: FFmpeg (HLS v3/v4 multi-bitrate transcoding, CMAF segments).
- **Storage**: Cloudflare R2 (Multipart chunked uploads).
- **Web3 / Payments**: Privy (Embedded Wallets), Viem (Base EVM), Solana Web3.js.

## Key Features
- **Cinematic Playback**: High-performance video player with HLS adaptive bitrate support, ambient "Halo" background syncing, and granular quality controls.
- **Background Uploads**: Global upload provider allowing users to navigate freely while content processes in the background with real-time site-wide toast notifications.
- **Discovery Intelligence**: Advanced tag autocomplete, fast GIN-indexed search arrays, and algorithmic "Similar Video" recommendations.
- **Dynamic SEO**: Full social media hydration for video and profile pages via dynamic OpenGraph and Twitter Card metadata.
- **Natural Engagement v2.0**: A proprietary backend system that simulates realistic video growth curves, timezone-aware activity, and personality-driven bot engagement to hydrate the platform and drive creator retention.
- **Multi-Chain Payments**: Non-custodial 75/25 revenue splitting tipping system on Base and Solana. Auto-generated embedded wallets for creators at signup using Privy.
- **Admin Management**: Extensive dashboard for user moderation, stimulus injection, and bot workforce control.

## Getting Started

First, install dependencies:
```bash
npm install
```

Configure your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_ENABLE_COMMUNITY_SEEDING=true
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture Documentation
For an in-depth breakdown of the simulated growth engine, bot management systems, and admin security protocols (intended for onboarding new developers), please review the **[Ecosystem Guide](./ECOSYSTEM_GUIDE.md)** within this repository.
