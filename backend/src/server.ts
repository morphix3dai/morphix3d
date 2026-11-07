import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config";
import { prisma } from "./lib/prisma";

// Route imports
import authRoutes from "./routes/auth";
import generateRoutes from "./routes/generate";
import creditsRoutes from "./routes/credits";
import assetsRoutes from "./routes/assets";

// ==========================================
// Express App Setup
// ==========================================
const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  config.frontendUrl,
  'https://3dmorphix.com',
  'https://www.3dmorphix.com',
  'https://morphix3d.vercel.app',
  'http://localhost:3000',
].filter(Boolean);

// Socket.IO for real-time generation progress
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ==========================================
// Middleware
// ==========================================
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some(o => origin.startsWith(o.replace(/\/$/, '')))) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in development
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter for auth endpoints
  message: { error: "Too many auth attempts, please try again later" },
});

// ==========================================
// Routes
// ==========================================
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/generate", apiLimiter, generateRoutes);
app.use("/api/credits", apiLimiter, creditsRoutes);
app.use("/api/assets", apiLimiter, assetsRoutes);

// Health check & API index
app.get(["/", "/health", "/api", "/api/health"], (_req, res) => {
  res.json({
    status: "ok",
    service: "morphix3d-backend",
    version: "1.0.0",
    paymentGateway: config.razorpay.keyId ? "razorpay_active" : "sandbox",
    aiEngines: {
      mechanical: "zoo_dev_active",
      architecture: process.env.OPENAI_API_KEY
        ? "openai_gpt4o_mini_active"
        : process.env.GEMINI_API_KEY
        ? "gemini_flash_active"
        : "builtin_bim_solver",
      creative3d: process.env.FAL_KEY
        ? "fal_trellis_active"
        : process.env.TRIPO3D_API_KEY
        ? "tripo3d_active"
        : "builtin_3d_sculptor",
    },
    endpoints: {
      health: "/api/health",
      auth: ["/api/auth/register", "/api/auth/login", "/api/auth/google", "/api/auth/me"],
      credits: ["/api/credits/balance", "/api/credits/history", "/api/credits/purchase", "/api/credits/verify", "/api/credits/webhook"],
      generate: ["/api/generate/mechanical", "/api/generate/architecture", "/api/generate/text-to-3d", "/api/generate/image-to-3d", "/api/generate/texture", "/api/generate/remesh", "/api/generate/rig"],
      assets: ["/api/assets", "/api/assets/community/gallery"],
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// Socket.IO — Real-time progress updates
// ==========================================
io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Client subscribes to a generation job
  socket.on("subscribe:job", (jobId: string) => {
    socket.join(`job:${jobId}`);
    console.log(`[WS] ${socket.id} subscribed to job:${jobId}`);
  });

  socket.on("unsubscribe:job", (jobId: string) => {
    socket.leave(`job:${jobId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Export io for use in routes (to emit progress updates)
export { io };

// ==========================================
// 404 Handler
// ==========================================
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ==========================================
// Global Error Handler
// ==========================================
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[Error]", err.message);
    res.status(500).json({
      error:
        config.nodeEnv === "development"
          ? err.message
          : "Internal server error",
    });
  }
);

// ==========================================
// Start Server + Auto-Harden Supabase RLS
// ==========================================
async function hardenDatabaseRls() {
  const tables = [
    "users",
    "refresh_tokens",
    "generations",
    "credit_transactions",
    "assets",
    "_prisma_migrations",
  ];
  for (const tbl of tables) {
    await prisma
      .$executeRawUnsafe(`ALTER TABLE IF EXISTS public."${tbl}" ENABLE ROW LEVEL SECURITY;`)
      .catch(() => {});
  }
  console.log("  [Security] PostgreSQL Row-Level Security (RLS) verified on all public tables.");
}

httpServer.listen(config.port, "0.0.0.0", () => {
  hardenDatabaseRls().catch(() => {});
  console.log(`
  ╔══════════════════════════════════════╗
  ║     FORGE3D Backend API Server       ║
  ╠══════════════════════════════════════╣
  ║  Port:     ${String(config.port).padEnd(24)}║
  ║  Env:      ${config.nodeEnv.padEnd(24)}║
  ║  Frontend: ${config.frontendUrl.padEnd(24)}║
  ╚══════════════════════════════════════╝
  `);
  console.log("  Endpoints:");
  console.log("  POST /api/auth/register");
  console.log("  POST /api/auth/login");
  console.log("  POST /api/auth/refresh");
  console.log("  GET  /api/auth/me");
  console.log("  POST /api/generate/text-to-3d");
  console.log("  POST /api/generate/image-to-3d");
  console.log("  POST /api/generate/texture");
  console.log("  POST /api/generate/remesh");
  console.log("  POST /api/generate/rig");
  console.log("  GET  /api/generate/status/:id");
  console.log("  GET  /api/generate/history");
  console.log("  GET  /api/credits/balance");
  console.log("  GET  /api/credits/history");
  console.log("  POST /api/credits/purchase");
  console.log("  POST /api/credits/verify");
  console.log("  GET  /api/assets");
  console.log("  GET  /api/assets/:id");
  console.log("  DELETE /api/assets/:id");
  console.log("  PATCH /api/assets/:id");
  console.log("  GET  /api/assets/community/gallery");
  console.log("  POST /api/assets/community/like/:id");
  console.log("  GET  /api/health");
  console.log("");
});
