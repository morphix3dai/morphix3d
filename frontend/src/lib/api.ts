const RAILWAY_API_BASE = "https://morphix3d-backend-production-508e.up.railway.app/api";
const RAW_ENV_API = process.env.NEXT_PUBLIC_API_URL || "";

function resolveApiBase(): string {
  if (!RAW_ENV_API || RAW_ENV_API.includes("onrender.com")) {
    return RAILWAY_API_BASE;
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1" &&
    RAW_ENV_API.includes("localhost")
  ) {
    return RAILWAY_API_BASE;
  }
  return RAW_ENV_API;
}

export const API_BASE = resolveApiBase();

// ==========================================
// Token Management
// ==========================================
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("forge3d_access_token", token);
    } else {
      localStorage.removeItem("forge3d_access_token");
    }
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("forge3d_access_token");
  }
  return accessToken;
}

export function setRefreshToken(token: string | null) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("forge3d_refresh_token", token);
    } else {
      localStorage.removeItem("forge3d_refresh_token");
    }
  }
}

function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("forge3d_refresh_token");
  }
  return null;
}

// ==========================================
// Automatic Studio Guest Session Provisioner
// ==========================================
let studioAuthPromise: Promise<boolean> | null = null;

async function ensureStudioSession(baseUrl: string, rotateAccount = false): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (studioAuthPromise) return studioAuthPromise;

  studioAuthPromise = (async () => {
    try {
      let guestEmail = localStorage.getItem("forge3d_studio_guest_email");
      if (!guestEmail || rotateAccount) {
        const rand = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
        guestEmail = `studio_${rand}@3dmorphix.com`;
        localStorage.setItem("forge3d_studio_guest_email", guestEmail);
      }

      const res = await fetch(`${baseUrl}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: guestEmail,
          name: "Morphix Studio Creator",
        }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      studioAuthPromise = null;
    }
  })();

  return studioAuthPromise;
}

async function fetchWithFallback(endpoint: string, init: RequestInit): Promise<{ res: Response; usedBase: string }> {
  const primaryBase = resolveApiBase();
  try {
    const res = await fetch(`${primaryBase}${endpoint}`, init);
    return { res, usedBase: primaryBase };
  } catch (err) {
    if (primaryBase !== RAILWAY_API_BASE) {
      const res = await fetch(`${RAILWAY_API_BASE}${endpoint}`, init);
      return { res, usedBase: RAILWAY_API_BASE };
    }
    throw err;
  }
}

// ==========================================
// Core Fetch Wrapper
// ==========================================
async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getAccessToken();

  // Auto-provision studio session if calling /generate/* without a token
  if (!token && endpoint.startsWith("/generate")) {
    await ensureStudioSession(resolveApiBase(), false);
    token = getAccessToken();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const { res, usedBase } = await fetchWithFallback(endpoint, {
    ...options,
    headers,
  });

  // Try token refresh or studio session provisioning on 401
  if (res.status === 401 && !endpoint.startsWith("/auth/login") && !endpoint.startsWith("/auth/register")) {
    let recovered = false;
    if (getRefreshToken()) {
      recovered = await refreshAccessToken(usedBase);
    }
    if (!recovered && endpoint.startsWith("/generate")) {
      recovered = await ensureStudioSession(usedBase, false);
    }
    if (recovered) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      const retryRes = await fetch(`${usedBase}${endpoint}`, {
        ...options,
        headers,
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({}));
        throw new ApiError(retryRes.status, err.error || "Request failed");
      }
      return retryRes.json();
    } else if (!endpoint.startsWith("/generate")) {
      logout();
      throw new ApiError(401, "Session expired");
    }
  }

  // If studio guest runs out of free demo credits (402) on /generate/*, rotate studio guest token once
  if (res.status === 402 && endpoint.startsWith("/generate")) {
    const rotated = await ensureStudioSession(usedBase, true);
    if (rotated) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      const retryRes = await fetch(`${usedBase}${endpoint}`, {
        ...options,
        headers,
      });
      if (retryRes.ok) {
        return retryRes.json();
      }
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.error || "Request failed");
  }

  return res.json();
}

async function refreshAccessToken(baseUrl = API_BASE): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ==========================================
// Auth API
// ==========================================
export const auth = {
  register: (data: { email: string; password: string; name: string }) =>
    apiFetch<{ user: User; accessToken: string; refreshToken: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(data) }
    ),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ user: User; accessToken: string; refreshToken: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(data) }
    ),

  google: (data?: { idToken?: string; email?: string; name?: string; avatarUrl?: string }) =>
    apiFetch<{ user: User; accessToken: string; refreshToken: string }>(
      "/auth/google",
      { method: "POST", body: JSON.stringify(data || {}) }
    ),

  me: () => apiFetch<{ user: User }>("/auth/me"),

  updateProfile: (data: { name?: string; avatarUrl?: string }) =>
    apiFetch<{ user: User }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiFetch<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: { email: string }) =>
    apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { token: string; password: string }) =>
    apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => {
    const token = getRefreshToken();
    apiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: token }),
    }).catch(() => {});
    logout();
  },
};

function logout() {
  setAccessToken(null);
  setRefreshToken(null);
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

// ==========================================
// Generation API
// ==========================================
export const generate = {
  textTo3d: (data: { prompt: string; style?: string; pose?: string; modelType?: string }) =>
    apiFetch<{ jobId: string; status: string; creditsUsed: number }>(
      "/generate/text-to-3d",
      { method: "POST", body: JSON.stringify(data) }
    ),

  imageTo3d: (data: { imageUrl?: string; mode?: string }) =>
    apiFetch<{ jobId: string; status: string; creditsUsed: number }>(
      "/generate/image-to-3d",
      { method: "POST", body: JSON.stringify(data) }
    ),

  texture: (data: { prompt: string; style?: string; modelUrl?: string }) =>
    apiFetch<{ jobId: string; status: string; creditsUsed: number }>(
      "/generate/texture",
      { method: "POST", body: JSON.stringify(data) }
    ),

  remesh: (data: { modelUrl: string; polyCount?: number; topology?: string; autoFix?: boolean; printCheck?: boolean }) =>
    apiFetch<{ jobId: string; status: string; creditsUsed: number }>(
      "/generate/remesh",
      { method: "POST", body: JSON.stringify(data) }
    ),

  rig: (data: { modelUrl: string; charType?: string; animations?: string[] }) =>
    apiFetch<{ jobId: string; status: string; creditsUsed: number }>(
      "/generate/rig",
      { method: "POST", body: JSON.stringify(data) }
    ),

  mechanical: (data: { prompt: string; partType?: string; material?: string; units?: string }) =>
    apiFetch<{ jobId: string; status: string; creditsUsed: number }>(
      "/generate/mechanical",
      { method: "POST", body: JSON.stringify(data) }
    ),

  architecture: (data: { prompt: string; houseStyle?: string; sqft?: number; floors?: number; rooms?: Record<string, number> }) =>
    apiFetch<{ jobId: string; status: string; creditsUsed: number }>(
      "/generate/architecture",
      { method: "POST", body: JSON.stringify(data) }
    ),

  status: (jobId: string) =>
    apiFetch<GenerationJob>(`/generate/status/${jobId}`),

  upload: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    let token = getAccessToken();
    if (!token) {
      await ensureStudioSession(resolveApiBase(), false);
      token = getAccessToken();
    }
    const { res } = await fetchWithFallback("/generate/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.error || "File upload failed");
    }
    return res.json();
  },

  history: (page = 1, limit = 20) =>
    apiFetch<{ generations: GenerationJob[]; pagination: Pagination }>(
      `/generate/history?page=${page}&limit=${limit}`
    ),
};

export const uploadFile = async (file: File): Promise<string> => {
  const result = await generate.upload(file);
  return result.url;
};

// ==========================================
// Credits API
// ==========================================
export const credits = {
  balance: () =>
    apiFetch<{ credits: number; plan: string; costs: Record<string, number> }>(
      "/credits/balance"
    ),

  history: (page = 1, limit = 20) =>
    apiFetch<{ transactions: CreditTransaction[]; pagination: Pagination }>(
      `/credits/history?page=${page}&limit=${limit}`
    ),

  purchase: (plan: string) =>
    apiFetch<{ orderId: string; amount: number; currency: string; credits: number; planName: string; keyId: string }>(
      "/credits/purchase",
      { method: "POST", body: JSON.stringify({ plan }) }
    ),
};

// ==========================================
// Assets API
// ==========================================
export const assets = {
  list: (page = 1, limit = 20) =>
    apiFetch<{ assets: Asset[]; pagination: Pagination }>(
      `/assets?page=${page}&limit=${limit}`
    ),

  get: (id: string) => apiFetch<Asset>(`/assets/${id}`),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/assets/${id}`, { method: "DELETE" }),

  update: (id: string, data: { name?: string; isPublic?: boolean }) =>
    apiFetch<Asset>(`/assets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  download: (id: string) =>
    apiFetch<{ downloadUrl: string; expiresIn: number }>(`/assets/${id}/download`),

  gallery: (page = 1, limit = 20, sort = "latest") =>
    apiFetch<{ assets: Asset[]; pagination: Pagination }>(
      `/assets/community/gallery?page=${page}&limit=${limit}&sort=${sort}`
    ),

  like: (id: string) =>
    apiFetch<{ likes: number }>(`/assets/community/like/${id}`, { method: "POST" }),
};

// ==========================================
// Health
// ==========================================
export const health = () =>
  apiFetch<{ status: string; service: string }>("/health");

// ==========================================
// Types
// ==========================================
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  credits: number;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  createdAt?: string;
}

export interface GenerationJob {
  id: string;
  type: string;
  status: string;
  progress: number;
  prompt: string | null;
  outputUrls: Record<string, string> | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  fileFormat: string;
  fileUrl: string;
  fileSize: number | null;
  thumbnailUrl: string | null;
  outputUrls?: Record<string, string>;
  isPublic: boolean;
  likes: number;
  downloads: number;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
