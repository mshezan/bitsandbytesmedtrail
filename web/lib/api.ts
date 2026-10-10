export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("medtrail_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("medtrail_token", token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("medtrail_token");
  }
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let err = "API Error";
    try {
      const data = await res.json();
      err = data.detail || err;
    } catch (e) {}
    throw new Error(err);
  }

  return res.json();
}
