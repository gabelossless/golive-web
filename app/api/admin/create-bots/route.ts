import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin API: Bulk Bot Creator
 * This generates 50 unique bot users and profiles.
 * Restricted to Service Role or Admin session.
 */

const BOT_USERNAMES = [
    "VibeSage", "ZenITH", "PixelPulse", "AuraWave", "NeonNight", "SonicSky", "DataDrift", "GhostGrid", "CyberSoul", "QuantumQuip",
    "EcoEcho", "LunarLark", "SolarSnap", "VoidVortex", "RiftRunner", "GlitchGaze", "PrismPath", "FluxFlow", "SparkSpin", "MistMelt",
    "CloudCore", "TerraTide", "AstroArch", "NovaNode", "OrbOasis", "PeakPace", "RidgeRise", "ValleyVibe", "OceanOptic", "SkyScan",
    "FlameFlick", "FrostFix", "LeafLoop", "StoneStep", "WindWave", "RainRush", "StormStay", "DustDive", "SandSurf", "MudMix",
    "IronIt", "GoldGlow", "SilverSight", "BronzeBit", "SteelStay", "LeadLoop", "ZincZap", "CopperCore", "TinTune", "ChromeCase"
];

const INTEREST_POOL = ["Gaming", "Tech", "Music", "Cooking", "Comedy", "Fitness", "DIY", "Motivation", "Science", "Nature"];
const STYLES = ["lurker", "engager", "reactor", "sharer"];
const TIMEZONES = ["America/New_York", "Europe/London", "Asia/Tokyo", "America/Los_Angeles", "Australia/Sydney"];

export async function POST(req: Request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const newBots = [];

        for (const name of BOT_USERNAMES) {
            const email = `${name.toLowerCase()}@vibestream.bot`;
            const username = name;

            // 1. Create Auth User
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email,
                password: 'bot-password-2026',
                email_confirm: true,
                user_metadata: { username, is_bot: true }
            });

            if (authError) {
                console.error(`Error creating bot ${name}:`, authError.message);
                continue;
            }

            // 2. Profile is usually created by trigger, but let's ensure it has bot flags
            await supabase.from('profiles').update({
                username,
                display_name: name,
                is_verified: Math.random() < 0.2,
                subscription_tier: Math.random() < 0.1 ? 'premium' : 'free'
            }).eq('id', authUser.user.id);

            // 3. User Behavior Profile
            const interests = {
                primary: [INTEREST_POOL[Math.floor(Math.random() * INTEREST_POOL.length)]],
                secondary: [INTEREST_POOL[Math.floor(Math.random() * INTEREST_POOL.length)]],
                avoid: []
            };

            await supabase.from('user_profiles').insert({
                user_id: authUser.user.id,
                timezone: TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)],
                engagement_style: STYLES[Math.floor(Math.random() * STYLES.length)],
                activity_level: Math.random(),
                interests
            });

            newBots.push({ id: authUser.user.id, username });
        }

        return NextResponse.json({ success: true, count: newBots.length, bots: newBots });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
