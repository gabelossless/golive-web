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

async function setupAdmin() {
    const adminEmails = [
        'gabelossless@gmail.com',
        'daimonzachery@gmail.com',
        'lylyg82g@gmail.com'
    ];
    
    console.log(`--- PROMOTING ADMINS: ${adminEmails.length} accounts ---`);

    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
        console.error('Error listing users:', fetchError);
        return;
    }

    for (const email of adminEmails) {
        const targetUser = users.find(u => u.email === email);
        if (!targetUser) {
            console.warn(`[SKIP] User ${email} not found.`);
            continue;
        }

        console.log(`Promoting ${email} (ID: ${targetUser.id})`);
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', targetUser.id);

        if (updateError) {
            console.error(`[FAIL] Error promoting ${email}:`, updateError.message);
        } else {
            console.log(`[PASS] ${email} is now an admin.`);
        }
    }
}

setupAdmin();
