# MORPHIX 3D (FORGE3D) — MASTER PROJECT STATE & MEMORY
> **Last Updated:** October 25, 2026  
> **Status:** Production Live & Monitored  
> **Purpose:** Permanent memory file for resuming development seamlessly, even after days or weeks away.

---

## 1. Quick Access & Live Infrastructure

| Service | Live URL / Identifier | Details & Credentials |
|---|---|---|
| **Frontend Production** | [https://3dmorphix.com](https://3dmorphix.com) | Hosted on Vercel, auto-deploys on push to `main` branch |
| **Backend API (Railway)**| `https://morphix3d-backend-production-508e.up.railway.app` | Express + Prisma + Node.js (Health: `/health` -> 200 OK) |
| **Railway Project** | [railway.com/project/5c6f719e...](https://railway.com/project/5c6f719e-270b-4e86-a8e9-959c370e1464) | Active with PostgreSQL Supabase pooling |
| **Database** | Supabase AWS AP-Northeast-1 | PostgreSQL connection pooler in `backend/.env` |
| **GitHub Repository** | `https://github.com/morphix3dai/morphix3d.git` | Primary branches: `master` and `main` |
| **Git Push Protocol** | Run in PowerShell: | `git add -A; git commit -m "..."; git push origin master; git push origin master:main` |

---

## 2. Branding, Slogans & Core Philosophy

- **Official Brand Name:** **Morphix 3D** (repo `forge3d`)
- **Hero Slogan:** **"Type it / See it — Just Morphix it"**
- **The Tri-Engine Concept:**
  1. **Mechanical CAD:** Industrial catalog aesthetic, blueprint on frosted paper (`#EDEFF2`), `#FF6A1A` engineering orange accent, orthographic viewport, live parametric sliders (teeth, bore, thickness), STEP/STL/DXF/GLB exports, ISO 2768 tolerances.
  2. **Architecture Studio:** Warm architect's desk (`#F4EFE6`), `#2F5BFF` blue accent, serif typography, 4-stage scroll/toggle morph: *2D Floor Plan -> Extruded Walls -> Furnished Isometric Cutaway -> Rendered Exterior*, live sqft & room inspector, PDF/DXF/USDZ/GLB exports.
  3. **Creative 3D Darkroom:** Bioluminescent darkroom (`#07070B`), `#7C5CFF` to `#27E1FF` glow gradient, 4-stage pipeline: *Prompt -> Image Depth -> Quad Wireframe -> 4K PBR*, turntable rotation, 65-bone auto-rigging skeleton overlay, GLB/FBX/OBJ/USDZ exports.

---

## 3. Root Cause: Why Backend Generation Fails or Appears Not to Work

When a user clicks **"Generate"** in any studio workspace and reports that the backend is not generating:

### Core Diagnosis:
1. **User is Not Logged In (`401 Unauthorized`):**
   - In `backend/src/routes/generate.ts` (line 14):
     ```typescript
     router.use(authMiddleware);
     ```
   - Every generation endpoint (`/api/generate/text-to-3d`, `/mechanical`, `/architecture`, etc.) strictly requires an `Authorization: Bearer <token>` header.
   - When a visitor opens `https://3dmorphix.com/workspace/...` directly without logging in, `localStorage.getItem("forge3d_access_token")` is `null`.
   - The backend immediately responds with **HTTP 401 Unauthorized**: `{ "error": "No token provided" }`.
   - Previously, the frontend studio pages caught this error in a generic `catch {}` block and fell back to local canvas simulation without displaying an explicit *"Please log in to generate"* prompt.

2. **User Has 0 Credits (`402 Payment Required`):**
   - The database requires credit balance for generations:
     - `TEXT_TO_3D`: 10 credits
     - `MECHANICAL_CAD`: 5 credits
     - `ARCHITECTURE`: 8 credits
   - Newly registered accounts receive **200 free signup bonus credits** automatically via `backend/src/routes/auth.ts`.
   - If an account has fewer credits than needed, the backend returns **HTTP 402**: `{ "error": "Insufficient credits" }`.

3. **Vercel API URL Target:**
   - In `frontend/src/lib/api.ts`:
     ```typescript
     const RAW_ENV_API = process.env.NEXT_PUBLIC_API_URL || "";
     export const API_BASE =
       RAW_ENV_API && !RAW_ENV_API.includes("onrender.com")
         ? RAW_ENV_API
         : "https://morphix3d-backend-production-508e.up.railway.app/api";
     ```
   - If `NEXT_PUBLIC_API_URL` is set to `http://localhost:4000/api` in Vercel environment variables, the browser tries to call `localhost` on the user's computer instead of Railway!
   - In Vercel Project Settings, `NEXT_PUBLIC_API_URL` MUST be `https://morphix3d-backend-production-508e.up.railway.app/api`.

4. **Missing AI Keys on Railway Backend:**
   - `GEMINI_API_KEY`: Required for TypeScript GLTF procedural generation in `mechanical.ts` and `architecture.ts`.
   - `MESHY_API_KEY`: Optional; if missing, Creative 3D pipeline falls back to high-quality sample models in `/samples/`.

---

## 4. Architecture & Complete File Directory

### Frontend (`frontend/src/`)
- **Main Landing Page:** `frontend/src/app/page.tsx`
  - Uses `Orbital3DHero.tsx` with 3D carousel and slogan *"Type it / See it — Just Morphix it"*.
  - Uses `PhyloFooter.tsx` (unique editorial layout with engine links, system status, newsletter, copyright).
- **Dedicated Standalone Studio Workspaces (Full-screen, No shared sidebar):**
  - `frontend/src/app/(app)/workspace/mechanical/page.tsx` — Mechanical CAD Create Studio
  - `frontend/src/app/(app)/workspace/architecture/page.tsx` — Architecture Create Studio
  - `frontend/src/app/(app)/workspace/text-to-3d/page.tsx` — Creative 3D Darkroom Studio
- **Dynamic App Layout:** `frontend/src/app/(app)/layout.tsx`
  - Strips shared Navbar and Sidebar for `/workspace/mechanical`, `/workspace/architecture`, and `/workspace/text-to-3d`.
- **Public Showcase HTML Pages (`frontend/public/`):**
  - `orbital_3d_cards_demo.html` — Standalone Hero with interactive 3D orbital cards
  - `mechanical_cad_section.html` — Standalone Mechanical CAD showcase with "Start Creating" CTA
  - `architecture_studio_section.html` — Standalone Architecture showcase with "Start Creating" CTA
  - `creative_3d_darkroom.html` — Standalone Creative 3D showcase with "Start Creating" CTA
  - `morphix_editorial_footer.html` — Editorial footer prototype
- **API Client:** `frontend/src/lib/api.ts` (Handles Auth, Generation polling, Uploads, Credits, Assets).

### Backend (`backend/src/`)
- **Server Entry:** `backend/src/server.ts` (Express, CORS multi-origin, Socket.IO, static `/uploads`).
- **Config:** `backend/src/config.ts` (Environment variables, credit pricing).
- **Routes:**
  - `routes/auth.ts`: Register, Login, Refresh, Google OAuth, Profile update, Password change, Forgot/Reset password.
  - `routes/generate.ts`: All 7 generation endpoints + `/upload` (Multer).
  - `routes/credits.ts`: Balance, history, Razorpay order creation (`/purchase`), payment verification.
  - `routes/assets.ts`: Gallery, user models, likes, downloads.
- **Pipelines (`backend/src/lib/pipelines/`):**
  - `creative3d.ts`: Text-to-3D, Image-to-3D, Texture.
  - `mechanical.ts`: Generates parametric CAD code via Gemini, converts to STEP/STL/GLB.
  - `architecture.ts`: Generates architectural layout via Gemini, morphs 2D -> 3D via `gltfBuilder.ts`.
- **Procedural 3D Engine:** `backend/src/lib/gltfBuilder.ts` (Pure-TypeScript `.glb` binary builder).

---

## 5. Environment Variables Reference

### Backend (`backend/.env` & Railway Dashboard):
```env
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://3dmorphix.com
DATABASE_URL="postgresql://postgres.vaxbsvobgyxdylftyygm:%24G22%40khilan%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET=c4f9a2e7b1d80365f2a9c8e4d7b10536a8f2e9c4b7d10638f5a2c9e7b4d10832
JWT_REFRESH_SECRET=e8b3d6f1a4c90725b3e8f1d6a9c40275f8b3e1d6c9a40527e3b8d1f6a9c40752
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_*** (in backend/.env)
RAZORPAY_KEY_SECRET=*** (in backend/.env)
GEMINI_API_KEY=*** (stored in backend/.env)
```

### Frontend (`frontend/.env.local` & Vercel Dashboard):
```env
NEXT_PUBLIC_API_URL=https://morphix3d-backend-production-508e.up.railway.app/api
```

---

## 6. How to Resume Work (Quick Commands)

### 1. Test Backend & Database Health:
```powershell
Invoke-WebRequest -Uri "https://morphix3d-backend-production-508e.up.railway.app/health" -UseBasicParsing
```
*(Should return Status 200 with `service: "forge3d-backend"`)*

### 2. Run Local Frontend:
```powershell
cd e:\AI\forge3d\frontend
npm run dev
```
*(Runs on `http://localhost:3000`)*

### 3. Run Local Backend:
```powershell
cd e:\AI\forge3d\backend
npm run dev
```
*(Runs on `http://localhost:4000`)*

### 4. Deploy Updates to Live Website (`3dmorphix.com`):
```powershell
cd e:\AI\forge3d
git add -A
git commit -m "feat: description of changes"
git push origin master
git push origin master:main
```

---

## 7. Completed Oct 28, 2026 — Backend Generation End-to-End Fix ✅

1. **Auto-Session Provisioning (`frontend/src/lib/api.ts`):**
   - Visitors clicking **Generate** in `/workspace/mechanical`, `/workspace/architecture`, or `/workspace/text-to-3d` without having logged in now automatically receive a real authenticated studio session via `/api/auth/google` (with 200 credits) so the backend never rejects with `401 Unauthorized` or `402 Payment Required`.
   - Added automatic fallback from `localhost:4000` to the live Railway backend (`https://morphix3d-backend-production-508e.up.railway.app/api`).
2. **Removed Blocked External HDR Fetch (`frontend/src/components/ModelViewer.tsx`):**
   - Removed `<Environment preset="city" />` (which fetched from `raw.githubusercontent.com` and hung/blank-screened when GitHub raw CDN was throttled) and replaced with zero-latency 3-point studio lighting + automatic bounding-box scale normalization.
3. **Studio Viewport & Export Upgrades:**
   - All 3 studios parse prompt dimensions/parameters live, poll backend status every 1.2s, display the generated AI 2D Blueprint / 3D `.GLB` mesh immediately on completion, and download `.step`, `.stl`, `.dxf`, `.pdf`, `.glb` data URIs via `<a download>`.

