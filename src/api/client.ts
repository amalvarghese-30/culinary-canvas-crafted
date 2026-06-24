const BASE_URL = import.meta.env.VITE_API_URL || "";

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const payload = data.data ?? data;
    setTokens(payload.accessToken, payload.refreshToken);
    return payload.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || body.error || `API error ${res.status}`) as any;
    if (body.errors?.length) err.fieldErrors = body.errors;
    throw err;
  }
  const json = await res.json();
  if (json.success === false) {
    const err = new Error(json.message || "Request failed") as any;
    if (json.errors?.length) err.fieldErrors = json.errors;
    throw err;
  }
  return (json.data !== undefined ? json.data : json) as T;
}
