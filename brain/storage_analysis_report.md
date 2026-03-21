# Video Hosting Architecture & Cost Analysis

When building a video platform like GoLive, TikTok, or YouTube, the **biggest hidden trap** is not the price of *storing* the video files; it is the price of *delivering* them to users (Bandwidth / Data Egress).

If 100 users watch a 100MB 720p video, you've used 10GB of bandwidth. If your app goes viral and gets 10,000 views on that single video, you've used 1,000GB (1 TB) of bandwidth.

Here is a breakdown of how **100 GB** and **1 TB** of video hosting (and streaming) will cost you across Supabase, Firebase, and Cloudflare R2, given your strict **$50/month total budget**.

---

## 1. Firebase (Google Cloud Storage)
Firebase Storage is tightly integrated but relies on standard cloud egress rates.
- **Base Plan**: Pay-as-you-go (Blaze).
- **Storage Cost**: ~$0.026 per GB / month.
- **Egress (Bandwidth) Cost**: ~$0.12 per GB transferred out.

| Scenario | Storage Cost | Streaming Egress Cost | Total Monthly Cost | Budget Status ($50/mo) |
| :--- | :--- | :--- | :--- | :--- |
| **100 GB** stored + streamed 1x | $2.60 | $12.00 | **$14.60** | Safe |
| **1 TB** stored + streamed 1x | $26.00 | $120.00 | **$146.00** | ❌ **Failed** |
| *Viral 10M views on a 50MB file* | $1.30 | $60,000 | **$60,013.30** | 💀 Bankrupt |

**Verdict**: Firebase is excellent for images and short <5sec clips, but using it to stream 720p 10-minute HD videos will destroy your budget within days of a spike in traffic.

---

## 2. Supabase (AWS S3 Backend)
Supabase is an incredible database and authentication provider, but its storage is backed by standard AWS infrastructure, meaning you pay AWS egress rates.
- **Base Plan**: Pro Tier ($25/month). Includes 8GB storage and 50GB bandwidth.
- **Storage Cost**: $0.021 per GB for extra storage.
- **Egress (Bandwidth) Cost**: $0.09 per GB over the 50GB limit.

| Scenario | Storage Cost | Streaming Egress Cost | Total Monthly Cost | Budget Status ($50/mo) |
| :--- | :--- | :--- | :--- | :--- |
| **100 GB** stored + streamed 1x | $25 + $1.93 | $4.50 (50GB overage)| **$31.43** | Safe |
| **1 TB** stored + streamed 1x | $25 + $20.80 | $85.50 (950GB overage)| **$131.30** | ❌ **Failed** |
| *Viral 10M views on a 50MB file* | $25 | $45,000 | **$45,025.00** | 💀 Bankrupt |

**Verdict**: You should absolutely use Supabase for your database, user profiles, and login flow. But like Firebase, it is too expensive to use for HD video *streaming*.

---

## 3. Cloudflare R2 (The Startup Solution)
Cloudflare uniquely disrupted the market by charging **zero** egress fees. They make their money elsewhere, making R2 the ultimate "hack" for video startups.
- **Base Plan**: $0 setup. First 10GB storage / month is Free.
- **Storage Cost**: $0.015 per GB / month.
- **Egress (Bandwidth) Cost**: **$0 (Completely Free)**.
- **Operations (reads/writes)**: ~$0.36 per 1 million reads.

| Scenario | Storage Cost | Streaming Egress Cost | Total Monthly Cost | Budget Status ($50/mo) |
| :--- | :--- | :--- | :--- | :--- |
| **100 GB** stored + streamed 1x | $1.35 | $0.00 | **$1.35** | ✅ Highly Safe |
| **1 TB** stored + streamed 1x | $14.85 | $0.00 | **$14.85** | ✅ Safe |
| *Viral 10M views on a 50MB file* | $0.75 | $0.00 | **$0.75 + ops** | ✅ Still < $5.00 |

**Verdict**: R2 is the undisputed champion for video streaming under a tight budget.

---

## How YouTube / Startups Handle Video Architecture
If a startup were building GoLive today with a $50/mo budget, they would split the infrastructure to maximize cost-efficiency:

1. **Frontend Hosting (The Website)**: **Vercel** ($0 - Hobby or $20 - Pro). Serves the site pages lightning fast.
2. **Database & Auth**: **Supabase Free or Pro ($0 or $25/mo)**. Handles user accounts, passwords, and stores *links* to videos, not the video files themselves.
3. **Video Storage & Streaming**: **Cloudflare R2 (Pay for Storage Only, ~ $1.35 - $15/mo)**. You upload the heavy MP4s to R2. The frontend uses the R2 link in an HTML5 `<video>` player.

### Billing Complexity
You will be billed separately:
- **Vercel**: Free (or $20/mo flat).
- **Supabase**: Free (or $25/mo flat if you need the Pro DB features).
- **Cloudflare**: Metred pricing. They just charge your card for the exact gigabytes stored per month ($0.015 per GB). 

### How you can do this for $25 - $40 / month:
By keeping Vercel on the Free tier and Supabase on the Pro Tier ($25), you have $15-$25 left over for storage on Cloudflare. That remaining budget buys you **~1 to 1.5 TB of raw video storage** on Cloudflare R2—which is massive—without ever having to worry about blowing up your credit card if your videos go viral, because egress is zero. 

*(If you used that same $15 budget on Firebase or Supabase Storage, you'd only get about 5-10% of that volume due to playback streaming fees).*
