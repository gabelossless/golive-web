# VibeStream Admin Protocol
> **CONFIDENTIAL** - Internal Use Only

This protocol defines the secure methods for accessing and managing the VibeStream platform.

## 1. Accessing the Admin Panel
The admin panel is located at `/admin`. Note that it is protected by middleware and RLS policies.

### Prerequisites
1.  **Administrative Role**: Your user ID must have the `is_admin` flag set to `true` in the `public.profiles` table.
2.  **Session Integrity**: You must be logged in via the standard `/login` route before attempting to access `/admin`.

### Setting Admin Privileges
To grant admin access to an account, run the following SQL in the Supabase Dashboard:
```sql
UPDATE profiles SET is_admin = true WHERE username = 'YOUR_USERNAME';
```

## 2. Growth Intelligence Tools
The platform includes hidden "Stimulus" features for early-stage growth.

### Stimulus Controls (`/admin/stimulus`)
- **Instant Boost**: Adds immediate views and likes to any video.
- **Slow Drip (Beta)**: Sets a target velocity for organic growth simulation.
- **Dummy Generation**: Creates realistic accounts to follow/like content.

## 3. Maintenance Protocols
- **Mock Data**: Ensure all components use the `supabase` client for data fetching. Hardcoded mock arrays are prohibited in production.
- **User Verification**: Use the Admin Users panel to verify creators manually.

## 4. Emergency Procedures
- **Global Reset**: If RLS policies lock you out, use the Service Role key (Local Env only) to bypass and update profiles.
- **Data Persistence**: All engagement (subscriptions, comments, likes) is stored in the `public` schema. Do not truncate these tables unless performing a full reset.
