// src/lib/http.ts
import { API_BASE_URL, DEFAULT_TIMEOUT_MS } from "@/config/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class HttpError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// generic request
async function request<TResponse>(
  path: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  const {
    method = "GET",
    body,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const mergedSignal = signal
    ? mergeSignals(signal, controller.signal)
    : controller.signal;

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body != null ? JSON.stringify(body) : undefined,
      signal: mergedSignal,
      credentials: "include", // if you use cookies / auth
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new HttpError(
        (data as any)?.detail ?? `HTTP ${res.status}`,
        res.status,
        data
      );
    }

    return data as TResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

function mergeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  // super tiny helper, or you can skip if you don't need external signal
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener("abort", onAbort);
  b.addEventListener("abort", onAbort);

  if (a.aborted || b.aborted) controller.abort();
  return controller.signal;
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T, B = unknown>(
    path: string,
    body?: B,
    options?: Omit<RequestOptions, "method" | "body">
  ) => request<T>(path, { ...options, method: "POST", body }),

  put: <T, B = unknown>(
    path: string,
    body?: B,
    options?: Omit<RequestOptions, "method" | "body">
  ) => request<T>(path, { ...options, method: "PUT", body }),

  patch: <T, B = unknown>(
    path: string,
    body?: B,
    options?: Omit<RequestOptions, "method" | "body">
  ) => request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
