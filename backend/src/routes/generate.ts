import { Router, Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { config } from "../config";
import { GenerationType } from "@prisma/client";
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
  type: "MECHANICAL_CAD" | "ARCHITECTURE"
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
    const allowedTypes: GenerationType[] = ["MECHANICAL_CAD", "ARCHITECTURE"];

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where: {
          userId: req.user!.userId,
          type: { in: allowedTypes },
        },
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
      prisma.generation.count({
        where: {
          userId: req.user!.userId,
          type: { in: allowedTypes },
        },
      }),
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
  rooms: z
    .object({
      bedroom: z.number().default(3),
      bathroom: z.number().default(2),
      kitchen: z.number().default(1),
      garage: z.number().default(1),
      garden: z.number().default(1),
    })
    .optional(),
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

// ==========================================
// POST /api/generate/upload
// ==========================================
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp", ".glb", ".obj", ".stl", ".dxf", ".step", ".iges"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.post("/upload", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename, size: req.file.size });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
