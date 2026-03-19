import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const sql = `
            ALTER TABLE public.videos
            ADD COLUMN IF NOT EXISTS allow_clipping boolean DEFAULT true,
            ADD COLUMN IF NOT EXISTS allow_comments boolean DEFAULT true,
            ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
            ADD COLUMN IF NOT EXISTS license text DEFAULT 'Standard';

            ALTER TABLE public.profiles
            ADD COLUMN IF NOT EXISTS wallet_address text;

            NOTIFY pgrst, 'reload schema';
        `;

        // We use an RPC call if the user set up exec_sql, but realistically if this fails we'll tell the user to run it in the SQL Editor.
        const { error } = await supabase.rpc('exec_sql', { query: sql });
        
        if (error) {
           return NextResponse.json({ error }, { status: 500 });
        }
        
        return NextResponse.json({ success: true, message: "Ecosystem flags added successfully." });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
