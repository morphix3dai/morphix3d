/**
 * Resilient Vercel Serverless Store + Self-Contained HMAC-SHA256 JWT Auth Engine
 * Works 24/7 on Vercel Free Tier with zero external server cost and zero cold-sleep failures.
 */

import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

const JWT_SECRET =
  process.env.JWT_SECRET || "c4f9a2e7b1d80365f2a9c8e4d7b10536a8f2e9c4b7d10638f5a2c9e7b4d10832";

export const CREDIT_COSTS = {
  MECHANICAL_CAD: 5,
  ARCHITECTURE: 8,
  SIGNUP_BONUS: 200,
} as const;

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  avatarUrl: string | null;
  credits: number;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  createdAt: string;
}

export interface StoredGeneration {
  id: string;
  userId: string;
  type: "MECHANICAL_CAD" | "ARCHITECTURE";
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  prompt: string;
  styleOption: string | null;
  modelType: string | null;
  creditsUsed: number;
  outputUrls: Record<string, string> | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface StoredAsset {
  id: string;
  userId: string;
  generationId: string | null;
  name: string;
  fileFormat: string;
  fileUrl: string;
  fileSize: number | null;
  thumbnailUrl: string | null;
  outputUrls?: Record<string, string> | null;
  isPublic: boolean;
  likes: number;
  downloads: number;
  createdAt: string;
  user?: { name: string | null; avatarUrl: string | null };
  generation?: {
    type: string;
    prompt: string;
    styleOption: string | null;
    outputUrls?: Record<string, string> | null;
    createdAt: string;
  };
}

export interface StoredTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "PURCHASE" | "USAGE" | "BONUS" | "REFUND";
  description: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: string;
}

interface StoreState {
  users: Record<string, StoredUser>; // keyed by userId
  emailIndex: Record<string, string>; // email -> userId
  generations: Record<string, StoredGeneration>;
  assets: Record<string, StoredAsset>;
  transactions: StoredTransaction[];
  resetTokens: Record<string, { userId: string; email: string; expiresAt: number }>;
}

const TMP_FILE = path.join(os.tmpdir(), "morphix3d_vercel_store.json");

const globalStore = globalThis as unknown as { __morphixStore?: StoreState };

function loadInitialStore(): StoreState {
  if (globalStore.__morphixStore) return globalStore.__morphixStore;
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, "utf8");
      const parsed = JSON.parse(raw) as StoreState;
      globalStore.__morphixStore = parsed;
      return parsed;
    }
  } catch {
    // ignore tmp read error
  }
  const fresh: StoreState = {
    users: {},
    emailIndex: {},
    generations: {},
    assets: {},
    transactions: [],
    resetTokens: {},
  };
  globalStore.__morphixStore = fresh;
  return fresh;
}

export function getStore(): StoreState {
  return loadInitialStore();
}

export function saveStore(): void {
  try {
    if (globalStore.__morphixStore) {
      fs.writeFileSync(TMP_FILE, JSON.stringify(globalStore.__morphixStore), "utf8");
    }
  } catch {
    // ignore tmp write errors
  }
}

// ─── Password Hashing (Node Built-in Scrypt) ──────────────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith("scrypt:")) {
    const [, salt, key] = storedHash.split(":");
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(derived, "hex"));
  }
  return false;
}

// ─── Self-Contained HMAC-SHA256 JWT (Survives Serverless Cold Starts!) ────────

export interface JwtUserPayload {
  userId: string;
  email: string;
  name?: string;
  avatarUrl?: string | null;
  credits?: number;
  plan?: "FREE" | "PRO" | "ENTERPRISE";
  exp: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}

function base64UrlDecode(b64: string): string {
  return Buffer.from(b64, "base64url").toString("utf8");
}

export function signToken(user: StoredUser, expiresInSec = 7 * 24 * 3600): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits,
      plan: user.plan,
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
    })
  );
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token: string): JwtUserPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payloadB64, sig] = parts;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payloadB64}`)
      .digest("base64url");
    if (sig !== expectedSig) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64)) as JwtUserPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Ensures the user from a valid JWT exists in the current serverless instance store
 * (rehydrating automatically if a cold start happened).
 */
export function getOrHydrateUserFromRequest(authHeader: string | null): StoredUser | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload || !payload.userId || !payload.email) return null;

  const store = getStore();
  let user = store.users[payload.userId];
  if (!user) {
    const existingId = store.emailIndex[payload.email.toLowerCase()];
    if (existingId && store.users[existingId]) {
      user = store.users[existingId];
    } else {
      user = {
        id: payload.userId,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email.split("@")[0],
        passwordHash: null,
        avatarUrl: payload.avatarUrl || null,
        credits: typeof payload.credits === "number" ? payload.credits : CREDIT_COSTS.SIGNUP_BONUS,
        plan: payload.plan || "FREE",
        createdAt: new Date().toISOString(),
      };
      store.users[user.id] = user;
      store.emailIndex[user.email] = user.id;
      saveStore();
    }
  }
  return user;
}
