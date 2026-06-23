import { apiFetch } from "../lib/api";
import { uploadBild } from "./storage";
import type { Aktivitaet as UIAktivitaet } from "../data/aktivitaeten";
import type {
  Aktivitaet as ApiAktivitaet,
  GetAktivitaetenResponse,
  GetAktivitaetResponse,
} from "../types/api";

// Datenschicht für den Treffen-Tab. Mappt das reiche Backend-Aktivitäts-Shape
// auf das UI-Shape (data/aktivitaeten.ts), damit die Designer-UI unverändert
// bleibt — gleiches Muster wie api/personen.ts / api/kurse.ts.

const FALLBACK_BILD =
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800";

function zwei(n: number): string {
  return String(n).padStart(2, "0");
}

function mapAktivitaet(a: ApiAktivitaet): UIAktivitaet {
  const start = new Date(a.startAt);
  const bilder = a.bilder.length > 0 ? a.bilder : [FALLBACK_BILD];
  return {
    id: a.id,
    titel: a.titel,
    ort: a.ortKurz || a.location?.name || a.adressePlzOrt || "",
    beschreibung: a.beschreibung,
    hintergrundbild: bilder[0],
    bilder,
    adresse: { strasse: a.adresseStrasse, plzOrt: a.adressePlzOrt },
    koordinaten: {
      latitude: a.koordinaten.lat ?? 0,
      longitude: a.koordinaten.lng ?? 0,
    },
    datum: `${zwei(start.getDate())}/${zwei(start.getMonth() + 1)}/${start.getFullYear()}`,
    uhrzeit: `${zwei(start.getHours())}:${zwei(start.getMinutes())}`,
    maxPlaetze: a.maxPlaetze,
    teilnehmer: a.teilnehmer.map((t) => ({
      id: t.id,
      name: t.name,
      bild: t.bild,
    })),
    sichtbarkeit: a.sichtbarkeit === "PUBLIC" ? "public" : "private",
    adminId: a.admin.id,
  };
}

// GET /aktivitaeten — Feed des Treffen-Tabs: nur kommende, echte GRUPPENTREFFEN
// (ohne Modul). Lerngruppen (= Aktivität mit Modul) gehören nicht hierher,
// sondern sind über das jeweilige Modul erreichbar (ladeLerngruppenFuerModul).
export async function ladeAktivitaeten(): Promise<UIAktivitaet[]> {
  const res = await apiFetch<GetAktivitaetenResponse>(
    "/aktivitaeten?upcoming=true"
  );
  return res.aktivitaeten.filter((a) => !a.modul).map(mapAktivitaet);
}

// GET /aktivitaeten?modulId=… — Lerngruppen eines Moduls (für den Kurse-Tab).
export async function ladeLerngruppenFuerModul(
  modulId: string
): Promise<UIAktivitaet[]> {
  const res = await apiFetch<GetAktivitaetenResponse>(
    `/aktivitaeten?modulId=${modulId}`
  );
  return res.aktivitaeten.map(mapAktivitaet);
}

// GET /aktivitaeten/:id — Detail einer Aktivität.
export async function ladeAktivitaet(id: string): Promise<UIAktivitaet> {
  const res = await apiFetch<GetAktivitaetResponse>(`/aktivitaeten/${id}`);
  return mapAktivitaet(res.aktivitaet);
}

// POST /aktivitaeten/:id/join — beitreten. Fügt auch zum Gruppen-Chat hinzu
// (Backend-Transaktion) und liefert die aktualisierte Aktivität zurück.
export async function beitretenAktivitaet(id: string): Promise<UIAktivitaet> {
  const res = await apiFetch<GetAktivitaetResponse>(`/aktivitaeten/${id}/join`, {
    method: "POST",
  });
  return mapAktivitaet(res.aktivitaet);
}

// POST /aktivitaeten/:id/leave — verlassen. Entfernt auch die Chat-Mitgliedschaft
// (Backend-Transaktion). Admins müssen vorher die Admin-Rolle übertragen.
export async function verlassenAktivitaet(id: string): Promise<void> {
  await apiFetch(`/aktivitaeten/${id}/leave`, { method: "POST" });
}

export type NeueAktivitaet = {
  titel: string;
  beschreibung: string;
  adresseStrasse: string;
  adressePlzOrt: string;
  ortKurz: string;
  koordinatenLat: number;
  koordinatenLng: number;
  startAt: string; // ISO
  dauerMinuten: number;
  maxPlaetze: number;
  sichtbarkeit: "public" | "private";
  modulId?: string | null;
};

// Aktivität erstellen. Der aktivitaet-cover-Bucket braucht die aktivitaetId,
// daher: zuerst mit Platzhalter-Bild anlegen → lokale Bilder hochladen →
// per PATCH die echten Bild-URLs setzen. Gibt die fertige Aktivität zurück.
// Einladungen laufen separat über einladeZuAktivitaet (Chat-Proposals) und
// werden vom Aufrufer NACH dem Erstellen verschickt.
export async function erstelleAktivitaet(
  input: NeueAktivitaet,
  lokaleBilder: string[]
): Promise<UIAktivitaet> {
  const created = await apiFetch<GetAktivitaetResponse>("/aktivitaeten", {
    method: "POST",
    body: {
      titel: input.titel,
      beschreibung: input.beschreibung,
      bilder: [FALLBACK_BILD], // Platzhalter; echte Bilder folgen per PATCH
      adresseStrasse: input.adresseStrasse,
      adressePlzOrt: input.adressePlzOrt,
      ortKurz: input.ortKurz,
      koordinatenLat: input.koordinatenLat,
      koordinatenLng: input.koordinatenLng,
      startAt: input.startAt,
      dauerMinuten: input.dauerMinuten,
      maxPlaetze: input.maxPlaetze,
      sichtbarkeit: input.sichtbarkeit === "private" ? "PRIVATE" : "PUBLIC",
      modulId: input.modulId ?? null,
    },
  });
  const id = created.aktivitaet.id;

  const hochgeladen = await Promise.all(
    lokaleBilder.map((b) =>
      b.startsWith("http")
        ? Promise.resolve(b)
        : uploadBild(b, "aktivitaet-cover", { aktivitaetId: id })
    )
  );
  const bilder = hochgeladen.filter((b): b is string => !!b);

  if (bilder.length > 0) {
    const res = await apiFetch<GetAktivitaetResponse>(`/aktivitaeten/${id}`, {
      method: "PATCH",
      body: { bilder },
    });
    return mapAktivitaet(res.aktivitaet);
  }
  return mapAktivitaet(created.aktivitaet);
}

// PATCH /aktivitaeten/:id — bestehende Aktivität bearbeiten (nur Admin, im
// Backend erzwungen). Wie beim Erstellen: neue lokale Bilder hochladen, bereits
// hochgeladene http-URLs unverändert übernehmen. modulId bleibt unangetastet
// (PATCH ändert die Modul-Zuordnung nicht). Gibt die aktualisierte Aktivität.
export async function aktualisiereAktivitaet(
  id: string,
  input: NeueAktivitaet,
  lokaleBilder: string[]
): Promise<UIAktivitaet> {
  const hochgeladen = await Promise.all(
    lokaleBilder.map((b) =>
      b.startsWith("http")
        ? Promise.resolve(b)
        : uploadBild(b, "aktivitaet-cover", { aktivitaetId: id })
    )
  );
  const bilder = hochgeladen.filter((b): b is string => !!b);

  const res = await apiFetch<GetAktivitaetResponse>(`/aktivitaeten/${id}`, {
    method: "PATCH",
    body: {
      titel: input.titel,
      beschreibung: input.beschreibung,
      bilder,
      adresseStrasse: input.adresseStrasse,
      adressePlzOrt: input.adressePlzOrt,
      ortKurz: input.ortKurz,
      koordinatenLat: input.koordinatenLat,
      koordinatenLng: input.koordinatenLng,
      startAt: input.startAt,
      dauerMinuten: input.dauerMinuten,
      maxPlaetze: input.maxPlaetze,
      sichtbarkeit: input.sichtbarkeit === "private" ? "PRIVATE" : "PUBLIC",
    },
  });
  return mapAktivitaet(res.aktivitaet);
}

// POST /aktivitaeten/:id/einladungen — jemanden zu einem Gruppentreffen
// einladen. Backend legt die (unsichtbare) Backing-Einladung + die sichtbare
// Chat-Proposal-Karte im gemeinsamen 1:1-Chat an. profileId = echte Profil-id
// der einzuladenden Person.
export async function einladeZuAktivitaet(
  aktivitaetId: string,
  profileId: string
): Promise<void> {
  await apiFetch(`/aktivitaeten/${aktivitaetId}/einladungen`, {
    method: "POST",
    body: { profileId },
  });
}
