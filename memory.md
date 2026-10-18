# Morphix 3D — Memory (Updated Oct 18, 2026)

## Live URLs
- **Frontend**: https://morphix3d.vercel.app (Next.js 16, Vercel)
- **GitHub**: https://github.com/morphix3dai/morphix3d.git
- **Railway project**: https://railway.com/project/5c6f719e-270b-4e86-a8e9-959c370e1464
- **Latest commit**: f0e6382

## Stack
- Frontend: Next.js 16 / React 19 / Tailwind / Three.js / @react-three/fiber
- Backend: Node.js / Express / Prisma / PostgreSQL (Supabase)
- AI Server: Python FastAPI / CadQuery / Trimesh / Shap-E (local)
- Storage: Cloudflare R2 (code ready, env vars needed)
- Email: Resend (installed, needs RESEND_API_KEY)

## Environment (backend/.env)
DATABASE_URL: ✅ Supabase PostgreSQL (live)
JWT_SECRET / JWT_REFRESH_SECRET: ✅ Set (weak dev values — change in production)
RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET: ❌ Empty
MESHY_API_KEY: ❌ Empty
OPENAI_API_KEY: ❌ Empty
RESEND_API_KEY: ❌ Empty (needs to be added for real emails)
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: ❌ Empty

## Railway Env Vars Needed
```
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://morphix3d.vercel.app
DATABASE_URL=<copy from backend/.env>
JWT_SECRET=<64-char random - use: openssl rand -hex 32>
JWT_REFRESH_SECRET=<64-char random>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RESEND_API_KEY=<from resend.com>
```

## Vercel Env Var Needed
```
NEXT_PUBLIC_API_URL=<Railway backend URL>/api
```

## What's Done ✅ (tsc clean on all)
1. All 7 workspace pages use real API (no fake setInterval)
2. File upload endpoint (POST /api/generate/upload) with multer
3. Image-to-3D and Texture pages upload file first, then generate
4. All pages pass outputUrls.glb to ModelViewer on completion
5. Mechanical page has ModelViewer + wired STEP/STL/GLB download buttons
6. Backend: Prisma on PostgreSQL, CORS multi-origin
7. Backend: real runImageTo3D/runTexture pipelines wired (not simulateGeneration)
8. Resend email service (backend/src/lib/email.ts)
   - sendPasswordResetEmail: wired in forgot-password route
   - sendWelcomeEmail: fires after successful registration
9. Mock simulation now serves REAL sample GLBs (/samples/dragon.glb etc.)
10. SEO: full metadata (OG, Twitter, robots, sitemap, PWA manifest)
11. sitemap.ts → /sitemap.xml auto-generated
12. robots.ts → /robots.txt auto-generated
13. site.webmanifest in public/

## What's Pending ⏳

### USER ACTION NEEDED (blocking Railway deploy):
1. Railway → morphix3d-backend → Settings → **Root Directory = `backend`**
2. Add Railway env vars (see above)
3. Redeploy, copy Railway URL
4. Update Vercel: NEXT_PUBLIC_API_URL = <Railway URL>/api → Redeploy

### CODE WORK REMAINING:
- [ ] Razorpay test keys (user needs to get from razorpay.com)
- [ ] RESEND_API_KEY (user needs to get from resend.com — free 3k emails/month)
- [ ] Cloudflare R2 bucket setup + env vars (code already written in r2.ts)
- [ ] OG image (/public/og-image.png) — social sharing preview image
- [ ] Favicon files (currently referenced but not in /public/)
- [ ] Google OAuth: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET env vars

### PHASE 3 (needs API keys first):
- [ ] Wire Meshy API (creative3d.ts already has the code, needs MESHY_API_KEY)
- [ ] Zoo.dev for Mechanical CAD (needs new code in mechanical.ts)

### PHASE 4 - Pre-launch (Oct 30-31):
- [ ] Sentry error monitoring (npm install @sentry/nextjs @sentry/node)
- [ ] UptimeRobot monitoring setup
- [ ] Loading skeleton states on all pages

### SECURITY AUDITS:
- Nov 1: Auth & API audit
- Nov 3: Payments & Credits audit
- Nov 5: File Upload & Data audit

### LAUNCH: Nov 8, 2026

## Key Architecture Notes
- When AI server is unreachable → mockSimulation() → returns real GLBs from /samples/
- Meshy API key present → uses Meshy for Text-to-3D/Image-to-3D
- No Meshy key → calls local AI server (Shap-E) on port 8000
- Razorpay order created backend, HMAC verified, upgrades user to PRO plan
- Google OAuth: frontend button → POST /api/auth/google → creates/finds user
- Remesh and Rig still use simulateGeneration (no real pipeline yet)

## Free Services Used
| Service | Purpose | Limit |
|---------|---------|-------|
| Vercel | Frontend hosting | Free |
| Railway | Backend hosting | $5/mo free credit |
| Supabase | PostgreSQL DB | 500MB free |
| Cloudflare R2 | Model storage | 10GB/month free |
| Resend | Transactional email | 3,000/month free |
| GitHub | Code repository | Free |
