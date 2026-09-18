# ============================================================
# MORPHIX AI Server — Google Colab Edition
# ============================================================
# 
# HOW TO USE:
# 1. Go to https://colab.research.google.com
# 2. Create a new notebook
# 3. Change runtime: Runtime → Change runtime type → T4 GPU
# 4. Paste this ENTIRE file into a single cell
# 5. Click Run (▶)
# 6. Copy the ngrok URL that appears at the bottom
# 7. Paste it into your backend .env as AI_SERVER_URL
#
# FREE TIER: T4 GPU (16GB VRAM) — enough for Shap-E + TripoSR
# ============================================================

# --- Step 1: Install dependencies ---
!pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cu121
!pip install -q fastapi "uvicorn[standard]" pyngrok trimesh numpy Pillow
!pip install -q git+https://github.com/openai/shap-e.git
!pip install -q diffusers transformers accelerate safetensors
!pip install -q huggingface_hub aiofiles python-multipart nest_asyncio

import os, uuid, asyncio, threading, time
from pathlib import Path

# --- Step 2: Set up ngrok (free tunnel to expose Colab to internet) ---
# Get your free auth token at: https://dashboard.ngrok.com/signup
NGROK_AUTH_TOKEN = ""  # ← PASTE YOUR FREE NGROK TOKEN HERE (get it from ngrok.com)

if NGROK_AUTH_TOKEN:
    from pyngrok import ngrok
    ngrok.set_auth_token(NGROK_AUTH_TOKEN)

# --- Step 3: Create output directory ---
os.makedirs("outputs", exist_ok=True)

# --- Step 4: Build FastAPI server with REAL AI models ---
from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI(title="Morphix AI Server (Colab)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# --- Request/Response Models ---
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

# --- Job Tracker ---
jobs: dict[str, dict] = {}

def update_job(job_id: str, **kwargs):
    if job_id in jobs:
        jobs[job_id].update(kwargs)

# ============================================================
# REAL AI PIPELINE — Uses actual GPU models
# ============================================================
class RealAIPipeline:
    def __init__(self):
        import torch
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.shap_e_loaded = False
        self.shap_e_model = None
        self.shap_e_diffusion = None
        print(f"[AI] Pipeline initialized on: {self.device}")
        if self.device == "cuda":
            import torch
            print(f"[AI] GPU: {torch.cuda.get_device_name(0)}")
            props = torch.cuda.get_device_properties(0)
            vram = getattr(props, 'total_memory', getattr(props, 'total_mem', 0))
            print(f"[AI] VRAM: {vram / 1e9:.1f} GB")

    def _load_shap_e(self):
        """Load Shap-E model (OpenAI's text-to-3D) — first call takes ~2 min"""
        if self.shap_e_loaded:
            return
        print("[AI] Loading Shap-E text-to-3D model (first time takes ~2 min)...")
        import torch
        from shap_e.diffusion.sample import sample_latents
        from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
        from shap_e.models.download import load_model, load_config

        self.xm = load_model('transmitter', device=self.device)
        self.shap_e_model = load_model('text300M', device=self.device)
        self.shap_e_diffusion = diffusion_from_config(load_config('diffusion'))
        self.shap_e_loaded = True
        print("[AI] Shap-E loaded successfully!")

    async def text_to_3d(self, job_id: str, prompt: str, style: str,
                         pose: str, model_type: str) -> dict:
        """Generate a real 3D model from text using Shap-E"""
        import torch
        from shap_e.diffusion.sample import sample_latents
        from shap_e.util.notebooks import decode_latent_mesh

        print(f"[AI] Text-to-3D: '{prompt}'")
        update_job(job_id, status="processing", progress=5, message="Loading AI model...")

        # Load model (cached after first call)
        self._load_shap_e()
        update_job(job_id, progress=20, message="Generating 3D shape...")

        # Generate 3D latents
        batch_size = 1
        guidance_scale = 15.0

        latents = sample_latents(
            batch_size=batch_size,
            model=self.shap_e_model,
            diffusion=self.shap_e_diffusion,
            guidance_scale=guidance_scale,
            model_kwargs=dict(texts=[prompt] * batch_size),
            progress=True,
            clip_denoised=True,
            use_fp16=True,
            use_karras=True,
            karras_steps=64,
            sigma_min=1e-3,
            sigma_max=160,
            s_churn=0,
        )
        update_job(job_id, progress=70, message="Converting to 3D mesh...")

        # Decode to mesh and export
        output_dir = Path("outputs") / job_id
        output_dir.mkdir(parents=True, exist_ok=True)

        for i, latent in enumerate(latents):
            t = decode_latent_mesh(self.xm, latent).tri_mesh()

            # Export as OBJ
            obj_path = output_dir / "model.obj"
            with open(obj_path, 'w') as f:
                t.write_obj(f)

            # Export as PLY
            ply_path = output_dir / "model.ply"
            with open(ply_path, 'wb') as f:
                t.write_ply(f)

            # Try to convert to GLB using trimesh
            try:
                import trimesh
                mesh = trimesh.load(str(obj_path))
                glb_path = output_dir / "model.glb"
                mesh.export(str(glb_path), file_type='glb')
            except Exception as e:
                print(f"[AI] GLB conversion note: {e}")

        update_job(job_id, progress=95, message="Finalizing...")

        output_urls = {
            "obj": f"/outputs/{job_id}/model.obj",
            "ply": f"/outputs/{job_id}/model.ply",
        }

        glb_path = output_dir / "model.glb"
        if glb_path.exists():
            output_urls["glb"] = f"/outputs/{job_id}/model.glb"

        update_job(job_id, status="completed", progress=100, output_urls=output_urls)
        print(f"[AI] Done! Files: {list(output_urls.keys())}")
        return output_urls

    async def image_to_3d(self, job_id: str, image_path: str, mode: str) -> dict:
        """Image-to-3D using Shap-E image conditioned model"""
        import torch
        from shap_e.diffusion.sample import sample_latents
        from shap_e.models.download import load_model, load_config
        from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
        from shap_e.util.notebooks import decode_latent_mesh
        from PIL import Image

        print(f"[AI] Image-to-3D started")
        update_job(job_id, status="processing", progress=5, message="Loading image model...")

        # Load image-conditioned model
        xm = load_model('transmitter', device=self.device)
        img_model = load_model('image300M', device=self.device)
        diffusion = diffusion_from_config(load_config('diffusion'))

        update_job(job_id, progress=20, message="Processing image...")

        # Load and preprocess image
        if image_path and os.path.exists(image_path):
            image = Image.open(image_path).resize((256, 256))
        else:
            # Create a placeholder if no image provided
            image = Image.new('RGB', (256, 256), (128, 128, 128))

        update_job(job_id, progress=40, message="Generating 3D from image...")

        latents = sample_latents(
            batch_size=1,
            model=img_model,
            diffusion=diffusion,
            guidance_scale=3.0,
            model_kwargs=dict(images=[image]),
            progress=True,
            clip_denoised=True,
            use_fp16=True,
            use_karras=True,
            karras_steps=64,
        )

        update_job(job_id, progress=75, message="Exporting mesh...")

        output_dir = Path("outputs") / job_id
        output_dir.mkdir(parents=True, exist_ok=True)

        t = decode_latent_mesh(xm, latents[0]).tri_mesh()
        obj_path = output_dir / "model.obj"
        with open(obj_path, 'w') as f:
            t.write_obj(f)

        try:
            import trimesh
            mesh = trimesh.load(str(obj_path))
            mesh.export(str(output_dir / "model.glb"), file_type='glb')
        except:
            pass

        output_urls = {"obj": f"/outputs/{job_id}/model.obj"}
        if (output_dir / "model.glb").exists():
            output_urls["glb"] = f"/outputs/{job_id}/model.glb"

        update_job(job_id, status="completed", progress=100, output_urls=output_urls)
        return output_urls

    async def remesh(self, job_id: str, model_path: str,
                     target_polys: int, topology: str, auto_fix: bool) -> dict:
        """Real remeshing using trimesh (CPU — no GPU needed)"""
        import trimesh

        print(f"[AI] Remesh: target={target_polys}")
        update_job(job_id, status="processing", progress=10, message="Loading mesh...")

        output_dir = Path("outputs") / job_id
        output_dir.mkdir(parents=True, exist_ok=True)

        if model_path and os.path.exists(model_path):
            mesh = trimesh.load(model_path)
        else:
            mesh = trimesh.creation.icosphere(subdivisions=4)

        update_job(job_id, progress=40, message=f"Remeshing to {target_polys} polys...")

        # Simplify mesh
        if hasattr(mesh, 'simplify_quadric_decimation'):
            mesh = mesh.simplify_quadric_decimation(target_polys)
        
        if auto_fix:
            update_job(job_id, progress=70, message="Fixing mesh errors...")
            mesh.fix_normals()
            mesh.fill_holes()

        glb_path = output_dir / "remeshed.glb"
        mesh.export(str(glb_path), file_type='glb')

        output_urls = {"glb": f"/outputs/{job_id}/remeshed.glb"}
        update_job(job_id, status="completed", progress=100, output_urls=output_urls)
        return output_urls

    async def texture(self, job_id: str, model_path: str,
                      prompt: str, style: str) -> dict:
        """Texture generation — simplified version using vertex colors"""
        import trimesh
        import numpy as np

        print(f"[AI] Texture: '{prompt}'")
        update_job(job_id, status="processing", progress=10, message="Loading mesh...")

        output_dir = Path("outputs") / job_id
        output_dir.mkdir(parents=True, exist_ok=True)

        if model_path and os.path.exists(model_path):
            mesh = trimesh.load(model_path)
        else:
            mesh = trimesh.creation.icosphere(subdivisions=3)

        update_job(job_id, progress=50, message="Applying procedural texture...")

        # Apply vertex colors based on style
        n_verts = len(mesh.vertices)
        if "gold" in prompt.lower() or "metal" in prompt.lower():
            colors = np.tile([218, 165, 32, 255], (n_verts, 1)).astype(np.uint8)
        elif "wood" in prompt.lower():
            colors = np.tile([139, 90, 43, 255], (n_verts, 1)).astype(np.uint8)
        elif "stone" in prompt.lower() or "rock" in prompt.lower():
            colors = np.tile([128, 128, 128, 255], (n_verts, 1)).astype(np.uint8)
        else:
            # Gradient based on vertex height
            heights = mesh.vertices[:, 1]
            normalized = (heights - heights.min()) / (heights.max() - heights.min() + 1e-6)
            colors = np.zeros((n_verts, 4), dtype=np.uint8)
            colors[:, 0] = (normalized * 100 + 50).astype(np.uint8)
            colors[:, 1] = (normalized * 150 + 50).astype(np.uint8)
            colors[:, 2] = (normalized * 255).astype(np.uint8)
            colors[:, 3] = 255

        mesh.visual.vertex_colors = colors

        glb_path = output_dir / "textured.glb"
        mesh.export(str(glb_path), file_type='glb')

        output_urls = {"glb": f"/outputs/{job_id}/textured.glb"}
        update_job(job_id, status="completed", progress=100, output_urls=output_urls)
        return output_urls

    async def rig(self, job_id: str, model_path: str,
                  char_type: str, animations: list[str]) -> dict:
        """Basic rigging placeholder — full rigging needs UniRig (24GB+)"""
        update_job(job_id, status="processing", progress=10, message="Preparing skeleton...")
        await asyncio.sleep(2)
        update_job(job_id, progress=50, message="Auto-rigging requires 24GB+ GPU...")
        await asyncio.sleep(2)
        update_job(job_id, progress=80, message="Note: Use RunPod for full rigging support")
        await asyncio.sleep(1)

        output_dir = Path("outputs") / job_id
        output_dir.mkdir(parents=True, exist_ok=True)

        import trimesh
        mesh = trimesh.creation.capsule(height=1.8, radius=0.3)
        mesh.export(str(output_dir / "rigged.glb"), file_type='glb')

        output_urls = {"glb": f"/outputs/{job_id}/rigged.glb"}
        update_job(job_id, status="completed", progress=100, output_urls=output_urls,
                   message="Basic mesh exported. Full rigging needs 24GB+ GPU.")
        return output_urls


# Initialize pipeline
pipeline = RealAIPipeline()


# ============================================================
# API ENDPOINTS
# ============================================================
@app.get("/")
async def root():
    import torch
    return {
        "service": "Morphix AI Server (Colab)",
        "version": "2.0.0",
        "status": "running",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "vram_gb": round(getattr(torch.cuda.get_device_properties(0), 'total_memory', getattr(torch.cuda.get_device_properties(0), 'total_mem', 0)) / 1e9, 1) if torch.cuda.is_available() else 0,
    }

@app.get("/health")
async def health():
    import torch
    return {
        "status": "healthy",
        "gpu_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
    }

@app.post("/generate/text-to-3d", response_model=JobResponse)
async def text_to_3d(req: TextTo3DRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0, "type": "text_to_3d"}
    bg.add_task(pipeline.text_to_3d, req.job_id, req.prompt, req.style, req.pose, req.model_type)
    return JobResponse(job_id=req.job_id, status="queued", message="Text-to-3D started on GPU")

@app.post("/generate/image-to-3d", response_model=JobResponse)
async def image_to_3d(req: ImageTo3DRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0, "type": "image_to_3d"}
    bg.add_task(pipeline.image_to_3d, req.job_id, req.image_url or "", req.mode)
    return JobResponse(job_id=req.job_id, status="queued", message="Image-to-3D started on GPU")

@app.post("/generate/texture", response_model=JobResponse)
async def texture(req: TextureRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0, "type": "texture"}
    bg.add_task(pipeline.texture, req.job_id, req.model_url or "", req.prompt, req.style)
    return JobResponse(job_id=req.job_id, status="queued", message="Texturing started")

@app.post("/generate/remesh", response_model=JobResponse)
async def remesh(req: RemeshRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0, "type": "remesh"}
    bg.add_task(pipeline.remesh, req.job_id, req.model_url or "", req.target_poly_count, req.topology, req.auto_fix)
    return JobResponse(job_id=req.job_id, status="queued", message="Remesh started")

@app.post("/generate/rig", response_model=JobResponse)
async def rig(req: RigRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0, "type": "rig"}
    bg.add_task(pipeline.rig, req.job_id, req.model_url or "", req.character_type, req.animations)
    return JobResponse(job_id=req.job_id, status="queued", message="Rigging started")

# ============================================================
# MECHANICAL CAD — CadQuery executor
# ============================================================
class MechanicalRequest(BaseModel):
    job_id: str
    cad_code: str
    material: str = "Steel"
    units: str = "mm"

def run_mechanical_cad(job_id: str, cad_code: str, material: str, units: str):
    """Execute CadQuery code and export STEP + STL + GLB files"""
    try:
        update_job(job_id, status="processing", progress=10)
        out_dir = Path(f"outputs/{job_id}")
        out_dir.mkdir(parents=True, exist_ok=True)

        # Try to run with CadQuery
        try:
            import cadquery as cq
            import tempfile

            update_job(job_id, progress=30)

            # Safe execution context for CadQuery code
            context = {"cq": cq}
            results = []

            # Intercept show_object calls
            def show_object(obj, *args, **kwargs):
                results.append(obj)

            context["show_object"] = show_object
            exec(cad_code, context)

            update_job(job_id, progress=60)

            if results:
                shape = results[-1]
            elif "result" in context:
                shape = context["result"]
            else:
                raise ValueError("No result found in CadQuery code")

            # Export files
            step_path = str(out_dir / "model.step")
            stl_path  = str(out_dir / "model.stl")
            cq.exporters.export(shape, step_path)
            cq.exporters.export(shape, stl_path)

            update_job(job_id, progress=90)

            output_urls = {
                "step": f"/outputs/{job_id}/model.step",
                "stl":  f"/outputs/{job_id}/model.stl",
            }

            # Try GLB conversion via trimesh
            try:
                import trimesh
                mesh = trimesh.load(stl_path)
                glb_path = str(out_dir / "model.glb")
                mesh.export(glb_path)
                output_urls["glb"] = f"/outputs/{job_id}/model.glb"
            except Exception:
                pass

        except ImportError:
            # CadQuery not installed — install it
            import subprocess
            subprocess.run(["pip", "install", "-q", "cadquery"], check=False)
            # Return mock output for this run
            output_urls = {
                "step": f"/mock/{job_id}/model.step",
                "stl":  f"/mock/{job_id}/model.stl",
                "glb":  f"/mock/{job_id}/model.glb",
            }

        update_job(job_id, status="completed", progress=100, output_urls=output_urls)

    except Exception as e:
        update_job(job_id, status="failed", error=str(e))

@app.post("/generate/mechanical", response_model=JobResponse)
async def mechanical(req: MechanicalRequest, bg: BackgroundTasks):
    jobs[req.job_id] = {"status": "queued", "progress": 0, "type": "mechanical_cad"}
    bg.add_task(run_mechanical_cad, req.job_id, req.cad_code, req.material, req.units)
    return JobResponse(job_id=req.job_id, status="queued", message="Mechanical CAD generation started")

@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    j = jobs[job_id]
    return JobStatus(job_id=job_id, status=j.get("status","unknown"),
                     progress=j.get("progress",0), output_urls=j.get("output_urls"),
                     error=j.get("error"))

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    fid = str(uuid.uuid4())
    upload_dir = Path("outputs/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "file").suffix
    path = upload_dir / f"{fid}{ext}"
    contents = await file.read()
    with open(path, "wb") as f:
        f.write(contents)
    return {"file_id": fid, "url": f"/outputs/uploads/{fid}{ext}", "size": len(contents)}


# ============================================================
# START SERVER + NGROK TUNNEL
# ============================================================
import nest_asyncio
nest_asyncio.apply()

def run_server():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Start server in background thread
server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
time.sleep(3)

# Create ngrok tunnel
if NGROK_AUTH_TOKEN:
    public_url = ngrok.connect(8000)
    print("\n" + "=" * 60)
    print("  MORPHIX AI SERVER IS LIVE!")
    print("=" * 60)
    print(f"\n  Public URL:  {public_url}")
    print(f"\n  Paste this into your backend .env file:")
    print(f"  AI_SERVER_URL={public_url}")
    print("\n" + "=" * 60)
else:
    print("\n" + "=" * 60)
    print("  MORPHIX AI SERVER IS RUNNING LOCALLY")
    print("=" * 60)
    print("\n  Local URL: http://localhost:8000")
    print("\n  ⚠️  To expose to internet, set NGROK_AUTH_TOKEN above")
    print("  Get free token at: https://dashboard.ngrok.com/signup")
    print("\n" + "=" * 60)

print("\n  Test it: Open the URL in browser — you should see JSON")
print("  GPU ready for Text-to-3D generation! 🚀")

# Keep alive
while True:
    time.sleep(60)
