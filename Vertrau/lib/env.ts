// Frontend-Env-Variablen. Werden zur Build-Zeit von Expo inlinet (alles mit
// EXPO_PUBLIC_-Prefix). Wir prüfen sie zur Laufzeit, damit fehlerhaftes Setup
// nicht in mysteriösen "undefined fetch"-Crashes irgendwo im UI endet.

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing env var ${name}. Stellen sicher, dass eine .env existiert ` +
        `(Vorlage: .env.example) und Expo nach .env-Änderungen neu gestartet wird.`
    );
  }
  return value.trim();
}

export const env = {
  SUPABASE_URL: requireEnv("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: requireEnv(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ),
  API_BASE_URL: requireEnv(
    "EXPO_PUBLIC_API_BASE_URL",
    process.env.EXPO_PUBLIC_API_BASE_URL
  ).replace(/\/+$/, ""),
} as const;
