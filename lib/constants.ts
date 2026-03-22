// Platform wallet addresses — sourced from environment variables (NOT hardcoded)
// These are set in .env.local for dev and Vercel env vars for production.
// SECURITY: These are public on-chain addresses. Reading them exposes no funds.
//           Wallet changes require the 48h timelock on ZenithSplitter.sol.

export const PLATFORM_WALLET_EVM =
    process.env.NEXT_PUBLIC_PLATFORM_WALLET_EVM ||
    '0x0000000000000000000000000000000000000000'; // fallback to zero address if not set

export const PLATFORM_WALLET_SOLANA =
    process.env.NEXT_PUBLIC_PLATFORM_WALLET_SOLANA ||
    '11111111111111111111111111111111'; // Solana system program = safe fallback

// Deployed Splitter contract on Base (set after deployment to Base Sepolia/Mainnet)
export const ZENITH_SPLITTER_CONTRACT =
    process.env.NEXT_PUBLIC_ZENITH_SPLITTER_CONTRACT || 
    process.env.NEXT_PUBLIC_VIBESTREAM_SPLITTER_CONTRACT || '';

// Revenue split percentages (must sum to 100)
export const TIPS_CREATOR_SHARE_PERCENT = 75;
export const TIPS_PLATFORM_FEE_PERCENT  = 25;

// ─── Token Addresses ──────────────────────────────────────────────────────────
// USDC on Base (official Circle deployment — 6 decimals)
export const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// USDC on Solana (official Circle SPL token — 6 decimals)
export const USDC_SOLANA_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// ─── Chain Info ───────────────────────────────────────────────────────────────
export const BASE_CHAIN_ID = 8453;        // Base Mainnet
export const BASE_SEPOLIA_CHAIN_ID = 84532; // Base Sepolia (testnet)
