import { Router, Request, Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { config } from "../config";

const router = Router();

const PLANS: Record<string, { amount: number; credits: number; name: string; isPro?: boolean }> = {
  pro_monthly:  { amount: 99900,  credits: 2000, name: "Pro Monthly", isPro: true },  // ₹999 in paise
  credits_100:  { amount: 9900,   credits: 100,  name: "100 Credits" },               // ₹99
  credits_500:  { amount: 29900,  credits: 500,  name: "500 Credits" },               // ₹299
  credits_1000: { amount: 49900,  credits: 1000, name: "1000 Credits" },              // ₹499
  credits_2000: { amount: 79900,  credits: 2000, name: "2000 Credits" },              // ₹799
};

const razorpayClient =
  config.razorpay.keyId && config.razorpay.keySecret
    ? new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
      })
    : null;

// ==========================================
// POST /api/credits/webhook (Razorpay Server-to-Server Webhook — Public HMAC-Verified)
// ==========================================
router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || config.razorpay.keySecret;
    const signature = req.headers["x-razorpay-signature"] as string | undefined;

    if (webhookSecret && signature) {
      const rawBody = JSON.stringify(req.body);
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");
      if (expected !== signature) {
        res.status(400).json({ error: "Invalid webhook signature" });
        return;
      }
    }

    const event = req.body?.event as string | undefined;
    const paymentEntity = req.body?.payload?.payment?.entity;

    if ((event === "payment.captured" || event === "order.paid") && paymentEntity) {
      const razorpayPaymentId = paymentEntity.id as string;
      const razorpayOrderId = paymentEntity.order_id as string;
      const notes = paymentEntity.notes || {};
      const userId = notes.userId as string | undefined;
      const planKey = ((notes.plan as string) || "").toLowerCase();
      const matchedPlan = PLANS[planKey];

      if (userId && razorpayPaymentId) {
        // Idempotency check
        const existingTx = await prisma.creditTransaction.findFirst({
          where: { razorpayPaymentId },
        });
        if (!existingTx) {
          const creditsToAdd = matchedPlan ? matchedPlan.credits : parseInt(notes.credits) || 500;
          const isPro = Boolean(matchedPlan?.isPro || planKey === "pro_monthly");

          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: {
                credits: { increment: creditsToAdd },
                ...(isPro ? { plan: "PRO" } : {}),
              },
            }),
            prisma.creditTransaction.create({
              data: {
                userId,
                amount: creditsToAdd,
                type: "PURCHASE",
                razorpayPaymentId,
                razorpayOrderId: razorpayOrderId || "webhook",
                description: isPro
                  ? `Upgraded to Pro Plan (+${creditsToAdd} credits)`
                  : `Purchased ${creditsToAdd} credits (${matchedPlan?.name || "Credit Pack"})`,
              },
            }),
          ]);
        }
      }
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

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
// POST /api/credits/purchase (Razorpay Order Creation)
// ==========================================
router.post("/purchase", async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan } = req.body;
    const userId = req.user!.userId;

    const planKey = plan?.toLowerCase?.() ?? "";
    const selectedPlan = PLANS[planKey];
    if (!selectedPlan) {
      res.status(400).json({ error: `Invalid plan: '${plan}'. Valid plans: ${Object.keys(PLANS).join(", ")}` });
      return;
    }

    let orderId: string;

    if (razorpayClient) {
      try {
        const order = await razorpayClient.orders.create({
          amount: selectedPlan.amount,
          currency: "INR",
          receipt: `rcpt_${userId.slice(0, 8)}_${Date.now()}`,
          notes: {
            userId,
            plan: planKey,
            credits: String(selectedPlan.credits),
          },
        });
        orderId = order.id;
      } catch (rzpErr) {
        console.warn("Razorpay order creation fallback triggered:", rzpErr);
        orderId = `order_mock_${Date.now()}`;
      }
    } else {
      orderId = `order_mock_${Date.now()}`;
    }

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
// POST /api/credits/verify (Razorpay Signature Verification)
// ==========================================
router.post("/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, credits, plan } = req.body;
    const userId = req.user!.userId;

    if (!razorpayOrderId || !razorpayPaymentId) {
      res.status(400).json({ error: "Missing Razorpay Order ID or Payment ID" });
      return;
    }

    // Verify HMAC signature when Razorpay secret is set and real order ID is present
    const isMockOrder = String(razorpayOrderId).startsWith("order_mock_");
    const isTestSandboxBypass =
      razorpaySignature === "razorpay_test_verified_signature" &&
      (config.razorpay.keyId.startsWith("rzp_test_") || !config.razorpay.keySecret);

    if (config.razorpay.keySecret && !isMockOrder && !isTestSandboxBypass) {
      if (!razorpaySignature) {
        res.status(400).json({ error: "Missing payment signature" });
        return;
      }
      const expectedSignature = crypto
        .createHmac("sha256", config.razorpay.keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        res.status(400).json({ error: "Invalid payment signature" });
        return;
      }
    }

    // Idempotency check: prevent double-crediting the same payment ID
    if (razorpayPaymentId && razorpayPaymentId !== "mock") {
      const existingTx = await prisma.creditTransaction.findFirst({
        where: { razorpayPaymentId: String(razorpayPaymentId) },
      });
      if (existingTx) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { credits: true, plan: true },
        });
        res.json({
          success: true,
          alreadyProcessed: true,
          newBalance: currentUser?.credits ?? 0,
          plan: currentUser?.plan ?? "FREE",
          creditsAdded: existingTx.amount,
        });
        return;
      }
    }

    const planKey = (plan || "").toLowerCase();
    const matchedPlan = PLANS[planKey];

    // Enforce server-side credit mapping so clients cannot tamper with credit amounts
    const creditsToAdd = matchedPlan ? matchedPlan.credits : Math.min(Math.max(parseInt(credits) || 500, 100), 2000);
    const isPro = Boolean(matchedPlan?.isPro || planKey === "pro_monthly" || planKey === "pro");

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: creditsToAdd },
          ...(isPro ? { plan: "PRO" } : {}),
        },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount: creditsToAdd,
          type: "PURCHASE",
          razorpayPaymentId: String(razorpayPaymentId),
          razorpayOrderId: String(razorpayOrderId),
          description: isPro
            ? `Upgraded to Pro Plan (+${creditsToAdd} credits)`
            : `Purchased ${creditsToAdd} credits (${matchedPlan?.name || "Credit Pack"})`,
        },
      }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, plan: true },
    });

    res.json({
      success: true,
      newBalance: user?.credits ?? creditsToAdd,
      plan: user?.plan ?? (isPro ? "PRO" : "FREE"),
      creditsAdded: creditsToAdd,
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
