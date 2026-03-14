const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function migrate() {
    console.log("Connecting to Supabase Admin Client...");
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const sql = `
        ALTER TABLE public.videos
        ADD COLUMN IF NOT EXISTS allow_clipping boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS allow_comments boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
        ADD COLUMN IF NOT EXISTS license text DEFAULT 'Standard';
        NOTIFY pgrst, 'reload schema';
    `;

    console.log("Executing SQL alteration...");
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
       console.error("Migration via RPC failed! Direct Postgres intervention needed via Supabase Dashboard.", error.message);
    } else {
        console.log("✅ Success! Ecosystem columns added to 'videos' table.");
    }
}

migrate();
