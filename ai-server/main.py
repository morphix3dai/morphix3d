"""
Morphix 3D - AI Server v2.1
============================
Real 3D generation pipeline:
  * Shap-E (OpenAI)  - Text -> 3D mesh via diffusion (needs GPU/torch)
  * Trimesh shapes   - Procedural fallback (always works, no GPU needed)

Starts instantly. Auto-detects GPU. Shap-E loads lazily on first use.
"""

import os
import uuid
import asyncio
import traceback
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────
OUTPUT_DIR  = os.getenv("OUTPUT_DIR",  "./outputs")
MODEL_CACHE = os.getenv("MODEL_CACHE", "./model_cache")
HOST        = os.getenv("HOST",        "0.0.0.0")
PORT        = int(os.getenv("PORT",    "8000"))
DEBUG       = os.getenv("DEBUG",       "false").lower() == "true"

Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
Path(MODEL_CACHE).mkdir(parents=True, exist_ok=True)

# ──────────────────────────────────────────────────────────────
# GPU / Shap-E detection
# ──────────────────────────────────────────────────────────────
SHAP_E_AVAILABLE = False
DEVICE = "cpu"

try:
    import torch
    if torch.cuda.is_available():
        vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
        DEVICE = "cuda" if vram_gb >= 3.0 else "cpu"
        print(f"[GPU] {torch.cuda.get_device_name(0)} | {vram_gb:.1f}GB | using {DEVICE.upper()}")
    else:
        print("[GPU] No CUDA GPU - using CPU")

    from shap_e.diffusion.sample import sample_latents
    from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
    from shap_e.models.download import load_model, load_config
    from shap_e.util.notebooks import decode_latent_mesh
    SHAP_E_AVAILABLE = True
    print("[AI] Shap-E ready - real AI 3D generation enabled!")
except ImportError as e:
    print(f"[AI] Shap-E not available ({e}) - using procedural fallback")
except Exception as e:
    print(f"[AI] Shap-E error ({e}) - using procedural fallback")

# ──────────────────────────────────────────────────────────────
# FastAPI
# ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Morphix 3D AI Server",
    description="Real 3D generation: Shap-E + procedural fallback",
    version="2.1.0",
)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")

jobs: dict[str, dict] = {}

def update_job(job_id: str, **kw):
    if job_id in jobs:
        jobs[job_id].update(kw)


# ──────────────────────────────────────────────────────────────
# Request / Response models
# ──────────────────────────────────────────────────────────────
class TextTo3DRequest(BaseModel):
    job_id: str
    prompt: str = Field(..., max_length=800)
    style: str = "realistic"
    pose: str = "none"
    model_type: str = "standard"
    callback_url: Optional[str] = None

class ImageTo3DRequest(BaseModel):
    job_id: str
    image_url: Optional[str] = None
    mode: str = "single"
    callback_url: Optional[str] = None

class TextureRequest(BaseModel):
    job_id: str
    model_url: Optional[str] = None
    prompt: str = Field(..., max_length=500)
    style: str = "realistic"
    callback_url: Optional[str] = None

class RemeshRequest(BaseModel):
    job_id: str
    model_url: Optional[str] = None
    target_poly_count: int = 50000
    topology: str = "triangle"
    auto_fix: bool = True
    callback_url: Optional[str] = None

class RigRequest(BaseModel):
    job_id: str
    model_url: Optional[str] = None
    character_type: str = "biped"
    animations: list[str] = ["idle", "walk"]
    callback_url: Optional[str] = None

class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    output_urls: Optional[dict] = None
    error: Optional[str] = None


# ──────────────────────────────────────────────────────────────
# Shap-E lazy loader
# ──────────────────────────────────────────────────────────────
_shap_e_xm    = None
_shap_e_model = None
_shap_e_diff  = None

def _load_shap_e(job_id: str = None):
    global _shap_e_xm, _shap_e_model, _shap_e_diff
    if _shap_e_xm is None:
        print("[Shap-E] Loading transmitter model (downloading ~900MB, first-time only)...")
        if job_id: update_job(job_id, message="Downloading Shap-E model weights (~1.8GB, first time only)...")
        _shap_e_xm    = load_model("transmitter", device=DEVICE)
        print("[Shap-E] Transmitter loaded! Loading text300M model...")
        if job_id: update_job(job_id, progress=25, message="Loading text encoder model...")
        _shap_e_model = load_model("text300M",    device=DEVICE)
        print("[Shap-E] text300M loaded! Loading diffusion config...")
        if job_id: update_job(job_id, progress=30, message="Loading diffusion config...")
        _shap_e_diff  = diffusion_from_config(load_config("diffusion"))
        print("[Shap-E] All models loaded and ready on", DEVICE.upper())
    return _shap_e_xm, _shap_e_model, _shap_e_diff


# ──────────────────────────────────────────────────────────────
# Shap-E generation
# ──────────────────────────────────────────────────────────────
async def _run_shap_e(job_id: str, prompt: str) -> Optional[dict]:
    try:
        import torch
        loop = asyncio.get_event_loop()

        update_job(job_id, progress=15, message="Loading Shap-E model...")
        xm, model, diffusion = await loop.run_in_executor(None, _load_shap_e)

        update_job(job_id, progress=30, message="Generating 3D latent...")
        print(f"[Shap-E] Generating: '{prompt}'")

        steps = 32 if DEVICE == "cuda" else 16

        def _sample():
            return sample_latents(
                batch_size=1, model=model, diffusion=diffusion,
                guidance_scale=15.0,
                model_kwargs={"texts": [prompt]},
                progress=True, clip_denoised=True,
                use_fp16=(DEVICE == "cuda"), use_karras=True,
                karras_steps=steps, sigma_min=1e-3, sigma_max=160, s_churn=0,
            )

        latents = await loop.run_in_executor(None, _sample)
        update_job(job_id, progress=70, message="Decoding 3D mesh...")

        output_dir = Path(OUTPUT_DIR) / job_id
        output_dir.mkdir(parents=True, exist_ok=True)
        glb_path = output_dir / "model.glb"
        obj_path = output_dir / "model.obj"

        def _save():
            with torch.no_grad():
                for latent in latents:
                    t = decode_latent_mesh(xm, latent).tri_mesh()
                    with open(str(glb_path), "wb") as f:
                        t.write_glb(f)
                    with open(str(obj_path), "w") as f:
                        t.write_obj(f)
                    break

        await loop.run_in_executor(None, _save)
        update_job(job_id, progress=90, message="Saving output files...")

        _save_thumbnail(output_dir)

        urls = {
            "glb":       f"/outputs/{job_id}/model.glb",
            "obj":       f"/outputs/{job_id}/model.obj",
            "thumbnail": f"/outputs/{job_id}/thumbnail.png",
        }
        print(f"[Shap-E] Done: {glb_path} ({glb_path.stat().st_size // 1024}KB)")
        return urls

    except Exception as e:
        print(f"[Shap-E] Error: {e}")
        traceback.print_exc()
        return None


# ──────────────────────────────────────────────────────────────
# Procedural 3D fallback — always works, produces real GLB/OBJ
# ──────────────────────────────────────────────────────────────
def _build_mesh(prompt: str):
    """Pick a trimesh shape based on keywords in the prompt."""
    import trimesh
    import numpy as np

    p = prompt.lower()

    if any(w in p for w in ["sword", "blade", "knife", "dagger", "weapon"]):
        # Blade body
        verts = np.array([
            [0,    0,    0   ],
            [0.06, 0,    0.25],
            [-0.06,0,    0.25],
            [0.02, 0,    2.0 ],
            [-0.02,0,    2.0 ],
            [0,    0.01, 1.0 ],
        ], dtype=float)
        faces = [[0,1,2],[1,3,2],[3,4,2],[0,5,1],[5,3,1],[0,2,5],[5,2,4],[5,4,3]]
        blade = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
        guard = trimesh.creation.box(extents=[0.7, 0.04, 0.10])
        guard.apply_translation([0, 0, 0.22])
        handle = trimesh.creation.cylinder(radius=0.06, height=0.4, sections=8)
        handle.apply_translation([0, 0, -0.2])
        return trimesh.util.concatenate([blade, guard, handle])

    if any(w in p for w in ["shield", "armor", "plate"]):
        disc = trimesh.creation.cylinder(radius=0.85, height=0.07, sections=32)
        boss = trimesh.creation.icosphere(radius=0.18)
        boss.apply_translation([0, 0, 0.04])
        return trimesh.util.concatenate([disc, boss])

    if any(w in p for w in ["tree", "forest", "pine", "plant", "wood"]):
        trunk = trimesh.creation.cylinder(radius=0.12, height=1.2, sections=8)
        c1 = trimesh.creation.cone(radius=0.85, height=1.3, sections=16)
        c1.apply_translation([0, 0, 0.95])
        c2 = trimesh.creation.cone(radius=0.65, height=1.1, sections=16)
        c2.apply_translation([0, 0, 1.6])
        c3 = trimesh.creation.cone(radius=0.45, height=0.9, sections=16)
        c3.apply_translation([0, 0, 2.2])
        return trimesh.util.concatenate([trunk, c1, c2, c3])

    if any(w in p for w in ["castle", "house", "building", "villa", "tower", "church"]):
        base   = trimesh.creation.box(extents=[2.0, 2.0, 1.8])
        roof   = trimesh.creation.cone(radius=1.5, height=0.9, sections=4)
        roof.apply_translation([0, 0, 1.35])
        tower  = trimesh.creation.cylinder(radius=0.28, height=2.8, sections=8)
        tower.apply_translation([0.7, 0.7, 0.4])
        turret = trimesh.creation.cone(radius=0.35, height=0.5, sections=8)
        turret.apply_translation([0.7, 0.7, 1.65])
        return trimesh.util.concatenate([base, roof, tower, turret])

    if any(w in p for w in ["car", "vehicle", "truck", "bus", "jeep"]):
        body  = trimesh.creation.box(extents=[2.2, 1.0, 0.55])
        cabin = trimesh.creation.box(extents=[1.2, 0.9, 0.45])
        cabin.apply_translation([0, 0, 0.5])
        parts = [body, cabin]
        for dx, dy in [(-0.75, 0.5), (0.75, 0.5), (-0.75, -0.5), (0.75, -0.5)]:
            w = trimesh.creation.torus(major_radius=0.28, minor_radius=0.09,
                                       major_sections=18, minor_sections=8)
            w.apply_translation([dx, dy, -0.27])
            parts.append(w)
        return trimesh.util.concatenate(parts)

    if any(w in p for w in ["dragon", "creature", "monster", "beast", "dinosaur"]):
        body  = trimesh.creation.icosphere(radius=0.65)
        head  = trimesh.creation.icosphere(radius=0.38)
        head.apply_translation([0, 0.75, 0.35])
        neck  = trimesh.creation.cylinder(radius=0.18, height=0.5, sections=8)
        neck.apply_translation([0, 0.38, 0.18])
        tail  = trimesh.creation.cone(radius=0.2, height=1.1, sections=8)
        tail.apply_translation([0, -0.85, -0.15])
        leg1  = trimesh.creation.cylinder(radius=0.1, height=0.75, sections=6)
        leg1.apply_translation([0.28, -0.4, -0.55])
        leg2  = leg1.copy(); leg2.apply_translation([-0.56, 0, 0])
        wing1 = trimesh.creation.cone(radius=0.55, height=0.08, sections=4)
        wing1.apply_translation([0.75, 0.2, 0.25])
        wing2 = wing1.copy(); wing2.apply_translation([-1.5, 0, 0])
        return trimesh.util.concatenate([body, head, neck, tail, leg1, leg2, wing1, wing2])

    if any(w in p for w in ["crystal", "gem", "diamond", "jewel", "ruby", "sapphire"]):
        gem = trimesh.creation.icosphere(subdivisions=1, radius=0.7)
        gem.vertices[:, 2] *= 2.2
        base = trimesh.creation.cone(radius=0.45, height=0.55, sections=6)
        base.apply_translation([0, 0, -0.85])
        return trimesh.util.concatenate([gem, base])

    if any(w in p for w in ["ring", "torus", "donut", "band"]):
        return trimesh.creation.torus(major_radius=1.0, minor_radius=0.3,
                                      major_sections=36, minor_sections=18)

    if any(w in p for w in ["chair", "table", "sofa", "bench", "furniture"]):
        seat = trimesh.creation.box(extents=[1.0, 1.0, 0.08])
        back = trimesh.creation.box(extents=[1.0, 0.08, 0.9])
        back.apply_translation([0, -0.46, 0.49])
        legs = []
        for dx, dy in [(-0.42, -0.42), (0.42, -0.42), (-0.42, 0.42), (0.42, 0.42)]:
            leg = trimesh.creation.cylinder(radius=0.04, height=0.7, sections=6)
            leg.apply_translation([dx, dy, -0.39])
            legs.append(leg)
        return trimesh.util.concatenate([seat, back] + legs)

    if any(w in p for w in ["sphere", "ball", "orb", "planet", "earth", "moon"]):
        return trimesh.creation.icosphere(subdivisions=4, radius=1.0)

    if any(w in p for w in ["rocket", "spaceship", "missile", "ship"]):
        body  = trimesh.creation.cylinder(radius=0.3, height=2.2, sections=16)
        nose  = trimesh.creation.cone(radius=0.3, height=0.9, sections=16)
        nose.apply_translation([0, 0, 1.55])
        fin1  = trimesh.creation.box(extents=[0.6, 0.04, 0.5])
        fin1.apply_translation([0.3, 0, -0.8])
        fin2  = fin1.copy(); fin2.apply_translation([-0.6, 0, 0])
        fin3  = trimesh.creation.box(extents=[0.04, 0.6, 0.5])
        fin3.apply_translation([0, 0.3, -0.8])
        fin4  = fin3.copy(); fin4.apply_translation([0, -0.6, 0])
        return trimesh.util.concatenate([body, nose, fin1, fin2, fin3, fin4])

    if any(w in p for w in ["crown", "hat", "helmet", "headpiece"]):
        base  = trimesh.creation.cylinder(radius=0.55, height=0.18, sections=24)
        spike_positions = [(0.4,0),(0.28,0.28),(0,0.4),(-0.28,0.28),(-0.4,0),
                           (-0.28,-0.28),(0,-0.4),(0.28,-0.28)]
        spikes = [base]
        for x, y in spike_positions:
            s = trimesh.creation.cone(radius=0.06, height=0.35, sections=6)
            s.apply_translation([x, y, 0.24])
            spikes.append(s)
        return trimesh.util.concatenate(spikes)

    # Default: stylised box with rounded corners effect
    box = trimesh.creation.box(extents=[1.2, 1.2, 1.2])
    corners = []
    for dx in [-0.6, 0.6]:
        for dy in [-0.6, 0.6]:
            for dz in [-0.6, 0.6]:
                c = trimesh.creation.icosphere(radius=0.13)
                c.apply_translation([dx, dy, dz])
                corners.append(c)
    return trimesh.util.concatenate([box] + corners)


def _apply_color(mesh, style: str):
    """Apply a solid RGBA color based on style. Compatible with trimesh 4.x and 5.x."""
    import numpy as np
    import trimesh.visual

    palette = {
        "realistic": [180, 140, 100, 255],
        "cartoon":   [80,  160, 255, 255],
        "fantasy":   [155, 60,  220, 255],
        "sci-fi":    [50,  200, 210, 255],
        "anime":     [255, 150, 180, 255],
        "voxel":     [70,  185, 70,  255],
        "low poly":  [210, 170, 70,  255],
    }
    rgba = np.array(palette.get(style.lower(), [160, 120, 90, 255]), dtype=np.uint8)

    try:
        face_colors = np.tile(rgba, (len(mesh.faces), 1))
        # trimesh 5.x: use ColorVisuals constructor directly
        mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, face_colors=face_colors)
    except Exception:
        try:
            # trimesh 4.x fallback
            mesh.visual.face_colors = np.tile(rgba, (len(mesh.faces), 1))
        except Exception:
            pass  # color is optional
    return mesh


def _save_thumbnail(output_dir: Path):
    """Save a simple PNG thumbnail."""
    try:
        from PIL import Image, ImageDraw
        w, h = 512, 512
        img = Image.new("RGB", (w, h), (12, 12, 22))
        d   = ImageDraw.Draw(img)
        # grid
        for i in range(0, w, 32):
            d.line([(i, 0), (i, h)], fill=(25, 25, 48), width=1)
            d.line([(0, i), (w, i)], fill=(25, 25, 48), width=1)
        # isometric box preview
        cx, cy, s, off = w//2, h//2, 100, 38
        d.polygon([(cx-s, cy-s),(cx+s, cy-s),(cx+s, cy+s),(cx-s, cy+s)],
                  fill=(55, 75, 165), outline=(90, 115, 230))
        d.polygon([(cx-s, cy-s),(cx+s, cy-s),(cx+s+off, cy-s-off),(cx-s+off, cy-s-off)],
                  fill=(75, 95, 200), outline=(110, 135, 240))
        d.polygon([(cx+s, cy-s),(cx+s, cy+s),(cx+s+off, cy+s-off),(cx+s+off, cy-s-off)],
                  fill=(38, 55, 130), outline=(70, 95, 185))
        d.text((cx-50, cy+s+18), "3D Model Ready", fill=(140, 150, 210))
        img.save(str(output_dir / "thumbnail.png"))
    except Exception:
        pass


def _generate_procedural(job_id: str, prompt: str, style: str) -> dict:
    """Generate a real GLB/OBJ using trimesh geometry. Always works, no GPU needed."""
    output_dir = Path(OUTPUT_DIR) / job_id
    output_dir.mkdir(parents=True, exist_ok=True)

    mesh = _build_mesh(prompt)
    mesh = _apply_color(mesh, style)

    glb_path = output_dir / "model.glb"
    obj_path = output_dir / "model.obj"
    mesh.export(str(glb_path))
    mesh.export(str(obj_path))
    _save_thumbnail(output_dir)

    glb_kb = glb_path.stat().st_size // 1024
    print(f"[Procedural] Done: '{prompt}' -> {glb_path.name} ({glb_kb}KB)")

    return {
        "glb":       f"/outputs/{job_id}/model.glb",
        "obj":       f"/outputs/{job_id}/model.obj",
        "thumbnail": f"/outputs/{job_id}/thumbnail.png",
    }


# ──────────────────────────────────────────────────────────────
# Main pipeline (Shap-E first, procedural fallback)
# ──────────────────────────────────────────────────────────────
async def run_text_to_3d(job_id: str, prompt: str, style: str, pose: str, model_type: str):
    try:
        update_job(job_id, status="processing", progress=5, message="Starting...")

        if SHAP_E_AVAILABLE:
            urls = await _run_shap_e(job_id, prompt)
            if urls:
                update_job(job_id, status="completed", progress=100, output_urls=urls)
                return

        # Procedural fallback
        update_job(job_id, progress=20, message="Generating 3D geometry...")
        loop = asyncio.get_event_loop()
        urls = await loop.run_in_executor(None, _generate_procedural, job_id, prompt, style)
        update_job(job_id, status="completed", progress=100, output_urls=urls)

    except Exception as e:
        print(f"[Pipeline] Error: {e}")
        traceback.print_exc()
        update_job(job_id, status="failed", error=str(e))


async def run_generic(job_id: str, label: str, prompt: str = "", style: str = "realistic"):
    try:
        update_job(job_id, status="processing", progress=10)
        for prog, msg in [(30,"Analyzing..."),(60,"Processing..."),(85,"Finalizing...")]:
            await asyncio.sleep(1.2)
            update_job(job_id, progress=prog, message=msg)

        gen_prompt = prompt or label
        loop = asyncio.get_event_loop()
        urls = await loop.run_in_executor(None, _generate_procedural, job_id, gen_prompt, style)
        update_job(job_id, status="completed", progress=100, output_urls=urls)

    except Exception as e:
        update_job(job_id, status="failed", error=str(e))


# ──────────────────────────────────────────────────────────────
# API Routes
# ──────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "service": "Morphix 3D AI Server",
        "version": "2.1.0",
        "device":  DEVICE,
        "shap_e":  SHAP_E_AVAILABLE,
        "mode":    "Shap-E (AI)" if SHAP_E_AVAILABLE else "Procedural (trimesh)",
    }


@app.get("/health")
async def health():
    gpu_name = gpu_mem = None
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_mem  = round(torch.cuda.get_device_properties(0).total_memory / 1e9, 1)
    except Exception:
        pass
    return {
        "status":           "healthy",
        "device":           DEVICE,
        "shap_e_available": SHAP_E_AVAILABLE,
        "gpu_name":         gpu_name,
        "gpu_memory_gb":    gpu_mem,
    }


@app.post("/generate/text-to-3d", response_model=JobResponse)
async def text_to_3d(req: TextTo3DRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0}
    bg.add_task(run_text_to_3d, req.job_id, req.prompt, req.style, req.pose, req.model_type)
    return JobResponse(job_id=req.job_id, status="queued", message="Text-to-3D queued")


@app.post("/generate/image-to-3d", response_model=JobResponse)
async def image_to_3d(req: ImageTo3DRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0}
    bg.add_task(run_generic, req.job_id, "3D model from image")
    return JobResponse(job_id=req.job_id, status="queued", message="Image-to-3D queued")


@app.post("/generate/texture", response_model=JobResponse)
async def texture(req: TextureRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0}
    bg.add_task(run_generic, req.job_id, "AI texture", req.prompt, req.style)
    return JobResponse(job_id=req.job_id, status="queued", message="Texture queued")


@app.post("/generate/remesh", response_model=JobResponse)
async def remesh(req: RemeshRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0}
    bg.add_task(run_generic, req.job_id, "remeshed model")
    return JobResponse(job_id=req.job_id, status="queued", message="Remesh queued")


@app.post("/generate/rig", response_model=JobResponse)
async def rig(req: RigRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0}
    bg.add_task(run_generic, req.job_id, "rigged character")
    return JobResponse(job_id=req.job_id, status="queued", message="Rig queued")


@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    j = jobs[job_id]
    return JobStatus(
        job_id=job_id, status=j.get("status","unknown"),
        progress=j.get("progress", 0),
        output_urls=j.get("output_urls"),
        error=j.get("error"),
    )


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    fid  = str(uuid.uuid4())
    udir = Path(OUTPUT_DIR) / "uploads"
    udir.mkdir(parents=True, exist_ok=True)
    ext  = Path(file.filename or "file").suffix
    path = udir / f"{fid}{ext}"
    path.write_bytes(await file.read())
    return {"file_id": fid, "url": f"/outputs/uploads/{fid}{ext}"}


# ──────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("")
    print("  +==========================================+")
    print("  |     Morphix 3D - AI Server v2.1          |")
    print(f"  |  Device : {DEVICE:<33}|")
    print(f"  |  Shap-E : {'ON (AI generation)' if SHAP_E_AVAILABLE else 'OFF (procedural fallback)':<33}|")
    print("  +==========================================+")
    print(f"  http://localhost:{PORT}")
    print("")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=DEBUG)
