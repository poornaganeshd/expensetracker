# NOMAD — Owner Setup Checklist

## 1. Supabase (your own — the central one)
- Project URL and anon key → already in `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Run `nomad_setup.sql` in your Supabase SQL Editor (creates all tables + `user_registry`)
- Get your **Service Role Key** → Supabase → Settings → API → service_role key

## 2. Resend (for sending email reports)
- Sign up at resend.com
- Add and verify your domain (e.g. yourdomain.com)
- Create a sending address (e.g. reports@yourdomain.com)
- API Keys → Create key → copy it

## 3. Vercel Environment Variables
Go to: Vercel → Your Project → Settings → Environment Variables

Add these 5 variables:

| Variable                  | Value                                      |
|---------------------------|--------------------------------------------|
| `SUPABASE_URL`            | https://xxxx.supabase.co (your Supabase)   |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... (from Supabase Settings → API)    |
| `RESEND_API_KEY`          | re_xxxxxxxxxxxxxxxxxxxx                    |
| `RESEND_FROM_EMAIL`       | NOMAD Reports <reports@yourdomain.com>     |
| `CRON_SECRET`             | any random string (e.g. generate at crypt  |

> Generate CRON_SECRET: open browser console → `crypto.randomUUID()`

## 4. After adding env vars
- Redeploy on Vercel (or it auto-deploys on next push)
- The cron runs every hour (`vercel.json`) and sends reports when due

## 5. What friends need to do
- Just bring their own Supabase URL + anon key (and optionally Cloudinary)
- Run `nomad_setup.sql` in their own Supabase SQL Editor
- Enter email in Settings → 📧 Email Reports to receive reports

## 6. How email reports work
1. Friend sets their email + schedule in Settings → Email Reports → saved to their Supabase
2. Your Vercel cron reads `user_registry` in YOUR Supabase to find all users
3. For each user, fetches their data from their own Supabase
4. Sends email via Resend using YOUR RESEND_API_KEY
5. Logs delivery in their own Supabase `report_delivery_log`
