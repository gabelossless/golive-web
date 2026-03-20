import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Payout Addresses
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('solana_payout_address, evm_payout_address')
            .eq('id', user.id)
            .single();

        if (profileErr) throw profileErr;

        // 2. Fetch Earnings Summary (from tip_transactions)
        const { data: tips, error: tipsErr } = await supabase
            .from('tip_transactions')
            .select('amount_raw, chain, asset')
            .eq('creator_user_id', user.id);

        if (tipsErr) throw tipsErr;

        // Aggregate earnings by chain
        const earnings = tips.reduce((acc: any, tip: any) => {
            const key = `${tip.chain}-${tip.asset}`;
            acc[key] = (acc[key] || 0) + Number(tip.amount_raw);
            return acc;
        }, {});

        return NextResponse.json({
            payout_addresses: profile,
            earnings: earnings
        });

    } catch (err: any) {
        console.error('[Payout API Error]:', err);
        return NextResponse.json({ error: 'Failed to fetch payout data' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { solana_address, evm_address } = await req.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update Payout Addresses
        const { error } = await supabase
            .from('profiles')
            .update({
                solana_payout_address: solana_address,
                evm_payout_address: evm_address
            })
            .eq('id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('[Payout Update Error]:', err);
        return NextResponse.json({ error: 'Failed to update payout addresses' }, { status: 500 });
    }
}
