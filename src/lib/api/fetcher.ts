export class ApiError extends Error {
  status: number;
  issues?: unknown;
  constructor(message: string, status: number, issues?: unknown) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

export async function apiFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(body?.error ?? `Request failed with status ${res.status}`, res.status, body?.issues);
  }
  return body as T;
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url, { method: "GET" }),
  post: <T>(url: string, data?: unknown) => apiFetch<T>(url, { method: "POST", body: JSON.stringify(data ?? {}) }),
  patch: <T>(url: string, data?: unknown) => apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(data ?? {}) }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};
