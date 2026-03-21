# Live Deployment Troubleshooting 🛠️

If you are experiencing issues on the live site (`golive-web.vercel.app`), follow these steps to ensure your infrastructure is correctly configured.

## 1. Cloudflare R2 CORS Policy (Crucial for Uploads)
If uploads fail with a "Network Error" or "CORS" error in the console, your R2 bucket needs to allow the Vercel domain and the `Cache-Control` header.

**Action**: Go to Cloudflare Dashboard > R2 > Your Bucket > **Settings** > **CORS Policy**. Paste this:

```json
[
  {
    "AllowedOrigins": [
      "https://golive-web.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "Cache-Control"
    ],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

## 2. Supabase Auth Rate Limits (Fixes Registration Error)
If you see "Email rate limit exceeded", it means Supabase is protecting your project from spam.

**Action**: Go to Supabase Dashboard > Authentication > **Settings** > **Rate Limits**.
- Increase **Emails per Hour** (default is often 3).
- Increase **Signups per Hour**.
- (Optional) Disable "Confirm Email" during testing to avoid needing real email delivery.

## 3. Vercel Environment Variables
Ensure the following variables are set in your Vercel Project Settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `NEXT_PUBLIC_R2_PUBLIC_URL` (The public URL of your bucket or custom domain)

## 4. Admin Setup
If you cannot access `/admin`, ensure you have run [setup-admin-infra.sql](file:///C:/GOLive/setup-admin-infra.sql) in your Supabase SQL Editor. This promotes your email to the `is_admin` role.
