import { apiFetch } from "../lib/api";
import { getModul, getModuldatenbank } from "./katalog";
import type {
  GetMeKurseResponse,
  PostMeKurseResponse,
} from "../types/api";

// Wrapper rund um die belegten Module (user_module) und die Moduldatenbank.
// Mappt das reiche Backend-Shape auf schlanke, namensbasierte UI-Shapes,
// damit die Screens datenquellen-agnostisch bleiben.

export type UIMeinKurs = {
  id: string; // = modulId
  name: string;
  ects: number | null;
  semester: number | null;
  anzahlTeilnehmer: number;
};

export type UIKatalogModul = {
  id: string;
  name: string;
  nummer: string;
  ects: number | null;
};

export type UIKursTeilnehmer = {
  id: string; // Profile-/Person-id
  name: string;
  bild: string | null;
  semester: number | null;
};

export type UIKursDetail = {
  id: string;
  name: string;
  nummer: string;
  ects: number | null;
  anzahlTeilnehmer: number;
  teilnehmer: UIKursTeilnehmer[];
};

// GET /me/kurse — meine belegten Module (mit Teilnehmerzahl).
export async function ladeMeineKurse(): Promise<UIMeinKurs[]> {
  const res = await apiFetch<GetMeKurseResponse>("/me/kurse");
  return res.kurse.map((k) => ({
    id: k.modulId,
    name: k.name,
    ects: k.ects,
    semester: k.semester,
    anzahlTeilnehmer: k.anzahlTeilnehmer,
  }));
}

// POST /me/kurse — Modul belegen (idempotent; aktualisiert Semester).
export async function belegeModul(
  modulId: string,
  semester: number | null = null
): Promise<void> {
  await apiFetch<PostMeKurseResponse>("/me/kurse", {
    method: "POST",
    body: { modulId, semester },
  });
}

// DELETE /me/kurse/:modulId — Modul abwählen (idempotent).
export async function entferneModul(modulId: string): Promise<void> {
  await apiFetch(`/me/kurse/${modulId}`, { method: "DELETE" });
}

// GET /studiengang/:id/moduldatenbank → flache Modulliste des Studiengangs.
export async function ladeStudiengangModule(
  studiengangId: string
): Promise<UIKatalogModul[]> {
  const res = await getModuldatenbank(studiengangId);
  return res.module.map((m) => ({
    id: m.id,
    name: m.name,
    nummer: m.nummer,
    ects: m.ects,
  }));
}

// GET /modul/:id → Detail mit Teilnehmerliste (für die Kurs-/Teilnehmer-Übersicht).
export async function ladeKursDetail(modulId: string): Promise<UIKursDetail> {
  const m = await getModul(modulId);
  return {
    id: m.id,
    name: m.name,
    nummer: m.nummer,
    ects: m.ects,
    anzahlTeilnehmer: m.anzahlTeilnehmer,
    teilnehmer: m.teilnehmer.map((t) => ({
      id: t.id,
      name: t.name,
      bild: t.bild,
      semester: t.semester,
    })),
  };
}
