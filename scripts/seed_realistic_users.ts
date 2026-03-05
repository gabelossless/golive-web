import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

// We use the anon key. If email confirmations are enabled, the script will just create the accounts
// but they might remain unconfirmed. However, we'll try to update their profiles anyway.
const supabase = createClient(supabaseUrl, supabaseKey);

const USERS = [
    // 10 Males
    { email: 'josh_reacts99@golive.test', username: 'josh_reacts99', name: 'Josh Carter', gender: 'male', age: 24, location: 'Chicago, IL', bio: '24 • CHI • Just here reacting to the best gaming clips and tech news.' },
    { email: 'mark.streams@golive.test', username: 'mark_streams', name: 'Mark Davis', gender: 'male', age: 28, location: 'Austin, TX', bio: 'Austin based variety streamer. Mostly FPS and chill RPGs.' },
    { email: 'devin_codes@golive.test', username: 'devin_codes', name: 'Devin Smith', gender: 'male', age: 22, location: 'Seattle, WA', bio: 'Building startups live. Come code with me.' },
    { email: 'tyler.vibes@golive.test', username: 'tylervibes', name: 'Tyler Jones', gender: 'male', age: 19, location: 'Miami, FL', bio: 'I talk about music and lifestyle. Good vibes only.' },
    { email: 'alex.fit@golive.test', username: 'alex_fit', name: 'Alex Martinez', gender: 'male', age: 26, location: 'Los Angeles, CA', bio: 'Fitness coach and IRL streamer.' },
    { email: 'chris.gaming@golive.test', username: 'chrisgaming', name: 'Chris Wilson', gender: 'male', age: 21, location: 'Toronto, ON', bio: 'Casual gamer from Canada. Usually dead in Warzone.' },
    { email: 'samuel.tech@golive.test', username: 'samueltech', name: 'Samuel Lee', gender: 'male', age: 25, location: 'Vancouver, BC', bio: 'Tech reviews and setup tours.' },
    { email: 'ryan.outdoors@golive.test', username: 'ryan_outdoors', name: 'Ryan Taylor', gender: 'male', age: 30, location: 'Denver, CO', bio: 'Hiking and outdoor IRL streams. Colorado native.' },
    { email: 'kevin.cooks@golive.test', username: 'kevincooks', name: 'Kevin Brown', gender: 'male', age: 27, location: 'New York, NY', bio: 'Chef by day, streamer by night. Let\'s cook something good.' },
    { email: 'daniel.music@golive.test', username: 'daniel_music', name: 'Daniel Garcia', gender: 'male', age: 23, location: 'Nashville, TN', bio: 'Indie musician. Guitar streams every Friday.' },

    // 20 Females
    { email: 'sarah.plays@golive.test', username: 'SarahPlays', name: 'Sarah Jenkins', gender: 'female', age: 21, location: 'Toronto, ON', bio: '21 • Toronto • Variety streamer & coffee addict.' },
    { email: 'emily.vlogs@golive.test', username: 'emily_vlogs', name: 'Emily White', gender: 'female', age: 23, location: 'Los Angeles, CA', bio: 'Daily vlogs and lifestyle streams. Welcome to my life!' },
    { email: 'jess.art@golive.test', username: 'jess_art', name: 'Jessica Clark', gender: 'female', age: 25, location: 'Portland, OR', bio: 'Digital artist. Come chill while I draw.' },
    { email: 'olivia.gaming@golive.test', username: 'oliviagaming', name: 'Olivia Lewis', gender: 'female', age: 20, location: 'Montreal, QC', bio: 'Valorant and chill.' },
    { email: 'chloe.tech@golive.test', username: 'chloe_tech', name: 'Chloe Robinson', gender: 'female', age: 24, location: 'San Francisco, CA', bio: 'Software engineer sharing tech tips and coding sessions.' },
    { email: 'mia.fitness@golive.test', username: 'mia_fitness', name: 'Mia Walker', gender: 'female', age: 26, location: 'Miami, FL', bio: 'Yoga and fitness streams to keep you moving.' },
    { email: 'ava.travels@golive.test', username: 'avatravels', name: 'Ava Hall', gender: 'female', age: 27, location: 'Vancouver, BC', bio: 'Travel vlogger exploring the world one stream at a time.' },
    { email: 'sophia.cooks@golive.test', username: 'sophia_cooks', name: 'Sophia Allen', gender: 'female', age: 29, location: 'Austin, TX', bio: 'Baking and cooking streams. Warning: might make you hungry.' },
    { email: 'isabella.music@golive.test', username: 'isabella_music', name: 'Isabella Young', gender: 'female', age: 22, location: 'New York, NY', bio: 'Singer/songwriter. Request a song in chat!' },
    { email: 'charlotte.reads@golive.test', username: 'charlotte_reads', name: 'Charlotte King', gender: 'female', age: 25, location: 'Seattle, WA', bio: 'Book club streams and reading sprints. Let\'s read together.' },
    { email: 'amelia.chats@golive.test', username: 'amelia_chats', name: 'Amelia Wright', gender: 'female', age: 21, location: 'Chicago, IL', bio: 'Just chatting and hanging out. Pull up a chair.' },
    { email: 'harper.styles@golive.test', username: 'harperstyles', name: 'Harper Scott', gender: 'female', age: 24, location: 'Los Angeles, CA', bio: 'Fashion hauls and styling tips.' },
    { email: 'evelyn.diy@golive.test', username: 'evelyn_diy', name: 'Evelyn Green', gender: 'female', age: 28, location: 'Denver, CO', bio: 'Crafts and DIY projects. Let\'s make something cool.' },
    { email: 'abigail.pets@golive.test', username: 'abigail_pets', name: 'Abigail Baker', gender: 'female', age: 23, location: 'Portland, OR', bio: 'Streaming with my 3 cats and 2 dogs. Chaos guaranteed.' },
    { email: 'ella.comedy@golive.test', username: 'ella_comedy', name: 'Ella Adams', gender: 'female', age: 26, location: 'New York, NY', bio: 'Stand-up comedy and funny stories.' },
    { email: 'madison.sports@golive.test', username: 'madison_sports', name: 'Madison Nelson', gender: 'female', age: 22, location: 'Dallas, TX', bio: 'Sports reactions and analysis.' },
    { email: 'lily.nature@golive.test', username: 'lily_nature', name: 'Lily Carter', gender: 'female', age: 27, location: 'Vancouver, BC', bio: 'Nature walks and photography streams.' },
    { email: 'zoe.indie@golive.test', username: 'zoe_indie', name: 'Zoe Mitchell', gender: 'female', age: 20, location: 'Montreal, QC', bio: 'Playing weird indie games you\'ve never heard of.' },
    { email: 'layla.retro@golive.test', username: 'layla_retro', name: 'Layla Perez', gender: 'female', age: 29, location: 'Austin, TX', bio: 'Retro gaming and nostalgia.' },
    { email: 'riley.chill@golive.test', username: 'riley_chill', name: 'Riley Roberts', gender: 'female', age: 21, location: 'Seattle, WA', bio: 'Lo-fi beats and chill study sessions.' }
];

async function seed() {
    console.log(`Starting to seed ${USERS.length} realistic profiles...`);

    let successCount = 0;

    for (const user of USERS) {
        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: user.email,
                password: 'Password123!',
                options: {
                    data: {
                        username: user.username,
                        full_name: user.name,
                    }
                }
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    console.log(`[SKIP] User ${user.email} already exists.`);
                    successCount++;
                    continue;
                } else {
                    console.error(`[ERROR] Auth failed for ${user.email}:`, authError.message);
                    continue;
                }
            }

            console.log(`[SUCCESS] Created auth for ${user.email} (ID: ${authData.user?.id})`);

            // 2. Fetch a realistic profile picture from randomuser.me based on gender
            const picRes = await fetch(`https://randomuser.me/api/?gender=${user.gender}&inc=picture`);
            const picData = await picRes.json();
            const candidPic = picData.results[0].picture.large;

            // 3. Update the profiles table with the bio, location, and candid picture
            if (authData.user) {
                // If RLS allows updating own profile (since we are logged in as them right after signup)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: user.name,
                        bio: user.bio,
                        avatar_url: candidPic,
                        is_verified: Math.random() > 0.8 // Randomly verify 20% of users
                    })
                    .eq('id', authData.user.id);

                if (profileError) {
                    console.error(`[ERROR] Profile update failed for ${user.username}:`, profileError.message);
                    // We can proceed even if it fails, maybe trigger handles it or RLS blocked.
                } else {
                    console.log(`   -> Set realistic avatar & bio for ${user.username}`);
                    successCount++;
                }
            }

        } catch (e: any) {
            console.error(`Exception on ${user.email}:`, e.message);
        }
    }

    console.log(`\nSeeding complete. Successfully processed: ${successCount}/${USERS.length}`);
}

seed();
