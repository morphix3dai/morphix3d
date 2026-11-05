# MORPHIX 3D (FORGE3D) — MASTER PROJECT STATE & MEMORY
> **Last Updated:** November 5, 2026  
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
- **Official Brand Logo:** **MARK 01 // THE IMPOSSIBLE RIBBON "M" (Option A — Resting on Top V-Surface)**
  - Isometric 3-slab folded `"M"` in `#141413` architectural ink with the `#FF6A1A` engineering-orange sphere resting directly on the top V-surface (`cx="50", cy="29", r="7.5"`), paired with `'Instrument Serif'` wordmark (`Morphix`).
  - Browser tab favicon (`frontend/src/app/icon.svg`) is also set to Mark 01 Option A on a `#F4F1E6` rounded square.
- **Hero Slogan:** **"Type it / See it — Just Morphix it"**
- **Unified Site Theme (100% Cohesive Light Aesthetic Across Every Page):**
  - **Foundation:** Warm Architectural Drafting Paper (`#F4F1E6` / `#FAF8F2`) + Frosted Industrial Blueprint (`#EDEFF2`) + `#141413` architectural ink borders (`1.5px solid #141413`) and hard tactile shadows (`6px 6px 0px #141413`).
  - **The Tri-Engine Concept:**
    1. **Mechanical CAD:** Industrial catalog aesthetic, blueprint on frosted paper (`#EDEFF2`), `#FF6A1A` engineering orange accent, orthographic viewport, live parametric sliders (teeth, bore, thickness), STEP/STL/DXF/GLB exports, ISO 2768 tolerances.
    2. **Architecture Studio:** Warm architect's desk (`#F4EFE6`), `#2F5BFF` blue accent, serif typography, 4-stage scroll/toggle morph: *2D Floor Plan -> Extruded Walls -> Furnished Isometric Cutaway -> Rendered Exterior*, live sqft & room inspector, PDF/DXF/USDZ/GLB exports.
    3. **Creative 3D Atelier:** Daylight sculpture atelier (`#F4F1E6` / `#FAF8F2` / `#EDEFF2`), `#6D4AFF` & `#FF6A1A` accents, 4-stage pipeline: *Prompt -> Image Depth -> Quad Wireframe -> 4K PBR*, turntable rotation, 65-bone auto-rigging skeleton overlay, GLB/FBX/OBJ/USDZ exports.
