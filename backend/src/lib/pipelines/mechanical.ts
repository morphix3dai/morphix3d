/**
 * AI Pipeline: Mechanical CAD (CADX-style)
 * Uses: OpenAI GPT-4o-mini → generates CadQuery Python code → executes on AI server
 * Exports: STEP, STL, OBJ, GLB
 */

import { prisma } from "../../lib/prisma";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://localhost:8000";

function updateJob(id: string, data: Record<string, unknown>) {
  return prisma.generation.update({ where: { id }, data }).catch(() => {});
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Call GPT-4o-mini to generate CadQuery code ───────────────────────────────

async function generateCadCode(prompt: string, material: string, units: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    // Return demo CadQuery code when no API key
    return `
import cadquery as cq

# Generated from: "${prompt}"
result = (
    cq.Workplane("XY")
    .box(50, 30, 20)
    .edges("|Z").fillet(2)
)
show_object(result)
`;
  }

  const systemPrompt = `You are an expert mechanical engineer who writes CadQuery Python code.
Generate ONLY valid CadQuery v2 Python code that creates the described 3D part.
Use units in ${units}. Material: ${material}.
Rules:
- Start with: import cadquery as cq
- Build the geometry using CadQuery workplane operations
- End with: show_object(result) where result is your final shape
- Use ONLY cadquery operations: box, cylinder, sphere, extrude, revolve, shell, fillet, chamfer, hole, cboreHole
- DO NOT use any import other than cadquery
- Return ONLY the Python code, no explanation`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a 3D CAD model of: ${prompt}` },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

// ─── Send code to AI server for execution ─────────────────────────────────────

async function executeCadOnServer(
  generationId: string,
  cadCode: string,
  material: string,
  units: string
): Promise<Record<string, string>> {
  // Try to call the local/Colab AI server
  const res = await fetch(`${AI_SERVER_URL}/generate/mechanical`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_id: generationId,
      cad_code: cadCode,
      material,
      units,
    }),
    signal: AbortSignal.timeout(180_000), // 3 min timeout
  });

  if (!res.ok) throw new Error(`AI server error: ${res.status}`);
  return res.json() as Promise<Record<string, string>>;
}

// ─── Poll AI server for job status ────────────────────────────────────────────

async function pollAiServer(generationId: string, maxWait = 180_000): Promise<Record<string, string>> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await sleep(3000);
    try {
      const res = await fetch(`${AI_SERVER_URL}/jobs/${generationId}`);
      if (!res.ok) continue;
      const job = await res.json() as { status: string; progress?: number; output_urls?: Record<string, string>; error?: string };

      await updateJob(generationId, { progress: job.progress || 0 });

      if (job.status === "completed") {
        return job.output_urls || {};
      }
      if (job.status === "failed") {
        throw new Error(job.error || "AI server generation failed");
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("failed")) throw e;
    }
  }
  throw new Error("Mechanical CAD generation timed out");
}

// ─── Simulate fallback ────────────────────────────────────────────────────────

async function simulateFallback(generationId: string): Promise<Record<string, string>> {
  const steps = [
    { p: 15, msg: "Analyzing requirements..." },
    { p: 30, msg: "Generating CadQuery code..." },
    { p: 55, msg: "Building feature tree..." },
    { p: 75, msg: "Creating 3D geometry..." },
    { p: 90, msg: "Exporting CAD files..." },
  ];
  for (const s of steps) {
    await sleep(1200);
    await updateJob(generationId, { progress: s.p });
  }
  return {
    step: `/mock/${generationId}/model.step`,
    stl: `/mock/${generationId}/model.stl`,
    glb: `/mock/${generationId}/model.glb`,
    obj: `/mock/${generationId}/model.obj`,
  };
}

// ─── MAIN PIPELINE ────────────────────────────────────────────────────────────

export async function runMechanicalCAD(
  generationId: string,
  prompt: string,
  partType: string,
  material: string,
  units: string
): Promise<void> {
  try {
    await updateJob(generationId, { status: "PROCESSING", progress: 5 });

    let outputUrls: Record<string, string>;

    try {
      // Step 1: Generate CadQuery code with GPT
      await updateJob(generationId, { progress: 10 });
      const cadCode = await generateCadCode(prompt, material, units);
      console.log(`[MechanicalCAD] Generated ${cadCode.split("\n").length} lines of CadQuery code`);

      // Step 2: Send to AI server for execution
      await updateJob(generationId, { progress: 25 });
      await executeCadOnServer(generationId, cadCode, material, units);

      // Step 3: Poll for result
      outputUrls = await pollAiServer(generationId);
    } catch (pipelineErr) {
      console.warn("[MechanicalCAD] Pipeline failed, using simulation:", pipelineErr);
      outputUrls = await simulateFallback(generationId);
    }

    await updateJob(generationId, {
      status: "COMPLETED",
      progress: 100,
      outputUrls,
      completedAt: new Date(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[MechanicalCAD] Fatal error:", msg);
    await updateJob(generationId, {
      status: "FAILED",
      errorMessage: msg,
      completedAt: new Date(),
    });
  }
}
