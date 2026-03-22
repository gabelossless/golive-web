import { createPublicClient, http, Hex } from 'viem';
import { base } from 'viem/chains';
import * as web3 from '@solana/web3.js';
import { 
    PLATFORM_WALLET_EVM, 
    PLATFORM_WALLET_SOLANA,
    TIPS_PLATFORM_FEE_PERCENT,
    USDC_BASE_ADDRESS,
    USDC_SOLANA_ADDRESS
} from './constants';

const baseClient = createPublicClient({
    chain: base,
    transport: http()
});

const solanaConnection = new web3.Connection(
    web3.clusterApiUrl('mainnet-beta'),
    'confirmed'
);

export async function verifyBaseTransaction(hash: string, expectedCreator: string, expectedAmount: string, asset: 'native' | 'usdc') {
    try {
        const receipt = await baseClient.waitForTransactionReceipt({ hash: hash as Hex });
        if (receipt.status !== 'success') return false;

        // In a real production app, we would parse logs to verify transfers.
        // For now, we confirm the presence of the transaction.
        // TODO: Add thorough log parsing for Splitter Contract events.
        return true;
    } catch (err) {
        console.error('[Verify Base] failed:', err);
        return false;
    }
}

export async function verifySolanaTransaction(signature: string, expectedCreator: string, expectedAmount: string, asset: 'native' | 'usdc') {
    try {
        const tx = await solanaConnection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
        });

        if (!tx || tx.meta?.err) return false;

        // Verify that one of the instructions involved the expected platform wallet
        // and the creator's wallet.
        const accountKeys = tx.transaction.message.staticAccountKeys.map(k => k.toBase58());
        const involvesCreator = accountKeys.includes(expectedCreator);
        const involvesPlatform = accountKeys.includes(PLATFORM_WALLET_SOLANA);

        return involvesCreator && involvesPlatform;
    } catch (err) {
        console.error('[Verify Solana] failed:', err);
        return false;
    }
}
