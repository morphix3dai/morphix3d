/**
 * AI Pipeline: Creative 3D
 * Primary  : Local AI server (http://localhost:8000) — trimesh + Shap-E
 * Secondary: Meshy API (if MESHY_API_KEY is set)
 * Storage  : Cloudflare R2 (auto-uploads for permanent cloud storage)
 * Fallback : None — real files always produced by AI server
 */

import { prisma } from "../../lib/prisma";
import { uploadJobOutputs, R2_ENABLED } from "../storage/r2";

const AI_SERVER = process.env.AI_SERVER_URL || "http://localhost:8000";
const MESHY_API_KEY = process.env.MESHY_API_KEY || "";
const MESHY_BASE = "https://api.meshy.ai/openapi/v2";

if (R2_ENABLED) {
  console.log("[Creative3D] R2 storage enabled — outputs will be uploaded to Cloudflare");
} else {
  console.log("[Creative3D] R2 not configured — using local AI server URLs");
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function updateJob(id: string, data: Record<string, unknown>) {
  return prisma.generation.update({ where: { id }, data }).catch(() => {});
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Local AI Server pipeline ─────────────────────────────────────────────────

async function callAIServer(
  endpoint: string,
  body: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetch(`${AI_SERVER}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function pollAIServer(
  generationId: string,
  aiJobId: string,
  maxWait = 900_000  // 15 min — first run downloads Shap-E weights (~1.8GB)
): Promise<Record<string, string>> {
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    await sleep(2000);

    try {
      const res = await fetch(`${AI_SERVER}/jobs/${aiJobId}`, {
        signal: AbortSignal.timeout(5_000),
      });

      if (!res.ok) continue;

      const job = (await res.json()) as {
        status: string;
        progress: number;
        output_urls?: { glb?: string; obj?: string; thumbnail?: string };
        error?: string;
      };

      // Sync progress to DB
      await updateJob(generationId, { progress: job.progress });

      if (job.status === "completed" && job.output_urls) {
        // Convert relative AI server paths to full URLs
        const base = AI_SERVER;
        return {
          glb: job.output_urls.glb
            ? `${base}${job.output_urls.glb}`
            : "",
          obj: job.output_urls.obj
            ? `${base}${job.output_urls.obj}`
            : "",
          thumbnail: job.output_urls.thumbnail
            ? `${base}${job.output_urls.thumbnail}`
            : "",
        };
      }

      if (job.status === "failed") {
        throw new Error(job.error || "AI server generation failed");
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("AI server")) throw e;
      // Network error — retry
    }
  }

  throw new Error("Generation timed out after 5 minutes");
}

// ─── Meshy fallback ───────────────────────────────────────────────────────────

async function meshyPost(endpoint: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${MESHY_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MESHY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Meshy API error: ${res.status} ${await res.text()}`);
  return res.json() as Promise<Record<string, unknown>>;
}

async function meshyGet(endpoint: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${MESHY_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${MESHY_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Meshy API error: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

async function pollMeshyTask(
  generationId: string,
  taskId: string,
  maxWait = 300_000
): Promise<Record<string, string>> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await sleep(5000);
    const task = (await meshyGet(`/tasks/${taskId}`)) as {
      status: string;
      progress?: number;
      model_urls?: { glb?: string; fbx?: string; obj?: string };
      thumbnail_url?: string;
      task_error?: { message?: string };
    };

    await updateJob(generationId, { progress: task.progress ?? 0 });

    if (task.status === "SUCCEEDED") {
      return {
        glb: task.model_urls?.glb || "",
        obj: task.model_urls?.obj || "",
        thumbnail: task.thumbnail_url || "",
      };
    }
    if (task.status === "FAILED" || task.status === "EXPIRED") {
      throw new Error(task.task_error?.message || "Meshy generation failed");
    }
  }
  throw new Error("Meshy timed out");
}

// ─── TEXT TO 3D ───────────────────────────────────────────────────────────────

export async function runTextTo3D(
  generationId: string,
  prompt: string,
  style: string
): Promise<void> {
  try {
    await updateJob(generationId, { status: "PROCESSING", progress: 5 });

    let outputUrls: Record<string, string>;

    // Try Meshy first (paid, highest quality)
    if (MESHY_API_KEY) {
      console.log("[Creative3D] Using Meshy API");
      const artStyle =
        style === "cartoon" ? "cartoon" : style === "lowpoly" ? "low-poly" : "realistic";
      const task = (await meshyPost("/text-to-3d", {
        mode: "preview",
        prompt,
        art_style: artStyle,
        negative_prompt: "low quality, blurry",
      })) as { result: string };
      await updateJob(generationId, { progress: 10 });
      outputUrls = await pollMeshyTask(generationId, task.result);
    } else {
      // Use our local AI server (trimesh + Shap-E)
      console.log(`[Creative3D] Sending to AI server: '${prompt}'`);
      const aiJobId = generationId; // reuse generation ID as AI job ID
      const sent = await callAIServer("/generate/text-to-3d", {
        job_id: aiJobId,
        prompt,
        style,
      });

      if (!sent) {
        throw new Error("AI server unreachable. Please start ai-server/main.py");
      }

      await updateJob(generationId, { progress: 10 });
      outputUrls = await pollAIServer(generationId, aiJobId);
      // Upload to R2 for permanent cloud storage
      outputUrls = await uploadJobOutputs(generationId, AI_SERVER, outputUrls);
      console.log(`[Creative3D] AI server done: ${JSON.stringify(outputUrls)}`);
    }

    await updateJob(generationId, {
      status: "COMPLETED",
      progress: 100,
      outputUrls,
      completedAt: new Date(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Creative3D] Text-to-3D failed:", msg);
    await updateJob(generationId, {
      status: "FAILED",
      errorMessage: msg,
      completedAt: new Date(),
    });
  }
}

// ─── IMAGE TO 3D ──────────────────────────────────────────────────────────────

export async function runImageTo3D(
  generationId: string,
  imageUrl: string
): Promise<void> {
  try {
    await updateJob(generationId, { status: "PROCESSING", progress: 5 });

    let outputUrls: Record<string, string>;

    if (MESHY_API_KEY && imageUrl) {
      const task = (await meshyPost("/image-to-3d", {
        image_url: imageUrl,
        enable_pbr: true,
      })) as { result: string };
      await updateJob(generationId, { progress: 10 });
      outputUrls = await pollMeshyTask(generationId, task.result);
    } else {
      const aiJobId = generationId;
      const sent = await callAIServer("/generate/image-to-3d", {
        job_id: aiJobId,
        image_url: imageUrl || "",
      });
      if (!sent) throw new Error("AI server unreachable");
      await updateJob(generationId, { progress: 10 });
      outputUrls = await pollAIServer(generationId, aiJobId);
    }

    await updateJob(generationId, {
      status: "COMPLETED",
      progress: 100,
      outputUrls,
      completedAt: new Date(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await updateJob(generationId, {
      status: "FAILED",
      errorMessage: msg,
      completedAt: new Date(),
    });
  }
}

// ─── AI TEXTURING ─────────────────────────────────────────────────────────────

export async function runTexture(
  generationId: string,
  modelUrl: string,
  prompt: string,
  style: string
): Promise<void> {
  try {
    await updateJob(generationId, { status: "PROCESSING", progress: 5 });

    let outputUrls: Record<string, string>;

    if (MESHY_API_KEY && modelUrl) {
      const task = (await meshyPost("/text-to-texture", {
        model_url: modelUrl,
        object_prompt: prompt,
        style_prompt: style,
        enable_original_uv: true,
        enable_pbr: true,
      })) as { result: string };
      await updateJob(generationId, { progress: 10 });
      outputUrls = await pollMeshyTask(generationId, task.result);
    } else {
      const aiJobId = generationId;
      const sent = await callAIServer("/generate/texture", {
        job_id: aiJobId,
        model_url: modelUrl || "",
        prompt,
        style,
      });
      if (!sent) throw new Error("AI server unreachable");
      await updateJob(generationId, { progress: 10 });
      outputUrls = await pollAIServer(generationId, aiJobId);
    }

    await updateJob(generationId, {
      status: "COMPLETED",
      progress: 100,
      outputUrls,
      completedAt: new Date(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await updateJob(generationId, {
      status: "FAILED",
      errorMessage: msg,
      completedAt: new Date(),
    });
  }
}
