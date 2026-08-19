const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const TOKEN_COOKIE = "motoserve_token";
const TOKEN_STORAGE = "motoserve_token";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function setAuthToken(token: string | null): void {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; secure" : "";
  if (token) {
    try {
      localStorage.setItem(TOKEN_STORAGE, token);
    } catch {
      // ignore storage errors
    }
    document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; samesite=lax${secure}`;
  } else {
    try {
      localStorage.removeItem(TOKEN_STORAGE);
    } catch {
      // ignore storage errors
    }
    document.cookie = `${TOKEN_COOKIE}=; path=/; samesite=lax${secure}; max-age=0`;
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE);
  } catch {
    return null;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<T>(path: string, { body, ...init }: ApiOptions = {}): Promise<T> {
  let res: Response;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
