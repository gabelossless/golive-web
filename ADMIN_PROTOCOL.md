# Zenith Admin Protocol
> **CONFIDENTIAL — Internal Use Only**

This protocol defines the secure access methods, operational procedures, and emergency protocols for the Zenith admin panel.

---

## 1. Accessing the Admin Panel

**URL**: `/admin`  
**Protected by**: Next.js Edge Middleware + Supabase RLS + API-level role checks

### Prerequisites
1. Your user must have `role = 'admin'` in the `public.profiles` table
2. You must be logged in at `/login` first

### Granting Admin Access
Run in **Supabase → SQL Editor**:
```sql
UPDATE profiles SET role = 'admin' WHERE username = 'YOUR_USERNAME';
```
> ⚠️ Never expose or hardcode the service role key in the frontend.

---

## 2. Admin Panel Sections

| Section | URL | Purpose |
|---------|-----|---------|
| Dashboard | `/admin` | Live stats: users, videos, views, DAU, top creator |
| Analytics | `/admin/analytics` | 30-day charts, device dist., geo breakdown |
| Users | `/admin/users` | Browse, search, verify, or disable user accounts |
| Videos | `/admin/videos` | Moderate content, manage visibility |
| Bots | `/admin/bots` | Monitor bot workforce, generate new bots |
| Stimulus | `/admin/stimulus` | Manual growth injection for any video |
| Logs | `/admin/logs` | Platform event logs |
| Help | `/admin/help` | Internal support documentation |
| Settings | `/admin/settings-admin` | Admin configuration |

---

## 3. Analytics & Stats

The admin analytics page (`/admin/analytics`) fetches real data from `GET /api/admin/stats`, which calls the `get_platform_stats()` Supabase RPC.

Data sources:
- **DAU**: Distinct `user_id` rows in `video_events` created today
- **Views chart**: 30-day daily view counts from `video_events`
- **Device dist.**: `device_type` column in `video_events`
- **Geo**: `country_code` column in `video_events`
- **Top video**: `videos.view_count DESC LIMIT 1`

Daily snapshots auto-save to `platform_reports` on each admin dashboard visit.

> [!NOTE]  
> Event data populates as users watch videos. New installs will show zeros until traffic flows through `/api/analytics/event`.

---

## 4. Growth Intelligence Tools

### Stimulus (`/admin/stimulus`)
- **Instant Boost**: Immediately adds views/likes to any video
- **Slow Drip**: Sets a target velocity for the growth engine
- **Bot Generation**: Creates new bot accounts (`POST /api/admin/create-bots`)

### Engagement Engine Toggle
The `NEXT_PUBLIC_ENABLE_COMMUNITY_SEEDING` env variable globally enables/disables the `lib/growth.ts` engine. Set to `false` to pause all automated engagement.

---

## 5. Bot Workforce Management (`/admin/bots`)

Bots are standard `profiles` rows identified by `@zenith.bot` email pattern.

### Generating Bots
Click **"GENERATE 50 BOTS"** in the Bot Management panel. This calls `POST /api/admin/create-bots` with the service role key.

Each bot is assigned:
- Unique username and avatar
- Personality type (enthusiast, analytical, casual, troll)
- Interest categories (primary + secondary)
- Credibility and activity scores

### Bot Monitoring
The grid shows: username, personality badge, credibility score, activity level bar, interest tags, and creation date.

---

## 6. Security Rules

| Rule | Detail |
|------|--------|
| API Auth | All admin routes check `profile.role === 'admin'` server-side |
| RLS | `platform_reports`, `video_events` (read) bound to `role = 'admin'` |
| Service Role | Only used server-side in API routes — never exposed to client |
| Hardcoded Data | Prohibited — admin panels must use live Supabase data |

---

## 7. Maintenance Procedures

### Adding a New Admin
```sql
UPDATE profiles SET role = 'admin' WHERE username = 'NEW_ADMIN';
```

### Resetting a User's Data
```sql
-- Safe: remove engagement only
DELETE FROM likes WHERE user_id = 'USER_UUID';
DELETE FROM comments WHERE user_id = 'USER_UUID';
DELETE FROM subscriptions WHERE user_id = 'USER_UUID';
```

### Disabling a User
```sql
UPDATE profiles SET is_flagged = true WHERE id = 'USER_UUID';
```
Or use the Admin Users UI at `/admin/users`.

---

## 8. Emergency Procedures

### Locked Out of Admin
If middleware blocks access unexpectedly:
1. Use the Supabase dashboard → Table Editor → `profiles`
2. Find your user → set `role = 'admin'` directly
3. Or use the service role key in a local server-side script to update

### RLS Lockout
Only affects data queries — the middleware runs before RLS. If both fail:
```sql
-- Run in Supabase SQL Editor as project owner
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### Data Restore
All engagement data (`likes`, `comments`, `subscriptions`) is soft — never truncate production tables. Use targeted `DELETE WHERE` instead.

---

## 9. Platform Reports Table

`platform_reports` stores one row per calendar day with full platform stats.
Use it to build trend lines and historical reports:

```sql
SELECT report_date, total_users, dau, views_today, avg_watch_seconds
FROM platform_reports
ORDER BY report_date DESC
LIMIT 30;
```

---

*Zenith Agent Workforce — Phase 46 — Confidential*
