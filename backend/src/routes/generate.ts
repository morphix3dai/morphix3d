import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { config } from "../config";
import { GenerationType } from "@prisma/client";
import { runTextTo3D, runImageTo3D, runTexture } from "../lib/pipelines/creative3d";
import { runMechanicalCAD } from "../lib/pipelines/mechanical";
import { runArchitecture } from "../lib/pipelines/architecture";

const router = Router();

// All generation routes require auth
router.use(authMiddleware);

// ==========================================
// Credit check helper
// ==========================================
async function checkAndDeductCredits(
  userId: string,
  type: GenerationType
): Promise<{ success: boolean; error?: string; creditsUsed: number }> {
  const creditsNeeded = config.credits[type];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user || user.credits < creditsNeeded) {
    return {
      success: false,
      error: `Insufficient credits. Need ${creditsNeeded}, have ${user?.credits || 0}`,
      creditsUsed: 0,
    };
  }

  // Deduct credits atomically
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: creditsNeeded } },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: -creditsNeeded,
        type: "USAGE",
        description: `${type} generation`,
      },
    }),
  ]);

  return { success: true, creditsUsed: creditsNeeded };
}

// ==========================================
// POST /api/generate/text-to-3d
// ==========================================
const textTo3dSchema = z.object({
  prompt: z.string().min(1).max(800),
  style: z.string().default("realistic"),
  pose: z.string().default("none"),
  modelType: z.string().default("standard"),
});

router.post("/text-to-3d", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = textTo3dSchema.parse(req.body);
    const userId = req.user!.userId;

    // Check credits
    const creditResult = await checkAndDeductCredits(userId, "TEXT_TO_3D");
    if (!creditResult.success) {
      res.status(402).json({ error: creditResult.error });
      return;
    }

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        userId,
        type: "TEXT_TO_3D",
        prompt: body.prompt,
        styleOption: body.style,
        poseOption: body.pose,
        modelType: body.modelType,
        creditsUsed: creditResult.creditsUsed,
        status: "QUEUED",
      },
    });

    // Fire real AI pipeline (non-blocking)
    runTextTo3D(generation.id, body.prompt, body.style).catch(console.error);

    res.status(201).json({
      jobId: generation.id,
      status: "QUEUED",
      creditsUsed: creditResult.creditsUsed,
      message: "Generation job queued successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error("Text-to-3D error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/generate/image-to-3d
// ==========================================
const imageTo3dSchema = z.object({
  imageUrl: z.string().url().optional(),
  mode: z.enum(["single", "multi"]).default("single"),
});

router.post("/image-to-3d", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = imageTo3dSchema.parse(req.body);
    const userId = req.user!.userId;

    const creditResult = await checkAndDeductCredits(userId, "IMAGE_TO_3D");
    if (!creditResult.success) {
      res.status(402).json({ error: creditResult.error });
      return;
    }

    const generation = await prisma.generation.create({
      data: {
        userId,
        type: "IMAGE_TO_3D",
        inputImageUrl: body.imageUrl,
        creditsUsed: creditResult.creditsUsed,
        status: "QUEUED",
      },
    });

    simulateGeneration(generation.id);

    res.status(201).json({
      jobId: generation.id,
      status: "QUEUED",
      creditsUsed: creditResult.creditsUsed,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error("Image-to-3D error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/generate/texture
// ==========================================
const textureSchema = z.object({
  modelUrl: z.string().url().optional(),
  prompt: z.string().min(1).max(500),
  style: z.string().default("realistic"),
});

router.post("/texture", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = textureSchema.parse(req.body);
    const userId = req.user!.userId;

    const creditResult = await checkAndDeductCredits(userId, "TEXTURE");
    if (!creditResult.success) {
      res.status(402).json({ error: creditResult.error });
      return;
    }

    const generation = await prisma.generation.create({
      data: {
        userId,
        type: "TEXTURE",
        prompt: body.prompt,
        styleOption: body.style,
        creditsUsed: creditResult.creditsUsed,
        status: "QUEUED",
      },
    });

    simulateGeneration(generation.id);

    res.status(201).json({
      jobId: generation.id,
      status: "QUEUED",
      creditsUsed: creditResult.creditsUsed,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error("Texture error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/generate/remesh
// ==========================================
router.post("/remesh", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const creditResult = await checkAndDeductCredits(userId, "REMESH");
    if (!creditResult.success) {
      res.status(402).json({ error: creditResult.error });
      return;
    }

    const generation = await prisma.generation.create({
      data: {
        userId,
        type: "REMESH",
        creditsUsed: creditResult.creditsUsed,
        status: "QUEUED",
      },
    });

    simulateGeneration(generation.id);

    res.status(201).json({ jobId: generation.id, status: "QUEUED", creditsUsed: creditResult.creditsUsed });
  } catch (error) {
    console.error("Remesh error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/generate/rig
// ==========================================
router.post("/rig", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const creditResult = await checkAndDeductCredits(userId, "RIG");
    if (!creditResult.success) {
      res.status(402).json({ error: creditResult.error });
      return;
    }

    const generation = await prisma.generation.create({
      data: {
        userId,
        type: "RIG",
        creditsUsed: creditResult.creditsUsed,
        status: "QUEUED",
      },
    });

    simulateGeneration(generation.id);

    res.status(201).json({ jobId: generation.id, status: "QUEUED", creditsUsed: creditResult.creditsUsed });
  } catch (error) {
    console.error("Rig error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// GET /api/generate/status/:id
// ==========================================
router.get("/status/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const generation = await prisma.generation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      select: {
        id: true,
        type: true,
        status: true,
        progress: true,
        prompt: true,
        outputUrls: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!generation) {
      res.status(404).json({ error: "Generation not found" });
      return;
    }

    res.json(generation);
  } catch (error) {
    console.error("Status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// GET /api/generate/history
// ==========================================
router.get("/history", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          status: true,
          prompt: true,
          styleOption: true,
          creditsUsed: true,
          outputUrls: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      prisma.generation.count({ where: { userId: req.user!.userId } }),
    ]);

    res.json({
      generations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// Send job to AI Server (Colab / local GPU)
// Falls back to mock simulation if AI server is unavailable
// ==========================================
async function simulateGeneration(generationId: string) {
  const aiServerUrl = process.env.AI_SERVER_URL || "http://localhost:8000";

  // Get generation details
  const gen = await prisma.generation.findUnique({
    where: { id: generationId },
    select: { type: true, prompt: true, styleOption: true, poseOption: true, modelType: true, inputImageUrl: true },
  });
  if (!gen) return;

  // Map generation type to AI server endpoint
  const endpointMap: Record<string, string> = {
    TEXT_TO_3D: "/generate/text-to-3d",
    IMAGE_TO_3D: "/generate/image-to-3d",
    TEXTURE: "/generate/texture",
    REMESH: "/generate/remesh",
    RIG: "/generate/rig",
  };

  const endpoint = endpointMap[gen.type] || "/generate/text-to-3d";

  // Build request body based on type
  const requestBody: Record<string, unknown> = { job_id: generationId };
  if (gen.prompt) requestBody.prompt = gen.prompt;
  if (gen.styleOption) requestBody.style = gen.styleOption;
  if (gen.poseOption) requestBody.pose = gen.poseOption;
  if (gen.modelType) requestBody.model_type = gen.modelType;
  if (gen.inputImageUrl) requestBody.image_url = gen.inputImageUrl;

  try {
    // Send job to AI server
    const response = await fetch(`${aiServerUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`AI Server responded with ${response.status}`);
    }

    console.log(`[AI] Job ${generationId} sent to ${aiServerUrl}${endpoint}`);

    // Poll AI server for progress
    let completed = false;
    let attempts = 0;
    const maxAttempts = 120; // 4 minutes max (120 * 2s)

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;

      try {
        const statusRes = await fetch(`${aiServerUrl}/jobs/${generationId}`);
        if (!statusRes.ok) continue;

        const status = await statusRes.json() as {
          status: string;
          progress: number;
          output_urls?: Record<string, string>;
          error?: string;
        };

        // Update progress in database
        await prisma.generation.update({
          where: { id: generationId },
          data: { status: "PROCESSING", progress: status.progress },
        });

        if (status.status === "completed") {
          // Build full output URLs (prepend AI server URL)
          const outputUrls: Record<string, string> = {};
          if (status.output_urls) {
            for (const [format, path] of Object.entries(status.output_urls)) {
              outputUrls[format] = `${aiServerUrl}${path}`;
            }
          }

          await prisma.generation.update({
            where: { id: generationId },
            data: {
              status: "COMPLETED",
              progress: 100,
              completedAt: new Date(),
              outputUrls: outputUrls,
            },
          });

          // Create asset record
          const genUser = await prisma.generation.findUnique({
            where: { id: generationId },
            select: { userId: true, prompt: true, type: true },
          });

          if (genUser) {
            await prisma.asset.create({
              data: {
                userId: genUser.userId,
                generationId,
                name: genUser.prompt?.slice(0, 50) || `${genUser.type} Model`,
                fileFormat: "GLB",
                fileUrl: outputUrls.glb || outputUrls.obj || "",
                fileSize: 0,
                thumbnailUrl: outputUrls.thumbnail || "",
              },
            });
          }

          console.log(`[AI] Job ${generationId} COMPLETED`);
          completed = true;
        } else if (status.status === "failed" || status.error) {
          await prisma.generation.update({
            where: { id: generationId },
            data: { status: "FAILED", errorMessage: status.error || "AI generation failed" },
          });
          console.error(`[AI] Job ${generationId} FAILED: ${status.error}`);
          completed = true;
        }
      } catch {
        // Network error during polling — continue trying
      }
    }

    if (!completed) {
      await prisma.generation.update({
        where: { id: generationId },
        data: { status: "FAILED", errorMessage: "Generation timed out" },
      });
    }
  } catch (error) {
    // AI server unreachable — fall back to mock simulation
    console.warn(`[AI] Server unreachable at ${aiServerUrl}, using mock simulation`);
    await mockSimulation(generationId);
  }
}

// Fallback mock simulation (used when AI server is not running)
async function mockSimulation(generationId: string) {
  const steps = [10, 25, 45, 65, 80, 95, 100];
  for (const progress of steps) {
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 500));

    if (progress === 100) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: "COMPLETED",
          progress: 100,
          completedAt: new Date(),
          outputUrls: {
            glb: `/mock/${generationId}/model.glb`,
            obj: `/mock/${generationId}/model.obj`,
          },
        },
      });

      const gen = await prisma.generation.findUnique({
        where: { id: generationId },
        select: { userId: true, prompt: true, type: true },
      });

      if (gen) {
        await prisma.asset.create({
          data: {
            userId: gen.userId,
            generationId,
            name: gen.prompt?.slice(0, 50) || `${gen.type} Model`,
            fileFormat: "GLB",
            fileUrl: `/mock/${generationId}/model.glb`,
            fileSize: Math.floor(Math.random() * 10000000) + 1000000,
          },
        });
      }
    } else {
      await prisma.generation.update({
        where: { id: generationId },
        data: { status: "PROCESSING", progress },
      });
    }
  }
}

// ==========================================
// POST /api/generate/mechanical
// ==========================================
const mechanicalSchema = z.object({
  prompt: z.string().min(1).max(800),
  partType: z.string().default("precision"),
  material: z.string().default("Steel"),
  units: z.string().default("mm"),
});

router.post("/mechanical", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = mechanicalSchema.parse(req.body);
    const userId = req.user!.userId;

    const creditResult = await checkAndDeductCredits(userId, "MECHANICAL_CAD");
    if (!creditResult.success) {
      res.status(402).json({ error: creditResult.error });
      return;
    }

    const generation = await prisma.generation.create({
      data: {
        userId,
        type: "MECHANICAL_CAD",
        prompt: body.prompt,
        status: "QUEUED",
        creditsUsed: creditResult.creditsUsed,
        styleOption: body.partType,
        modelType: body.material,
      },
    });

    // Fire real Mechanical CAD pipeline (non-blocking)
    runMechanicalCAD(generation.id, body.prompt, body.partType, body.material, body.units).catch(console.error);

    res.json({
      jobId: generation.id,
      status: "queued",
      creditsUsed: creditResult.creditsUsed,
      message: "Mechanical CAD generation started",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: err.errors });
      return;
    }
    console.error("Mechanical generation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/generate/architecture
// ==========================================
const architectureSchema = z.object({
  prompt: z.string().min(1).max(800),
  houseStyle: z.string().default("modern"),
  sqft: z.number().default(1500),
  floors: z.number().default(1),
  rooms: z.object({
    bedroom: z.number().default(3),
    bathroom: z.number().default(2),
    kitchen: z.number().default(1),
    garage: z.number().default(1),
    garden: z.number().default(1),
  }).optional(),
});

router.post("/architecture", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = architectureSchema.parse(req.body);
    const userId = req.user!.userId;

    const creditResult = await checkAndDeductCredits(userId, "ARCHITECTURE");
    if (!creditResult.success) {
      res.status(402).json({ error: creditResult.error });
      return;
    }

    const generation = await prisma.generation.create({
      data: {
        userId,
        type: "ARCHITECTURE",
        prompt: body.prompt,
        status: "QUEUED",
        creditsUsed: creditResult.creditsUsed,
        styleOption: body.houseStyle,
        modelType: `${body.sqft}sqft_${body.floors}floor`,
      },
    });

    // Fire real Architecture pipeline (non-blocking)
    runArchitecture(
      generation.id,
      body.prompt,
      body.houseStyle,
      body.sqft,
      body.floors,
      body.rooms || { bedroom: 3, bathroom: 2, kitchen: 1, garage: 1, garden: 1 }
    ).catch(console.error);

    res.json({
      jobId: generation.id,
      status: "queued",
      creditsUsed: creditResult.creditsUsed,
      message: "Architecture generation started",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: err.errors });
      return;
    }
    console.error("Architecture generation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

