import { apiFetch } from "../lib/api";
import { PROFIL_FRAGEN } from "../data/fragen";
import type { Person as UIPerson } from "../data/personen";
import type {
  GetSwipeQueueResponse,
  Person as ApiPerson,
  PostLikeResponse,
} from "../types/api";

// Datenschicht für Personen-Tab + Swipe. Mappt das reiche Backend-Person-
// Shape auf das namensbasierte UI-Shape (data/personen.ts), damit die
// Designer-UI unverändert bleibt — gleiches Muster wie api/profil.ts.

function mapPerson(p: ApiPerson): UIPerson {
  return {
    id: p.id,
    name: p.name,
    alter: p.alter ?? 0,
    bilder: p.bilder,
    kurzbeschreibung: p.kurzbeschreibung ?? "",
    hobbies: p.hobbies.map((h) => h.name),
    module: p.module.map((m) => m.name),
    moduleItems: p.module.map((m) => ({ id: m.id, name: m.name })),
    uni: p.uni?.name ?? "",
    studiengang: p.studiengang?.name ?? "",
    frageAntworten: p.frageAntworten.map((fa) => ({
      // DB-Text → lokale data/fragen.ts-id (für die AP-Anzeige via frageText)
      frageId: PROFIL_FRAGEN.find((f) => f.text === fa.text)?.id ?? fa.frageId,
      antwort: fa.antwort,
    })),
  };
}

// Swipe-Feed: Profile, die der eingeloggte User noch nicht geliked hat
// (ohne sich selbst). GET /personen/swipe.
export async function ladeSwipeFeed(): Promise<UIPerson[]> {
  const res = await apiFetch<GetSwipeQueueResponse>("/personen/swipe");
  return res.personen.map(mapPerson);
}

export type LikeErgebnis = { match: boolean; chatId?: string };

// Rechts-Swipe = Like. Bei gegenseitigem Like erzeugt das Backend Match +
// 1:1-Chat in einer Transaktion und liefert die chatId zurück.
export async function likePerson(person: UIPerson): Promise<LikeErgebnis> {
  const res = await apiFetch<PostLikeResponse>("/likes", {
    method: "POST",
    body: { likedId: person.id, kind: "LIKED" },
  });
  return { match: !!res.match, chatId: res.chatId ?? undefined };
}

// Detail-Profil (für die ausführliche Ansicht). GET /personen/:id.
export async function ladePerson(id: string): Promise<UIPerson> {
  const res = await apiFetch<{ person: ApiPerson }>(`/personen/${id}`);
  return mapPerson(res.person);
}
