import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const sqlPath = path.join(process.cwd(), 'scripts', 'fix_settings_schema_v4.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Supabase JS SDK doesn't have a direct 'query' method (for security), 
    // it expects us to use the SQL Editor or an RPC that allows raw SQL.
    // If we have an RPC called 'exec_sql', let's use it. 
    // Otherwise, I'll advise the user to run it in the dashboard.

    console.log('Attempting to apply SQL fix...');
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            console.error('Error applying SQL:', JSON.stringify(error, null, 2));
            console.log('\n--- MANUAL FIX REQUIRED ---');
            console.log('Please copy and run the following SQL in your Supabase Dashboard SQL Editor:\n');
            console.log(sql);
        } else {
            console.log('SQL applied successfully (Schema updated).');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

main();
