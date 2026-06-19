import { apiFetch } from "../lib/api";
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
  };
}

// GET /aktivitaeten — Feed des Treffen-Tabs: nur echte GRUPPENTREFFEN
// (ohne Modul). Lerngruppen (= Aktivität mit Modul) gehören NICHT hierher,
// sondern sind über das jeweilige Modul erreichbar (siehe ladeLerngruppenFuerModul).
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
