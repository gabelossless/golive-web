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

const LOCATIONS = ['Chicago, IL', 'Austin, TX', 'Seattle, WA', 'Miami, FL', 'Los Angeles, CA', 'Toronto, ON', 'Vancouver, BC', 'Denver, CO', 'New York, NY', 'Nashville, TN', 'Portland, OR', 'Montreal, QC', 'San Francisco, CA', 'Dallas, TX'];
const MALE_FIRST = ['Josh', 'Mark', 'Devin', 'Tyler', 'Alex', 'Chris', 'Samuel', 'Ryan', 'Kevin', 'Daniel', 'Michael', 'David', 'James', 'John', 'Robert', 'William', 'Richard', 'Thomas', 'Charles', 'Joseph'];
const FEMALE_FIRST = ['Sarah', 'Emily', 'Jess', 'Olivia', 'Chloe', 'Mia', 'Ava', 'Sophia', 'Isabella', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Ella', 'Madison', 'Lily', 'Zoe', 'Layla', 'Riley'];
const LAST_NAMES = ['Carter', 'Davis', 'Smith', 'Jones', 'Martinez', 'Wilson', 'Lee', 'Taylor', 'Brown', 'Garcia', 'Jenkins', 'White', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall', 'Allen', 'Young', 'King'];
const HOBBIES = ['Gaming', 'Tech', 'Fitness', 'Music', 'Vlogging', 'Art', 'Cooking', 'Travel', 'Comedy', 'Books', 'DIY', 'Sports', 'Nature', 'Retro'];

const USERS = Array.from({ length: 100 }).map((_, i) => {
    const isMale = i % 2 === 0;
    const firstNames = isMale ? MALE_FIRST : FEMALE_FIRST;
    const firstName = firstNames[i % firstNames.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const location = LOCATIONS[i % LOCATIONS.length];
    const hobby = HOBBIES[i % HOBBIES.length];
    const age = Math.floor(Math.random() * (40 - 18 + 1)) + 18;

    return {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@golive.test`,
        username: `${firstName.toLowerCase()}_${hobby.toLowerCase()}${i}`,
        name: `${firstName} ${lastName}`,
        gender: isMale ? 'male' : 'female',
        age,
        location,
        bio: `${age} • ${location.split(',')[0]} • Passionate about ${hobby}. Come hang out!`
    };
});

async function seed() {
    console.log(`Starting to seed ${USERS.length} realistic profiles...`);

    let successCount = 0;

    for (const user of USERS) {
        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: user.email,
                password: 'GoLiveUser2026!',
                options: {
                    data: {
                        username: user.username,
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
