import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split(/\r?\n/).forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;
        const [key, ...valueParts] = trimmedLine.split('=');
        const keyName = key.trim();
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        process.env[keyName] = value;
    });
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    const filename = process.argv[2] || 'admin-roles.sql';
    const sqlPath = path.join(process.cwd(), 'scripts', filename.includes('.sql') ? filename : `${filename}.sql`);
    
    if (!fs.existsSync(sqlPath)) {
        console.error(`File not found: ${sqlPath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`Running migration: ${filename}`);

    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
        if (error.message.includes('function "exec_sql" does not exist')) {
            console.error('CRITICAL: RPC function "exec_sql" not found in Supabase.');
            console.log('Please run the contents of scripts/admin-roles.sql manually in the Supabase SQL Editor.');
        } else {
            console.error('Migration failed:', error);
        }
    } else {
        console.log('SUCCESS: Migration applied successfully.');
    }
}

runMigration();
