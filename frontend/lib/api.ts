/**
 * WebStackPro API client.
 * Talks to the Express backend and attaches the WebStackPro JWT.
 */

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "");

function apiPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_URL.endsWith("/api") ? `${API_URL}${p}` : `${API_URL}/api${p}`;
}

export class WebStackProAPIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("webstackpro_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(apiPath(path), { ...options, headers });

  if (!res.ok) {
    let message = `WebStackPro: request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch (_) {
      // keep fallback message
    }
    throw new WebStackProAPIError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const webstackpro = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { API_URL };