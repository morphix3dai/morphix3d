const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// ==========================================
// Token Management
// ==========================================
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("forge3d_access_token", token);
  } else {
    localStorage.removeItem("forge3d_access_token");
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
  if (token) {
    localStorage.setItem("forge3d_refresh_token", token);
  } else {
    localStorage.removeItem("forge3d_refresh_token");
  }
}

function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("forge3d_refresh_token");
  }
  return null;
}

// ==========================================
// Core Fetch Wrapper
// ==========================================
async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Try token refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      const retryRes = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({}));
        throw new ApiError(retryRes.status, err.error || "Request failed");
      }
      return retryRes.json();
    } else {
      // Refresh failed, clear tokens
      logout();
      throw new ApiError(401, "Session expired");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.error || "Request failed");
  }

  return res.json();
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
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

  remesh: () =>
    apiFetch<{ jobId: string; status: string; creditsUsed: number }>(
      "/generate/remesh",
      { method: "POST", body: JSON.stringify({}) }
    ),

  rig: () =>
    apiFetch<{ jobId: string; status: string; creditsUsed: number }>(
      "/generate/rig",
      { method: "POST", body: JSON.stringify({}) }
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

  history: (page = 1, limit = 20) =>
    apiFetch<{ generations: GenerationJob[]; pagination: Pagination }>(
      `/generate/history?page=${page}&limit=${limit}`
    ),
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
