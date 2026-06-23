import { apiFetch } from "../lib/api";
import type {
  AuthSyncResponse,
  GetMeResponse,
  PatchMeResponse,
  Me,
} from "../types/api";

// Wrapper-Funktionen für /auth/sync, /me, PATCH /me.
//
// Konvention: das Frontend bekommt nur das `profile`-Objekt zurück; das
// "wrapper unwrap" macht den Aufruferstellen das Leben einfacher.

export async function authSync(name?: string): Promise<Me> {
  const res = await apiFetch<AuthSyncResponse>("/auth/sync", {
    method: "POST",
    body: name ? { name } : {},
  });
  return res.profile;
}

export async function getMe(): Promise<Me> {
  const res = await apiFetch<GetMeResponse>("/me");
  return res.profile;
}

export type PatchMeBody = Partial<{
  name: string;
  alter: number | null;
  kurzbeschreibung: string | null;
  bilder: string[];
  // hobbies laufen über den Hobby-Katalog (user_hobbies, Phase 4d),
  // nicht mehr über PATCH /me
  studiengangId: string | null;
}>;

export async function patchMe(body: PatchMeBody): Promise<Me> {
  const res = await apiFetch<PatchMeResponse>("/me", { method: "PATCH", body });
  return res.profile;
}
