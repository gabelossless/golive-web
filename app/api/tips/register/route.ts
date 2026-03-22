import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from 'next/server';
import { verifyBaseTransaction, verifySolanaTransaction } from '@/lib/crypto-verify';

export async function POST(req: NextRequest) {
    try {
        const { txHash, chain, asset, amount, creatorId, videoId } = await req.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Creator's Wallet
        const { data: creator, error: creatorErr } = await supabase
            .from('profiles')
            .select('wallet_address, solana_wallet_address, username')
            .eq('id', creatorId)
            .single();

        if (creatorErr || !creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        // 2. Perform On-Chain Verification
        let isVerified = false;
        if (chain === 'base') {
            isVerified = await verifyBaseTransaction(txHash, creator.wallet_address!, amount, asset);
        } else if (chain === 'solana') {
            isVerified = await verifySolanaTransaction(txHash, creator.solana_wallet_address!, amount, asset);
        }

        if (!isVerified) {
            return NextResponse.json({ error: 'Transaction verification failed' }, { status: 400 });
        }

        // 3. Register in Database
        // Use an upsert-like operation or check for existing hash to prevent double-counting
        const { error: insertErr } = await supabase
            .from('tip_transactions')
            .insert({
                sender_user_id: user.id,
                creator_user_id: creatorId,
                video_id: videoId || null,
                transaction_hash: txHash,
                chain,
                asset,
                amount_raw: amount,
                status: 'confirmed'
            });

        if (insertErr) {
            if (insertErr.code === '23505') { // Unique constraint violation
                return NextResponse.json({ error: 'Transaction already registered' }, { status: 409 });
            }
            throw insertErr;
        }

        return NextResponse.json({ success: true, message: `Hype for ${creator.username} confirmed!` });

    } catch (err: any) {
        console.error('[Tip Registration Error]:', err);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
