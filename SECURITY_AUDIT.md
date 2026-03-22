# Comprehensive Security & Compliance Audit

This document outlines the security posture of the Zenith platform, covering authentication, data integrity, smart contract safety, and administrative protocols. It is designed to satisfy the requirements of external security auditors, enterprise technical due diligence, and penetration testing teams.

---

## 1. Authentication & Identity Architecture

Zenith uses a hybrid Web2/Web3 authentication model ensuring maximum security without compromising user acquisition.

### Non-Custodial Embedded Wallets (Privy)
- We utilize **Privy.io** for authentication via Email, Google, or direct Wallet connection (MetaMask, Phantom).
- **Wallet Generation**: Upon signup, Privy automatically generates a non-custodial wallet infrastructure. Zenith **never has access to the user's private keys**.
- **Session Management**: JWTs (JSON Web Tokens) are securely signed by Privy and verified by our backend edge functions.

### Database Session Sync (Supabase Auth)
- Upon Privy authentication, a highly secure custom token flow synchronizes the user into Supabase.
- The user's ID within Supabase strictly mirrors their Privy DID (Decentralized Identifier), meaning all downstream database operations are cryptographically linked to their verified Auth state.

---

## 2. Row Level Security (RLS)

The core defensive layer of Zenith is implemented directly at the PostgreSQL database level using Row Level Security. Even if the Next.js API layer is fully compromised, data extraction or modification is blocked at the database kernel.

### Core Policies
1. **SELECT (Read)**
   - `videos` and `profiles`: Public visibility (unless `visibility = 'private'`).
   - `video_events` and `platform_reports`: Restricted identically to `role = 'admin'`.
   - `profile_settings`: Only readable where `auth.uid() = user_id`.

2. **INSERT / UPDATE (Write)**
   - `videos`, `comments`, `likes`: Users can only modify rows where `user_id = auth.uid()`.
   - `profiles.role` and `profiles.credibility_score`: Can **ONLY** be modified by the Service Role (Admin/Backend API). Users cannot elevate their own privileges via client-side API manipulation.

---

## 3. Threat Mitigation Protocols

### A. Mass Ingestion / DDoS
- **Storage**: User uploads do not proxy through our Vercel Node.js servers. We use temporary pre-signed S3 URLs. An attacker attempting to upload thousands of multi-gigabyte files will only hit the Cloudflare Edge network.
- **Size Limits**: Pre-signed URLs are strictly clamped. Mime-types are verified, preventing arbitrary executable uploading to our R2 buckets. API Route `/api/upload/multipart` verifies the `fileSize` claim against a strict global limit before generating the upload configuration.

### B. SQL Injection (SQLi)
- All database interactions use the Supabase PostgREST API or parameterized RPCs (`upsert_profile_settings`).
- We **never** construct raw string queries in the backend.

### C. Cross-Site Scripting (XSS)
- React 19 inherently escapes all string variables in JSX.
- Next.js Server Components eliminate the exposure of sensitive environment variables to the browser (`NEXT_PUBLIC_` is the only prefix that escapes to the client).
- User bios, comments, and video titles are treated strictly as plain text. No HTML parsing is allowed unless passing through a highly strict sanitizer (like structured markdown rendering).

---

## 4. Smart Contract Security (Web3 Payments)

Zenith facilitates multi-chain revenue splitting via tipping on Base (EVM) and Solana.

### EVM Splitter Contract (`ZenithSplitter.sol`)
- **Immutability**: The splitting logic (75% creator, 25% platform) is mathematically hardcoded and cannot be altered via proxy upgrades.
- **Reentrancy Protection**: All payable functions follow the strict Checks-Effects-Interactions (CEI) pattern. Custom `ReentrancyGuard` implemented on any external calls.
- **Timelock Ownership**: The platform wallet address can be updated in the event of a key compromise, but is gated by a strict 48-hour timelock to allow community oversight.

### Solana Atomic Splits
- Executed entirely client-side via Atomic Transactions containing dual `SystemProgram.transfer` instructions.
- Because it relies on native Solana instructions rather than a custom deployed Program (smart contract), there is a **0.0% risk of smart contract exploitation**.

---

## 5. Administrative Access Control

The Zenith Admin panel offers complete god-mode oversight over the ecosystem, making it the most critical attack vector.

### Layered Defense
1. **Edge Middleware Protection**: Requests to `/admin/*` trigger a database lookup verifying `profiles.role = 'admin'`. Unauthorized users receive an immediate HTTP 403 Forbidden without executing page rendering.
2. **Server-Side API Verification**: All POST/PUT actions taking place within the admin panel (e.g., triggering a background stimulus) re-verify the admin status using `auth.getUser()`.
3. **No Local Storage Trust**: The system does not trust `localStorage` or `sessionStorage` claims of "isAdmin: true". The source of truth remains the PostgreSQL role column exclusively.

### Incident Response Plan
In the event of an Administrative Key compromise:
1. Revoke the compromised Privy session universally.
2. Access the Supabase SQL editor and execute:
   ```sql
   UPDATE profiles SET role = 'user' WHERE role = 'admin';
   -- Manually reinstate trusted individuals
   UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_TRUSTED_UUID';
   ```
3. Rotate the `SUPABASE_SERVICE_ROLE_KEY` environment variable in Vercel to invalidate internal compromised backend routes.
