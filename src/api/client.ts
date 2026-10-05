import type { ApiErrorBody } from "@relaydesk/shared";
import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  code: string;
  fields?: Record<string, string>;
  status: number;
  constructor(status: number, body: ApiErrorBody | { message?: string }) {
    const err = (body as ApiErrorBody).error;
    super(err?.message || (body as { message?: string }).message || "Request failed");
    this.status = status;
    this.code = err?.code || "error";
    this.fields = err?.fields;
  }
}

export interface FetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

/** Thin, reusable fetch wrapper for the ordering API. Bearer-token auth only. */
export async function apiFetch<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data ?? {});
  return data as T;
}
