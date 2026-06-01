import "react-native-url-polyfill/auto";
import { createClient, type Session } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { env } from "./env";

// Supabase-js mit Expo Secure Store als Session-Storage.
// SecureStore verschlüsselt auf iOS via Keychain, auf Android via EncryptedSharedPreferences.
// auto-refresh sorgt dafür, dass Tokens automatisch erneuert werden, bevor sie ablaufen.
//
// Hinweis: SecureStore unterstützt nur Strings bis 2048 Bytes pro Schlüssel.
// Supabase-Sessions sind ~1.5 KB — passt knapp. Falls jemals Probleme:
// AsyncStorage-Fallback einbauen.

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // App handhabt Auth über native Screens, keine Magic-Link-URL-Erkennung
    detectSessionInUrl: false,
  },
});

// ── Session-Helfer ─────────────────────────────────────────────────────────

// Holt die aktuelle Session (falls vorhanden). Wird beim App-Start gerufen,
// um zu entscheiden: Login-Screen oder direkt rein?
export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error("Login lieferte keine Session zurück.");
  return data.session;
}

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<Session | null> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  // Falls "Confirm email" im Dashboard aktiviert ist, kommt hier KEINE
  // Session zurück, sondern ein User. Im Dev-Setup ist Confirm-Email aus,
  // also bekommen wir direkt eine Session — der Aufrufer entscheidet, wie
  // er mit null umgeht (Hinweistext zeigen oder Login-Screen).
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// React-Hook-Helfer: Subscribe auf Auth-State-Änderungen. Wird in 4b vom
// AuthGate genutzt, um auf Login/Logout zu reagieren.
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
}
