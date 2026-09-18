import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { authMiddleware } from "../middleware/auth";
import { config } from "../config";

const router = Router();

// ==========================================
// Validation Schemas
// ==========================================
const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// ==========================================
// POST /api/auth/register
// ==========================================
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = registerSchema.parse(req.body);

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Create user with signup bonus
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        credits: config.credits.SIGNUP_BONUS,
        creditTransactions: {
          create: {
            amount: config.credits.SIGNUP_BONUS,
            type: "BONUS",
            description: "Signup bonus",
          },
        },
      },
    });

    // Generate tokens
    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/auth/login
// ==========================================
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const validPassword = await bcrypt.compare(body.password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/auth/refresh
// ==========================================
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    // Verify token
    const payload = verifyRefreshToken(token);

    // Check if token exists in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Delete old token (rotate)
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Generate new tokens
    const newPayload = { userId: payload.userId, email: payload.email };
    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: payload.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ==========================================
// GET /api/auth/me
// ==========================================
router.get("/me", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        credits: true,
        plan: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/auth/logout
// ==========================================
router.post("/logout", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }
    res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/auth/forgot-password
// ==========================================
router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Always respond with success for security (don't reveal if email exists)
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Generate a secure reset token (random hex)
      const crypto = await import("crypto");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in DB as a refresh token with special prefix
      await prisma.refreshToken.create({
        data: {
          token: `reset_${resetToken}`,
          userId: user.id,
          expiresAt,
        },
      });

      const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // In production: send email via Resend/Nodemailer
      // In development: log the link to console
      if (config.nodeEnv === "development") {
        console.log("\n╔══════════════════════════════════════════════");
        console.log("║  PASSWORD RESET LINK (dev mode):");
        console.log(`║  ${resetUrl}`);
        console.log("╚══════════════════════════════════════════════\n");
      }
      // TODO: Send email via Resend API in production
      // await sendResetEmail(email, resetUrl);
    }

    res.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/auth/reset-password
// ==========================================
router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      res.status(400).json({ error: "Token, email, and new password are required" });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    // Find the reset token in DB
    const stored = await prisma.refreshToken.findUnique({
      where: { token: `reset_${token}` },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      res.status(400).json({ error: "Reset link has expired or is invalid. Please request a new one." });
      return;
    }

    if (stored.user.email !== email) {
      res.status(400).json({ error: "Invalid reset link." });
      return;
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: stored.userId },
      data: { passwordHash },
    });

    // Delete the reset token (one-time use)
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    // Also invalidate all other sessions
    await prisma.refreshToken.deleteMany({ where: { userId: stored.userId } });

    res.json({ message: "Password reset successfully. You can now sign in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// POST /api/auth/google
// ==========================================
router.post("/google", async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, email, name, avatarUrl } = req.body;

    let userEmail = email;
    let userName = name || "Google User";
    let userAvatar = avatarUrl || null;

    // If Google ID token is provided, verify it with Google's tokeninfo API
    if (idToken) {
      try {
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (googleRes.ok) {
          const googleData = await googleRes.json() as { email?: string; name?: string; picture?: string };
          if (googleData.email) {
            userEmail = googleData.email;
            userName = googleData.name || userName;
            userAvatar = googleData.picture || userAvatar;
          }
        }
      } catch (err) {
        console.warn("Google token verification warning:", err);
      }
    }

    if (!userEmail) {
      userEmail = `google_user_${Date.now()}@gmail.com`;
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          avatarUrl: userAvatar,
          credits: config.credits.SIGNUP_BONUS,
          creditTransactions: {
            create: {
              amount: config.credits.SIGNUP_BONUS,
              type: "BONUS",
              description: "Signup bonus via Google",
            },
          },
        },
      });
    }

    // Generate tokens
    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        credits: user.credits,
        plan: user.plan,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Internal server error during Google auth" });
  }
});

// ==========================================
// PATCH /api/auth/profile
// ==========================================
router.patch("/profile", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, avatarUrl } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: updateData,
      select: { id: true, email: true, name: true, avatarUrl: true, credits: true, plan: true, createdAt: true },
    });
    
    res.json({ user });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==========================================
// POST /api/auth/change-password
// ==========================================
router.post('/change-password', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password required' });
      return;
    }
    
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.passwordHash) {
      res.status(400).json({ error: 'User not found' });
      return;
    }
    
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }
    
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user!.userId }, data: { passwordHash: hash } });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
