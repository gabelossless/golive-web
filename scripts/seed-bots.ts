import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const SUPABASE_URL = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BOT_NAMES = [
    'ProGamerX', 'SpeedRunna', 'PixelQueen', 'RetroDave', 'SniperWolf_99',
    'GlitchHunter', 'LootGoblin', 'CampMaster', 'NoScope360', 'QuestGiver',
    'NPC_Energy', 'BossBattle', 'ManaPotion', 'XP_Grinder', 'LevelUp_Jim',
    'CraftingMama', 'RedStoneEng', 'DiamondPick', 'CreeperHug', 'Enderman_404'
];

async function seedBots() {
    console.log(`🤖 Seeding ${BOT_NAMES.length} bots...`);

    for (const username of BOT_NAMES) {
        const email = `${username.toLowerCase()}@example.com`;
        const password = 'password123'; // Default password for bots

        console.log(`Creating ${username}...`);

        // 1. Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });

        if (authError) {
            console.warn(`  ⚠️ Failed to sign up ${username}: ${authError.message}`);
            continue;
        }

        const user = authData.user;
        if (!user) {
            console.warn(`  ⚠️ No user returned for ${username}`);
            continue;
        }

        // 2. Insert into Profiles (if not triggered automatically)
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: user.id,
            username,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
            bio: 'Just here for the highlights! 🎮'
        });

        if (profileError) {
            console.warn(`  ⚠️ Failed to create profile for ${username}: ${profileError.message}`);
        }

        // 3. Mark as Bot
        const { error: botError } = await supabase.from('bots').insert({
            id: user.id,
            username
        });
        if (botError) {
            console.warn(`  ⚠️ Failed to mark ${username} as bot: ${botError.message}`);
        }

        console.log(`  ✅ ${username} created!`);
    }

    console.log('✨ Bot seeding complete!');
}

seedBots();
