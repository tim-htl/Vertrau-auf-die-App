import { apiFetch } from "../lib/api";
import type {
  GetHobbiesResponse,
  HobbyKatalogEintrag,
  PutHobbiesResponse,
} from "../types/api";

// Hobby-Katalog + die Hobby-Auswahl des eingeloggten Users.
// Katalog ist öffentlich (kein Token nötig), das Speichern braucht Auth.

export async function getHobbies(): Promise<HobbyKatalogEintrag[]> {
  const res = await apiFetch<GetHobbiesResponse>("/hobbies", { auth: false });
  return res.hobbies;
}

// Ersetzt die komplette Hobby-Auswahl (PUT-Semantik). Gibt die
// gespeicherten ids zurück.
export async function putMeineHobbies(hobbyIds: string[]): Promise<string[]> {
  const res = await apiFetch<PutHobbiesResponse>("/me/hobbies", {
    method: "PUT",
    body: { hobbyIds },
  });
  return res.hobbyIds;
}
