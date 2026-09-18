import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000"),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Database
  databaseUrl: process.env.DATABASE_URL || "",

  // Redis
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },

  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  },

  // S3 / R2
  s3: {
    endpoint: process.env.S3_ENDPOINT || "",
    bucket: process.env.S3_BUCKET || "forge3d-assets",
    accessKey: process.env.S3_ACCESS_KEY || "",
    secretKey: process.env.S3_SECRET_KEY || "",
    region: process.env.S3_REGION || "auto",
  },

  // AI Server
  aiServerUrl: process.env.AI_SERVER_URL || "http://localhost:8000",

  // Credit costs
  credits: {
    TEXT_TO_3D: 10,
    IMAGE_TO_3D: 10,
    TEXTURE: 5,
    REMESH: 3,
    RIG: 8,
    MECHANICAL_CAD: 5,
    ARCHITECTURE: 8,
    SIGNUP_BONUS: 200,
  },
} as const;
