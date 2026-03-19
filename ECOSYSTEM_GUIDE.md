# VibeStream Ecosystem & Management Guide

This document outlines the architecture and management of the VibeStream ecosystem, including the Natural Engagement System v2.0, Bot Management, and Admin Security protocols. It serves as the primary technical reference for new developers onboarding onto the platform's social algorithms.

## 1. Natural Engagement System v2.0

VibeStream uses a sophisticated "Natural Engagement" engine (`lib/growth.ts`) to simulate a thriving, hyper-active community. This is crucial for demonstrating platform scale and lowering the barrier to entry for new creators.

### Algorithmic Growth Engine
- **Logistic Growth Curves**: Videos no longer grow linearly. The system models a realistic content lifecycle consisting of an initial discovery spike, a viral peak, an exponential decay, and a long tail.
- **Timezone-Aware Activity**: Engagement velocity is intelligently modified based on global "Prime Time" hours (e.g., evening peaks) and weekend multipliers. 
- **Social Influence Graph**: The simulation incorporates a "Power Law" social network (`user_relationships` table). When a high-credibility influencer interacts with content, it triggers a cascade of engagement from their simulated follower base.

### Intelligent Bot Interactions
- **Bot Personalities**: Automated accounts are not generic. The system utilizes `BOT_PERSONALITIES` (e.g., Enthusiast, Analytical, Troll, Casual) which dictate their likelihood to like, comment, or share based on the video's content tier.
- **Contextual Comments**: The engine generates contextual, category-aware comments. For example, gaming videos receive gaming-specific simulated discussions rather than generic praise.

## 2. Bot Ecosystem Expansion

The platform features a dedicated local bot workforce to hydrate content discovery and engagement.

### Generation & Management
- **Bulk Creation API**: An admin-only edge function (`/api/admin/create-bots`) utilizes the Supabase Service Role to instantly generate packets of 50 unique identities. These identities are assigned distinct timezones, interests, and behavioral profiles natively during creation.
- **Admin Bot Dashboard**: Located at `/admin/bots`, this high-fidelity grid allows administrators to monitor the robotic curation base, view their credibility scores, and rapidly adjust simulation parameters to steer platform culture.

## 3. Security & Admin Authentication

Protecting the ecosystem controls is paramount. VibeStream employs layered security for administrative access.

### Access Control
- **Middleware Hardening**: The Next.js edge middleware (`lib/supabase-middleware.ts`) strictly evaluates the `profiles.is_admin` Postgres flag on every single request to `/admin/*` routes. It is impossible to bypass via client routing.
- **Authentication Fallbacks**: To prevent administrative lockouts during high-stress deployments, two secure recovery methods are implemented:
  1. **Google Social Login**: Administrators can authenticate via standard Google OAuth, linking their identities to Google Workspace.
  2. **Self-Service Recovery**: A dedicated `/forgot-password` flow allows admins to receive secure, encrypted reset links to their registered email addresses to establish new credentials.

## 4. Search & Discovery Intelligence

To manage millions of rows seamlessly without latency degradation, VibeStream uses an advanced discovery layer.
- **GIN Indexing**: The database utilizes PostgreSQL GIN (Generalized Inverted Index) configurations (`scripts/search-optimization-v1.sql`) enabling sub-second full-text searches across video titles, descriptions, and tags.
- **Smart Routing**: The Watch Page dynamically queries "Similar Videos" using category proximity and tag-matching intelligence, prioritized by simulated social popularity, rather than relying on randomized fetching.

## 5. Media Infrastructure & HLS

To support global scale, VibeStream utilizes an adaptive bitrate streaming architecture.
- **HLS Transcoding**: All uploaded content is automatically converted to HLS playlists (`.m3u8`) with multiple resolution tiers (240p to 1080p).
- **CMAF Compatibility**: We use Common Media Application Format segments to ensure low-latency playback across both iOS and Web clients.
- **Background Processing**: The processing pipeline is decoupled from the user session, allowing for high-availability transcoding even if the user closes their browser.

## 6. SEO & Social Hydration

VibeStream is built for viral discoverability.
- **SSR Metadata**: Every video and profile page serves pre-rendered meta tags, ensuring that links shared on X (Twitter), Discord, or iMessage display high-fidelity previews immediately.
- **Performance Budgeting**: We utilize IntersectionObserver-based lazy loading to ensure that even feeds with hundreds of videos maintain a 90+ Lighthouse performance score.
