import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config";

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

// Socket.IO for real-time generation progress
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.frontendUrl,
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
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "forge3d-backend",
    version: "1.0.0",
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
// Start Server
// ==========================================
httpServer.listen(config.port, () => {
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
