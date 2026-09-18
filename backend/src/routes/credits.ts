import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { config } from "../config";

const router = Router();

router.use(authMiddleware);

// ==========================================
// GET /api/credits/balance
// ==========================================
router.get("/balance", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { credits: true, plan: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      credits: user.credits,
      plan: user.plan,
      costs: config.credits,
    });
  } catch (error) {
    console.error("Balance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// GET /api/credits/history
// ==========================================
router.get("/history", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.creditTransaction.count({ where: { userId: req.user!.userId } }),
    ]);

    res.json({
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Credit history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/credits/purchase (Razorpay stub)
// ==========================================
router.post("/purchase", async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan } = req.body;

    // Razorpay integration stub
    // In production, this creates a Razorpay order and returns order_id
    const plans: Record<string, { amount: number; credits: number; name: string }> = {
      pro_monthly:  { amount: 99900,  credits: 2000, name: "Pro Monthly" },  // ₹999 in paise
      credits_100:  { amount: 9900,   credits: 100,  name: "100 Credits" },  // ₹99
      credits_500:  { amount: 29900,  credits: 500,  name: "500 Credits" },  // ₹299
      credits_1000: { amount: 49900,  credits: 1000, name: "1000 Credits" }, // ₹499
      credits_2000: { amount: 79900,  credits: 2000, name: "2000 Credits" }, // ₹799
    };

    // Accept any case (pro_monthly, PRO_MONTHLY, Pro_Monthly all work)
    const planKey = plan?.toLowerCase?.() ?? "";
    const selectedPlan = plans[planKey];
    if (!selectedPlan) {
      res.status(400).json({ error: `Invalid plan: '${plan}'. Valid plans: ${Object.keys(plans).join(", ")}` });
      return;
    }

    // Mock Razorpay order creation
    const orderId = `order_mock_${Date.now()}`;

    res.json({
      orderId,
      amount: selectedPlan.amount,
      currency: "INR",
      credits: selectedPlan.credits,
      planName: selectedPlan.name,
      keyId: config.razorpay.keyId || "rzp_test_mock",
    });
  } catch (error) {
    console.error("Purchase error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/credits/verify (Razorpay verify stub)
// ==========================================
router.post("/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpayPaymentId, razorpayOrderId, credits } = req.body;
    const userId = req.user!.userId;

    // In production: verify Razorpay signature using crypto
    // For now, just add credits
    const creditsToAdd = parseInt(credits) || 500;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: creditsToAdd } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount: creditsToAdd,
          type: "PURCHASE",
          razorpayPaymentId: razorpayPaymentId || "mock",
          razorpayOrderId: razorpayOrderId || "mock",
          description: `Purchased ${creditsToAdd} credits`,
        },
      }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    res.json({
      success: true,
      newBalance: user?.credits,
      creditsAdded: creditsToAdd,
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
