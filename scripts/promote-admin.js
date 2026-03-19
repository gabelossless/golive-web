const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Robust .env.local parsing
function parseEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const env = {};
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        const [key, ...rest] = line.split('=');
        let value = rest.join('=').trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        env[key.trim()] = value;
    }
    return env;
}

const env = parseEnv(path.join(process.cwd(), '.env.local'));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteAdmin() {
    console.log(`Promoting admin_bot@test.com to admin at ${supabaseUrl}...`);
    
    const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'admin_bot@test.com')
        .single();
    
    if (userError) {
        console.error('User not found in profiles table:', userError.message);
        return;
    }

    const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userData.id);

    if (error) {
        console.error('Error promoting user:', error.message);
    } else {
        console.log('Successfully promoted admin_bot@test.com to administrator.');
    }
}

promoteAdmin();
