'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { base } from 'viem/chains';

/**
 * ZenithPrivyProvider
 * Wraps the app in Privy so every user gets an embedded, non-custodial
 * Base and Solana wallet auto-generated at login (email / Google / wallet).
 *
 * Important: Set NEXT_PUBLIC_PRIVY_APP_ID in Vercel env vars and .env.local.
 * Get your App ID at https://dashboard.privy.io
 */
export default function ZenithPrivyProvider({ children }: { children: React.ReactNode }) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

    if (!appId) {
        // In dev if no Privy app ID is set, just render children without Privy
        // so the rest of the app works normally
        return <>{children}</>;
    }

    return (
        <PrivyProvider
            appId={appId}
            config={{
                // Wallets auto-created on first login for every user
                embeddedWallets: {
                    ethereum: { createOnLogin: 'all-users' },
                    solana:   { createOnLogin: 'all-users' },
                },
                defaultChain: base,
                supportedChains: [base],
                // Login methods
                loginMethods: ['email', 'google', 'wallet'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#FFB800',
                    logo: '/logo.png',
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
