import { env } from "./env";
import { supabase } from "./supabase";

// Einheitlicher API-Client gegen unser Fastify-Backend.
// - Holt den aktuellen Access-Token aus dem supabase-js Client und hängt ihn
//   als Bearer-Header an, sofern eine Session existiert
// - Setzt Content-Type: application/json NUR wenn ein Body übergeben wird
//   (das Fastify-Body-Parser-Verhalten verlangt einen Body, sobald der
//    Header gesetzt ist — exakt der Bug, den wir im E2E-Test hatten)
// - Wirft eine getypte ApiError, wenn das Backend !2xx antwortet — Aufrufer
//   können auf statusCode/message reagieren
// - Parst JSON; bei 204 gibt's `null`

export type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  // false = Endpoint ist public (z. B. /unis), keine Auth-Token mitschicken.
  // Default true; ohne Session wird trotzdem fetched, der Server entscheidet.
  auth?: boolean;
};

export class ApiError extends Error {
  statusCode: number;
  body: unknown;
  constructor(statusCode: number, message: string, body: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.body = body;
    this.name = "ApiError";
  }
}

async function getBearerToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, signal, auth = true } = options;

  const headers: Record<string, string> = { Accept: "application/json" };

  if (auth) {
    const token = await getBearerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let stringifiedBody: string | undefined;
  if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
    stringifiedBody = JSON.stringify(body);
  }

  const url = `${env.API_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;
  const res = await fetch(url, { method, headers, body: stringifiedBody, signal });

  if (res.status === 204) {
    return null as T;
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === "object" && "message" in parsed && typeof (parsed as { message?: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : null) ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, message, parsed);
  }

  return parsed as T;
}
