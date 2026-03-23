# Zenith Monetization & Billing Guide

This guide explains how to finalize the billing and monetization system for Zenith using the infrastructure we just deployed.

## 💰 1. Tipping System (Real-time)
We have implemented a `transactions` table and a real-time alert system.

### How to use:
1.  **PayPal**: Use the PayPal JavaScript SDK in the frontend. On `onApprove`, call `/api/payments/tip` with the `orderID`.
2.  **Crypto**: Use `@solana/web3.js` or `viem` to detect a transfer. Once confirmed on-chain, call `/api/payments/tip` with the transaction hash.

## 🔒 2. Gated Streams (Pay-Per-View)
Creators can now set `is_gated: true` and a `price` when going live.

### The Flow:
-   **Viewer**: Clicks "Unlock Stream".
-   **Payment**: Process via PayPal/Crypto.
-   **Unlock**: On success, insert a record into the `stream_access` table via a secure API.
-   **Access**: The `/api/live/check-access` endpoint will now return `hasAccess: true`.

## 🔁 3. Creator Subscriptions
The `creator_subscriptions` table allows for monthly recurring support.

### Implementation:
-   Use PayPal Subscriptions API.
-   On the webhook event `BILLING.SUBSCRIPTION.CREATED`, update the `creator_subscriptions` table in Supabase.

## 📈 4. Multi-Pipe Cost Guardrails
The system automatically chooses the cheapest route:
-   **< 50 Viewers**: Uses **LiveKit SFU** (Ultra-low latency, low cost).
-   **> 50 Viewers**: Uses **Livepeer HLS** (High scalability, CDN-friendly).

## 🛠️ Environment Variables Required
Ensure these are in your Vercel or `.env.local`:
-   `LIVEKIT_API_KEY`: Your LiveKit project key.
-   `LIVEKIT_API_SECRET`: Your LiveKit project secret.
-   `NEXT_PUBLIC_LIVEKIT_URL`: Your LiveKit server URL (e.g., `wss://zenith-xxxx.livekit.cloud`).
-   `LIVEPEER_API_KEY`: Your Livepeer Studio API key.
