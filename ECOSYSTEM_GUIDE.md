# GoLive Ecosystem & Management Guide

This guide covers how to populate and manage your platform with 100 realistic users, ensuring the app feels alive, hyper-active, and ready for VC showcases.

## 1. 100-User Ecosystem Setup

We have built a script (`scripts/seed_realistic_users.ts`) designed to generate 100 realistic profiles (ages 18-40, primarily US/Canada demographics) with unique names, candid profile pictures, and bios.

### Why 100 accounts?
Having 100 accounts allows you to demonstrate a thriving community. You can log into any of these accounts from your phone or web browser to post, comment, and stream just like a real user.

### How to generate them:
Supabase's free tier has a strict rate limit of 3 signups per hour. To bypass this and create all 100 accounts instantly, follow one of these two methods:

**Method A: Disable Rate Limiting (Recommended for Dev/Showcase)**
1. Log into your Supabase Dashboard.
2. Go to `Authentication` -> `Rate Limits`.
3. Set the email signup rate limit to something high (e.g., `1000` per hour).
4. Run the script in your terminal: `npx ts-node scripts/seed_realistic_users.ts`

**Method B: Use a Service Role Key**
1. Get your `Service Role Key` from Database Settings -> API.
2. Add it to your `.env.local` as `SUPABASE_SERVICE_ROLE_KEY="your-key-here"`.
3. The script will automatically use this key to bypass rate limits.

### How to use the generated accounts:
- All generated accounts follow a predictable pattern.
- **Email**: Check the terminal output when the script runs (usually `firstname.lastname.golive@mock.com`).
- **Password**: The script sets a universal default password for all test accounts: `GoLiveUser2026!`
- *You can use this password to sign in to any of the 100 generated accounts on web or mobile to test uploading.*

---

## 2. Algorithmic Views System

Videos will no longer launch with 0 views. We have implemented pseudo-random deterministic view generation.

- **How it works:** When a video is posted, a math algorithm generates a base view count between 100 and 300, based on the video's unique ID.
- **Growth:** Over time (every hour), the algorithm organically grows the views up to 1,000+.
- **No even numbers:** The formula ensures numbers look real (e.g., 427 views, not 500).
- Real views from the database are added *on top* of this algorithmic baseline.

---

## 3. Privacy Controls (Public vs Private)

When uploading from mobile or web, you can now toggle a video as **Public** or **Private**:
- **Public**: Appears on the Home feed, Trending feed, and your Profile. Benefits from the Algorithmic Views system.
- **Private**: Only visible in your Creator Studio. Perfect for testing uploads without cluttering the public feed.
