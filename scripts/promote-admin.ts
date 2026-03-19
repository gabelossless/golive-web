import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteAdmin() {
    console.log('Promoting admin_bot@test.com to admin...');
    
    const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('email', 'admin_bot@test.com');

    if (error) {
        console.error('Error promoting admin:', error.message);
    } else {
        console.log('Success! admin_bot@test.com is now an admin.');
    }
}

promoteAdmin();
