import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { optionalAuth } from "../middleware/auth";

const router = Router();

// ==========================================
// GET /api/assets — List user's assets (auth required)
// ==========================================
router.get("/", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const format = req.query.format as string | undefined;

    const where = {
      userId: req.user!.userId,
      ...(format ? { fileFormat: format.toUpperCase() } : {}),
    };

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          generation: {
            select: { type: true, prompt: true, styleOption: true },
          },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    res.json({
      assets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("List assets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// GET /api/assets/:id — Get single asset
// ==========================================
router.get("/:id", authMiddleware, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const asset = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      include: {
        generation: {
          select: {
            type: true,
            prompt: true,
            styleOption: true,
            outputUrls: true,
            createdAt: true,
          },
        },
      },
    });

    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    res.json(asset);
  } catch (error) {
    console.error("Get asset error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// DELETE /api/assets/:id
// ==========================================
router.delete("/:id", authMiddleware, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const asset = await prisma.asset.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    // TODO: Delete from S3/R2
    await prisma.asset.delete({ where: { id: asset.id } });

    res.json({ message: "Asset deleted" });
  } catch (error) {
    console.error("Delete asset error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// PATCH /api/assets/:id — Update (rename, toggle public)
// ==========================================
router.patch("/:id", authMiddleware, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const asset = await prisma.asset.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    const { name, isPublic } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updated = await prisma.asset.update({
      where: { id: asset.id },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    console.error("Update asset error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// GET /api/assets/:id/download — Signed download URL
// ==========================================
router.get("/:id/download", authMiddleware, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const asset = await prisma.asset.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    // TODO: Generate presigned S3 URL
    res.json({
      downloadUrl: asset.fileUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// Community Gallery
// ==========================================

// GET /api/community/gallery — Public gallery
router.get("/community/gallery", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const sort = (req.query.sort as string) || "latest";

    const orderBy = sort === "likes"
      ? { likes: "desc" as const }
      : sort === "downloads"
        ? { downloads: "desc" as const }
        : { createdAt: "desc" as const };

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where: { isPublic: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, avatarUrl: true } },
          generation: { select: { type: true, styleOption: true } },
        },
      }),
      prisma.asset.count({ where: { isPublic: true } }),
    ]);

    res.json({
      assets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Gallery error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/like/:id
router.post("/community/like/:id", authMiddleware, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const asset = await prisma.asset.findFirst({
      where: { id: req.params.id, isPublic: true },
    });

    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    const updated = await prisma.asset.update({
      where: { id: asset.id },
      data: { likes: { increment: 1 } },
    });

    res.json({ likes: updated.likes });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
