# 🚀 Deploy Morphix 3D Backend to Railway — Step by Step

## Prerequisites
- GitHub account (push your code there)
- Supabase account (already connected ✅)
- Railway account → https://railway.app (free, login with GitHub)

---

## Step 1 — Push Code to GitHub

```bash
cd e:/AI/forge3d
git add .
git commit -m "feat: Railway deployment config + Supabase DB"
git push origin main
```

---

## Step 2 — Create Railway Project

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select your **forge3d** repository
4. Railway will auto-detect the `railway.json` config ✅

---

## Step 3 — Set Environment Variables in Railway Dashboard

In Railway → Your Project → Variables tab, add these:

```
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://morphix3d.vercel.app

# ✅ Already have this — copy from backend/.env
DATABASE_URL=postgresql://postgres.vaxbsvobgyxdylftyygm:iR8HzhPjGJ9S2YGk@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres

# JWT — generate random strings (use https://generate-secret.vercel.app/64)
JWT_SECRET=<generate-a-random-64-char-string>
JWT_REFRESH_SECRET=<generate-a-different-random-64-char-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Leave empty for now (add when you buy the keys)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
MESHY_API_KEY=
OPENAI_API_KEY=

# AI Server (leave as localhost for now — AI features use fallback)
AI_SERVER_URL=http://localhost:8000
```

---

## Step 4 — Get Your Railway Backend URL

After deploy completes (2-3 minutes), Railway gives you a URL like:
```
https://morphix3d-backend-production.up.railway.app
```

---

## Step 5 — Update Vercel Environment Variable

In Vercel Dashboard → morphix3d project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://YOUR-RAILWAY-URL.up.railway.app/api
```

Then click **Redeploy** on Vercel.

---

## ✅ Final Stack

| Service | URL | Cost |
|---------|-----|------|
| Frontend | https://morphix3d.vercel.app | Free |
| Backend API | https://xxx.up.railway.app | Free ($5/mo credit) |
| Database | Supabase PostgreSQL | Free forever |

---

## 🔍 Verify Deployment

Open in browser:
```
https://YOUR-RAILWAY-URL.up.railway.app/api/health
```

Should return:
```json
{ "status": "ok", "service": "forge3d-backend" }
```
