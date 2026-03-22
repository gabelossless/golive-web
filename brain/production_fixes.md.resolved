# Production Deployment Fixes

I have identified two critical issues affecting your live Vercel deployment of GoLive. Since I do not have access to your Cloudflare or Supabase dashboards, please follow these steps to resolve them:

## 1. Cloudflare R2 CORS Fix
The "Network error during upload" is caused by your R2 bucket blocking requests from your Vercel domain.

1.  Log in to the **Cloudflare Dashboard**.
2.  Navigate to **R2** > **Buckets** > (Select your `golive` bucket).
3.  Go to the **Settings** tab.
4.  Find the **CORS Policy** section and click **Edit CORS Policy**.
5.  Paste the following JSON configuration:
    ```json
    [
      {
        "AllowedOrigins": ["https://golive-web.vercel.app", "http://localhost:3000"],
        "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
        "AllowedHeaders": ["Content-Type"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
      }
    ]
    ```
6.  Click **Save**.

## 2. Supabase Schema Cache Fix
The error `Could not find the 'full_name' column` occurs because Supabase is still using an old version of your database schema.

1.  Log in to the **Supabase Dashboard**.
2.  Go to the **SQL Editor** in the left sidebar.
3.  Paste and run the following command:
    ```sql
    NOTIFY pgrst, 'reload schema';
    ```
4.  This will immediately refresh the cache and allow profile updates to work.

---
**Note:** I have already updated the local codebase to be centered and have refined error diagnostics for the next push.
