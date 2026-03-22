# System Architecture & Technical Due Diligence

This document provides a high-level architectural overview of the Zenith platform. It is designed for Lead Engineers, Technical Auditors, and Due Diligence teams evaluating the scalability, fault tolerance, and fundamental design patterns of the system.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    Client[Web/Mobile Client] -->|Next.js App Router| Edge[Vercel Edge Network]
    
    subgraph Frontend [Presentation Layer]
        Edge --> ServerComponents[React Server Components]
        Edge --> ClientComponents[React Client Components]
    end

    subgraph CDN [Delivery Layer]
        Client -->|Video Playback| Saturn[Saturn CDN Gateway]
        Saturn -->|Cache Miss| R2[Cloudflare R2 Storage]
        Saturn -->|Transcode| Livepeer[Livepeer Decentralized Network]
    end

    subgraph BackendAPI [Core APIs & Logic]
        ServerComponents -->|Auth/Data| SupabaseAPI[Supabase REST/GraphQL]
        ServerComponents -->|Next Middleware| EdgeAuth[Edge JWT Validation]
        Client -->|Event Telemetry| AnalyticsAPI[/api/analytics/event]
        Client -->|Chunked Uploads| UploadAPI[/api/upload/multipart]
    end

    subgraph Persistence [Database Layer]
        SupabaseAPI --> Postgres[(Supabase PostgreSQL)]
        Postgres --> RLS{Row Level Security}
        Postgres --> RPC[PL/pgSQL RPC Functions]
    end

    subgraph Web3 [Payments & Identity]
        ClientComponents --> Privy[Privy Embedded Wallets]
        Privy -->|Tx Sign| Base[Base EVM Network]
        Privy -->|Tx Sign| Sol[Solana Network]
    end
```

---

## 2. Infrastructure & Scalability

Zenith is designed to handle global, viral traffic spikes without corresponding linear cost increases.

### Zero-Egress Media Storage (Cloudflare R2)
- **Problem**: AWS S3 egress costs ($0.09/GB) are fatal to video platforms.
- **Solution**: We use Cloudflare R2 storage, which is fully S3-compatible but charges **$0.00 for outbound bandwidth**.
- **Scale**: The frontend utilizes direct-to-R2 pre-signed URLs. The Next.js servers never touch the video bytes during upload, allowing the Node.js instances to scale purely on lightweight JSON API traffic.

### Decentralized Transcoding (Livepeer)
Raw `.mp4` and `.mov` files are not suitable for varied network conditions.
- Zenith utilizes the Livepeer network to transcode raw uploads into HTTP Live Streaming (HLS) `.m3u8` master playlists.
- This creates adaptive bitrate streams (1080p, 720p, 480p) that switch dynamically based on the user's internet speed, ensuring buffer-free playback on mobile connections.

### Full-Text Search (GIN Indexes)
- Our database uses PostgreSQL GIN (Generalized Inverted Index) on `videos.title`, `videos.description`, and `videos.tags`.
- This enables sub-50 millisecond text search across millions of rows without requiring a separate, expensive ElasticSearch cluster.

---

## 3. Data Pipeline & Analytics Isolation

We built the Phase 46 Analytics Pipeline to perform high-resolution telemetry without degrading core database performance.

- **Event Ingestion**: `POST /api/analytics/event` validates schema and safely inserts into `video_events`.
- **Stat Aggregation**: Rather than running heavy `COUNT(*)` queries during page loads, the system relies on a materialized snapshot approach. The Supabase RPC `get_platform_stats()` aggregates live events and immediately UPSERTs the result into `platform_reports`.
- **Fault Tolerance**: If the `video_events` table grows too large, the daily `platform_reports` table remains intact, serving as a historical ledger regardless of underlying event pruning.

---

## 4. Frontend Resilience

### Server Components vs. Client Components
Zenith adheres strictly to the App Router paradigm to minimize JavaScript bundle sizes:
- **SEO & Layout**: Rendered natively on the server (`page.tsx`). OpenGraph metadata and Twitter cards are injected before the HTML reaches the client.
- **Interactivity**: Isolated strictly to leaf nodes (`*Client.tsx`, interactive buttons).

### Adaptive Degradation
If third-party services fail, Zenith gracefully degrades:
- **Analytics Failure**: Handled via `try/catch` in the middleware and components; the user experience is entirely unaffected.
- **Saturn CDN Drop**: Fallback directly to the raw `.m3u8` Livepeer endpoint or the raw R2 `.mp4` path.
- **Web3 RPC Failure**: Tipping buttons enter a disabled state; core video viewing and social interactions remain 100% functional.

---

## 5. Security & Isolation

Security boundaries are strictly enforced at three layers:
1. **Edge Middleware**: Blocks unauthorized paths (e.g., `/admin`) before invoking Serverless Functions.
2. **Server-Side API**: Validates the JWT and the user's `role` fetched directly from the database (never from a client cookie claim).
3. **Database RLS**: Row Level Security ensures that even if a server vulnerability occurred, the database itself rejects `UPDATE`/`DELETE` queries where `auth.uid() != videos.user_id`.

For a full breakdown of security protocols, see [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md).
