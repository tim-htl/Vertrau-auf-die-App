// Profil-Fragen-Katalog (Mock). Spiegelt den DB-Seed in
// backend/prisma/seed.ts — finale Liste vom 2026-06-12. Sobald der
// Profil-Tab live geht (Phase 4d), kommt der Katalog stattdessen via
// GET /profil-fragen aus dem Backend und die ids werden zu UUIDs.

export const MAX_FRAGEN = 5;
export const MAX_ANTWORT_LAENGE = 200;

export type ProfilFrage = {
  id: string;
  text: string;
};

export type FrageAntwort = {
  frageId: string;
  antwort: string;
};

export const PROFIL_FRAGEN: ProfilFrage[] = [
  { id: "f01", text: "2 Lügen, eine Wahrheit" },
  { id: "f02", text: "Was ist dein Lieblingslied?" },
  { id: "f03", text: "Wenn du eine berühmte Persönlichkeit (tot oder lebendig) treffen könntest, wer wäre das und warum?" },
  { id: "f04", text: "Wenn du in einem fiktiven Universum leben müsstest, welches wäre das?" },
  { id: "f05", text: "Was ist deine Lieblings-Kombination beim Essen, die andere Leute super seltsam finden?" },
  { id: "f06", text: "Wenn du jetzt sofort an einen beliebigen Ort auf der Welt reisen könntest, wo würdest du landen und warum?" },
  { id: "f07", text: "Welche Superkraft hättest du gern?" },
  { id: "f08", text: "Wenn du eine Zeitreisemaschine hättest, zu welchem Punkt würdest du reisen?" },
  { id: "f09", text: "Was ist dein nutzlosestes Talent?" },
  { id: "f10", text: "Was ist deine unpopulärste Meinung?" },
  { id: "f11", text: "Was ist dein liebster unnützer Fakt?" },
  { id: "f12", text: "Was ist das Spontanste, das du je gemacht hast?" },
  { id: "f13", text: "Was steht ganz oben auf deiner Bucket List?" },
  { id: "f14", text: "Was war dein Kindheits-Berufswunsch?" },
  { id: "f15", text: "Wofür könntest du spontan einen einstündigen Vortrag halten — ohne jede Vorbereitung?" },
  { id: "f16", text: "Prokrastination deluxe: Was tust du, wenn du eigentlich lernen solltest?" },
];

export function frageText(frageId: string): string {
  return PROFIL_FRAGEN.find((f) => f.id === frageId)?.text ?? "Unbekannte Frage";
}
