// Frontend-Env-Variablen. Werden zur Build-Zeit von Expo inlinet (alles mit
// EXPO_PUBLIC_-Prefix). Wir prüfen sie zur Laufzeit, damit fehlerhaftes Setup
// nicht in mysteriösen "undefined fetch"-Crashes irgendwo im UI endet.

import Constants from "expo-constants";

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing env var ${name}. Stellen sicher, dass eine .env existiert ` +
        `(Vorlage: .env.example) und Expo nach .env-Änderungen neu gestartet wird.`
    );
  }
  return value.trim();
}

// Backend-URL ermitteln.
//
// In der Entwicklung (Expo Go / Dev-Build) leiten wir die IP automatisch vom
// Expo-Dev-Host ab — das ist immer die aktuelle Mac-IP. Dadurch muss bei
// jedem Netzwechsel NICHTS mehr in .env angepasst werden (das war der
// wiederkehrende "Server nicht erreichbar"-Stolperstein).
//
// EXPO_PUBLIC_API_BASE_URL dient nur noch als Override/Fallback:
//   - Production-Build (__DEV__ === false): feste Prod-Backend-URL.
//   - falls die Host-Ableitung mal nichts liefert.
const DEV_BACKEND_PORT = 3000;

function expoHostIp(): string | null {
  // hostUri z. B. "172.20.10.12:8081"; debuggerHost als Fallback für ältere
  // SDK-/Manifest-Varianten.
  const c = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
    manifest?: { debuggerHost?: string; hostUri?: string };
  };
  const hostUri =
    c.expoConfig?.hostUri ||
    c.expoGoConfig?.debuggerHost ||
    c.manifest2?.extra?.expoGo?.debuggerHost ||
    c.manifest?.debuggerHost ||
    c.manifest?.hostUri ||
    null;
  if (!hostUri) return null;
  // "ip:port" oder "ip:port/path" → reine IP/Hostname.
  const host = String(hostUri).split("/")[0].split(":")[0].trim();
  return host.length > 0 ? host : null;
}

function resolveApiBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  // Dev: Host vom Expo-Server bevorzugen (immer aktuelle Mac-IP).
  if (__DEV__) {
    const ip = expoHostIp();
    if (ip) return `http://${ip}:${DEV_BACKEND_PORT}`;
  }

  if (override && override.length > 0) return override;

  throw new Error(
    "Backend-URL konnte nicht ermittelt werden: kein Expo-Dev-Host gefunden " +
      "und kein EXPO_PUBLIC_API_BASE_URL gesetzt."
  );
}

export const env = {
  SUPABASE_URL: requireEnv("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: requireEnv(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ),
  API_BASE_URL: resolveApiBaseUrl().replace(/\/+$/, ""),
} as const;
